// ===========================================================================
//  routes/admin.ts — the admin portal.
//    super    everything (incl. payment accounts, admins, audit log)
//    ops      payments, mentors, students
//    content  universities (sheet check) and content
// ===========================================================================
import { Router } from "express";
import { z } from "zod";
import { ENV } from "../env.js";
import { hashPassword } from "../auth.js";
import { CAREERS, QUESTIONS, G12_UNIS, G12_PROGRAMS } from "../data.js";
import { addSchoolToCache, adminSchoolsCount, getSchools, schoolsSource, type School } from "../schools.js";
import { RETIRED_DEMO_MENTORS } from "../demoAccounts.js";
import { audit, one, query, tx } from "../db.js";
import { badRequest, body, conflict, notFound, requireAdmin, requireRole, route, sessionOf } from "../http.js";

export const adminRouter = Router();
adminRouter.use("/admin", requireRole("admin"));
const ops = requireAdmin("ops"), content = requireAdmin("content"), superOnly = requireAdmin();

adminRouter.get("/admin/stats", route(async () => ({
  ...(await one(`SELECT
     (SELECT count(*) FROM users WHERE role = 'student')::int AS students,
     (SELECT count(*) FROM journeys WHERE jsonb_typeof(data->'answers') = 'object' AND (SELECT count(*) FROM jsonb_object_keys(data->'answers')) >= 20)::int AS "quizzesCompleted",
     (SELECT count(*) FROM users WHERE is_pro)::int AS "proMembers",
     (SELECT count(*) FROM payments WHERE status IN ('pending', 'disputed'))::int AS "paymentsToCheck",
     (SELECT count(*) FROM mentors WHERE status = 'pending')::int AS "mentorApplications",
     (SELECT count(*) FROM bookings WHERE status IN ('confirmed', 'completed'))::int AS "mentorSessions",
     (SELECT coalesce(sum(amount_mmk), 0) FROM payments WHERE status = 'approved' AND decided_at > date_trunc('month', now()))::int AS "revenueThisMonth"`)),
  careers: await query(`SELECT data->>'careerId' AS "careerId", count(*)::int AS n FROM journeys WHERE data->>'careerId' IS NOT NULL GROUP BY 1 ORDER BY n DESC LIMIT 5`),
  levels: await query(`SELECT data->>'level' AS level, count(*)::int AS n FROM journeys WHERE data->>'level' IS NOT NULL GROUP BY 1`),
})));

// --- payments ----------------------------------------------------------------------
adminRouter.get("/admin/payments", ops, route(async req => {
  const status = String(req.query.status ?? "open");
  const where = status === "open" ? "p.status IN ('pending', 'disputed')" : "p.status IN ('approved', 'rejected')";
  return {
    price: ENV.proPrice,
    payments: await query(`SELECT p.id, p.status, p.provider, pa.label AS "providerLabel", p.account_name AS "accountName", p.account_number AS "accountNumber",
        p.amount_mmk AS amount, p.transaction_id AS "transactionId", p.proof_data AS proof, p.reason, p.dispute_used AS "disputeUsed",
        p.created_at AS "createdAt", p.decided_at AS "decidedAt", u.name AS "studentName", u.email AS "studentEmail"
      FROM payments p JOIN users u ON u.id = p.student_id LEFT JOIN payment_accounts pa ON pa.provider = p.provider
      WHERE ${where} ORDER BY p.created_at ${status === "open" ? "ASC" : "DESC"} LIMIT 100`),
  };
}));

adminRouter.post("/admin/payments/:id/approve", ops, route(async req => {
  const b = body(req, z.object({ checked: z.literal(true, { message: "Confirm you checked the money arrived in our account." }) }));
  void b;
  const adminId = sessionOf(req).uid;
  return tx(async c => {
    const p = (await c.query("SELECT id, student_id, status FROM payments WHERE id = $1 FOR UPDATE", [Number(req.params.id)])).rows[0];
    if (!p) throw notFound("Payment not found.");
    if (!["pending", "disputed"].includes(p.status)) throw conflict("This payment was already decided.");
    await c.query("UPDATE payments SET status = 'approved', reason = NULL, decided_by = $1, decided_at = now() WHERE id = $2", [adminId, p.id]);
    await c.query("UPDATE users SET is_pro = true WHERE id = $1", [p.student_id]);
    await c.query("INSERT INTO audit_log (actor_id, action, target) VALUES ($1, 'payment.approve', $2)", [adminId, `payment:${p.id}`]);
    return { ok: true, message: "Approved. Pro is now on for this student." };
  });
}));

adminRouter.post("/admin/payments/:id/reject", ops, route(async req => {
  const b = body(req, z.object({ reason: z.string().trim().min(1, "Write a reason.").max(300) }));
  const row = await one(`UPDATE payments SET status = 'rejected', reason = $1, decided_by = $2, decided_at = now() WHERE id = $3 AND status IN ('pending', 'disputed') RETURNING id`,
    [b.reason, sessionOf(req).uid, Number(req.params.id)]);
  if (!row) throw conflict("This payment was already decided.");
  await audit(sessionOf(req).uid, "payment.reject", `payment:${row.id}`, { reason: b.reason });
  return { ok: true };
}));

adminRouter.get("/admin/payment-accounts", superOnly, route(async () => ({
  accounts: await query(`SELECT provider, label, enabled, account_name AS "accountName", account_number AS "accountNumber" FROM payment_accounts ORDER BY label`),
})));
adminRouter.put("/admin/payment-accounts/:provider", superOnly, route(async req => {
  const b = body(req, z.object({ enabled: z.boolean(), accountName: z.string().trim().max(120), accountNumber: z.string().trim().max(40) }));
  if (b.enabled && (!b.accountName || !b.accountNumber)) throw badRequest("Add the account name and number before switching it on.");
  const row = await one(`UPDATE payment_accounts SET enabled = $1, account_name = $2, account_number = $3 WHERE provider = $4 RETURNING provider`, [b.enabled, b.accountName, b.accountNumber, req.params.provider]);
  if (!row) throw notFound("Provider not found.");
  await audit(sessionOf(req).uid, "payment_account.update", req.params.provider, b);
  return { ok: true };
}));

// --- mentors -----------------------------------------------------------------------
adminRouter.get("/admin/mentors", ops, route(async () => ({
  mentors: await query(`SELECT u.id, u.name, u.email, u.active, m.title, m.years, m.fields, m.languages, m.status, m.created_at AS "createdAt",
      (SELECT count(*) FROM bookings b WHERE b.mentor_id = m.user_id AND b.status IN ('confirmed', 'completed'))::int AS sessions,
      (SELECT count(*) FROM bookings b WHERE b.mentor_id = m.user_id AND b.status = 'no_show')::int AS "noShows",
      (SELECT count(*) FROM mentor_slots s WHERE s.mentor_id = m.user_id AND s.starts_at > now())::int AS "futureSlots"
    FROM mentors m JOIN users u ON u.id = m.user_id
    WHERE NOT (u.email = ANY($1::text[]))
    ORDER BY (m.status = 'pending') DESC, u.name`, [RETIRED_DEMO_MENTORS]),
})));
adminRouter.post("/admin/mentors/:id/status", ops, route(async req => {
  const b = body(req, z.object({ status: z.enum(["active", "rejected", "suspended"]) }));
  const row = await one("UPDATE mentors SET status = $1 WHERE user_id = $2 RETURNING user_id", [b.status, Number(req.params.id)]);
  if (!row) throw notFound("Mentor not found.");
  await audit(sessionOf(req).uid, `mentor.${b.status}`, `user:${row.user_id}`);
  return { ok: true };
}));

// --- students ----------------------------------------------------------------------
adminRouter.get("/admin/students", ops, route(async req => {
  const q = `%${String(req.query.q ?? "").trim()}%`;
  return {
    students: await query(`SELECT u.id, u.name, u.email, u.is_pro AS "isPro", u.active, u.created_at AS "createdAt", j.data->>'level' AS level, j.data->>'careerId' AS "careerId",
        (SELECT count(*) FROM bookings b WHERE b.student_id = u.id)::int AS bookings
      FROM users u LEFT JOIN journeys j ON j.student_id = u.id WHERE u.role = 'student' AND (u.name ILIKE $1 OR u.email ILIKE $1) ORDER BY u.created_at DESC LIMIT 100`, [q]),
  };
}));
adminRouter.post("/admin/students/:id/active", ops, route(async req => {
  const b = body(req, z.object({ active: z.boolean() }));
  await one("UPDATE users SET active = $1 WHERE id = $2 AND role = 'student'", [b.active, Number(req.params.id)]);
  await audit(sessionOf(req).uid, b.active ? "student.activate" : "student.deactivate", `user:${req.params.id}`);
  return { ok: true };
}));
adminRouter.delete("/admin/students/:id", superOnly, route(async req => {
  const row = await one("DELETE FROM users WHERE id = $1 AND role = 'student' RETURNING id", [Number(req.params.id)]);
  if (!row) throw notFound("Student not found.");
  await audit(sessionOf(req).uid, "student.delete", `user:${row.id}`);
  return { ok: true };
}));

// --- universities & content -----------------------------------------------------------
adminRouter.get("/admin/universities", content, route(async () => {
  const schools = await getSchools();
  const stale = (d: string) => !d || Date.now() - new Date(d).getTime() > 182 * 86_400_000;
  return {
    source: schoolsSource(), sheetConnected: !!ENV.schoolsSheetUrl, adminAdded: adminSchoolsCount(),
    g12: { universities: G12_UNIS.length, programs: G12_PROGRAMS.length },
    schools: schools.map(s => ({ id: s.id, code: s.code, name: s.name, country: s.country, hasScholarship: s.hasScholarship, ged: s.ged.ok, igcse: s.igcse.ok, lastChecked: s.lastChecked, source: s.source,
      needsCheck: stale(s.lastChecked) || s.ged.ok === "confirm" || s.igcse.ok === "confirm" })),
  };
}));
adminRouter.post("/admin/universities", content, route(async req => {
  const b = body(req, z.object({
    code: z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, or hyphens for the code."),
    name: z.string().trim().min(2).max(180), country: z.string().trim().min(2).max(100), city: z.string().trim().max(120).default(""),
    type: z.string().trim().max(120).default("University"), mode: z.string().trim().max(80).default("On campus"), established: z.string().trim().max(20).default(""),
    fields: z.array(z.number().int().positive().max(999)).max(30).default([]), description: z.string().trim().max(2000).default(""),
    partner: z.string().trim().max(300).default(""), programs: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
    ged: z.object({ ok: z.enum(["yes", "no", "confirm"]), note: z.string().trim().max(2000).default(""), tests: z.string().trim().max(1000).default("") }),
    igcse: z.object({ ok: z.enum(["yes", "no", "confirm"]), note: z.string().trim().max(2000).default("") }),
    english: z.string().trim().max(500).default(""), admission: z.string().trim().max(2000).default(""), pathway: z.string().trim().max(1000).default(""),
    duration: z.string().trim().max(100).default(""), intakes: z.string().trim().max(500).default(""), hasScholarship: z.boolean().default(false),
    scholarship: z.string().trim().max(1000).default(""), website: z.string().trim().max(500).default(""), source: z.string().trim().max(500).default(""), photo: z.string().trim().max(500).default(""),
  }));
  const id = b.code.toLowerCase();
  const schools = await getSchools();
  if (schools.some(s => s.id.toLowerCase() === id || s.code.toLowerCase() === b.code.toLowerCase())) throw conflict("A university with this code already exists.");
  const school: School = { ...b, id, lastChecked: new Date().toISOString().slice(0, 10), source: b.source || b.website };
  const row = await one("INSERT INTO admin_universities (id, data, created_by) VALUES ($1, $2, $3) RETURNING id", [id, JSON.stringify(school), sessionOf(req).uid]);
  await audit(sessionOf(req).uid, "university.create", `university:${id}`, { code: school.code, name: school.name });
  addSchoolToCache(school);
  return { ok: true, id: row!.id };
}));
adminRouter.get("/admin/content", content, route(() => ({
  careers: CAREERS.map(c => ({ id: c.id, title: c.t, majors: c.majors.map(m => m.n), videoLength: c.video.len, hasVideo: !!c.video.url })),
  questions: QUESTIONS.length,
})));

// --- admins & audit (super only) --------------------------------------------------------
adminRouter.get("/admin/admins", superOnly, route(async () => ({
  admins: await query(`SELECT id, name, email, admin_role AS "adminRole", active, created_at AS "createdAt" FROM users WHERE role = 'admin' ORDER BY created_at`),
})));
adminRouter.post("/admin/admins", superOnly, route(async req => {
  const b = body(req, z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().toLowerCase().email(), password: z.string().min(8), adminRole: z.enum(["super", "ops", "content"]) }));
  if (await one("SELECT 1 FROM users WHERE email = $1", [b.email])) throw conflict("This email is already used.");
  const row = await one("INSERT INTO users (email, password_hash, name, role, admin_role) VALUES ($1, $2, $3, 'admin', $4) RETURNING id", [b.email, hashPassword(b.password), b.name, b.adminRole]);
  await audit(sessionOf(req).uid, "admin.create", `user:${row.id}`, { adminRole: b.adminRole });
  return { ok: true };
}));
adminRouter.get("/admin/audit", superOnly, route(async () => ({
  log: await query(`SELECT a.id, a.action, a.target, a.details, a.created_at AS "createdAt", u.name AS actor FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 200`),
})));
