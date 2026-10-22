// ===========================================================================
//  routes/student.ts — the student portal.
//    content, quiz, universities, mentor booking, Pro payment
// ===========================================================================
import { createHash } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { ENV } from "../env.js";
import { CAREERS, CODES, FIELD_NAMES, G12_PROGRAMS, G12_UNIS, QUESTIONS, careerById } from "../data.js";
import { hollandCode, codeScores, rankCareers, reasonsFor, unanswered } from "../quiz.js";
import { getSchools } from "../schools.js";
import { audit, one, query } from "../db.js";
import { HttpError, badRequest, body, conflict, notFound, requireRole, route, sessionOf } from "../http.js";

export const studentRouter = Router();
const student = requireRole("student");

// --- content (public) -----------------------------------------------------------
studentRouter.get("/content", route(() => ({ questions: QUESTIONS, codes: CODES, careers: CAREERS, fields: FIELD_NAMES })));

// --- journey (saved progress) ---------------------------------------------------
studentRouter.get("/me/journey", student, route(async req => {
  const row = await one<{ data: any }>("SELECT data FROM journeys WHERE student_id = $1", [sessionOf(req).uid]);
  return { journey: row?.data ?? {} };
}));
studentRouter.put("/me/journey", student, route(async req => {
  const data = body(req, z.object({
    level: z.enum(["g12", "ged", "igcse"]).nullable().optional(), answers: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
    careerId: z.string().max(40).nullable().optional(), majors: z.array(z.string().max(80)).max(2).optional(),
    shortlist: z.array(z.string().max(40)).max(30).optional(), compare: z.array(z.string().max(40)).max(3).optional(),
    videoChoice: z.enum(["watch", "skip"]).nullable().optional(), watched: z.record(z.string(), z.boolean()).optional(),
  }));
  await query(`INSERT INTO journeys (student_id, data, updated_at) VALUES ($1, $2, now())
    ON CONFLICT (student_id) DO UPDATE SET data = journeys.data || EXCLUDED.data, updated_at = now()`, [sessionOf(req).uid, JSON.stringify(data)]);
  return { ok: true };
}));

// --- quiz --------------------------------------------------------------------
studentRouter.post("/quiz/score", route(req => {
  const { answers } = body(req, z.object({ answers: z.record(z.string(), z.number().int().min(1).max(5)) }));
  const missing = unanswered(answers);
  if (missing.length) throw badRequest(`Please answer all questions. Missing: ${missing.map(i => i + 1).join(", ")}`);
  return {
    scores: codeScores(answers), holland: hollandCode(answers),
    top: rankCareers(answers).slice(0, 3).map(({ career, pct }, i) => ({ priority: i + 1, career, pct, reasons: reasonsFor(career, answers) })),
  };
}));

// --- universities (no marks: information only) ---------------------------------------
studentRouter.get("/universities", route(async req => {
  const level = String(req.query.level ?? "g12");
  const fields = String(req.query.fields ?? "").split(",").map(Number).filter(n => n > 0);
  const onlyScholarship = req.query.scholarship === "1";
  if (level === "g12") {
    const items = G12_UNIS.map(u => {
      const programs = G12_PROGRAMS.filter(p => p.university === u.id && (!fields.length || fields.includes(p.field))).map(p => p.name);
      return programs.length ? { key: `u${u.id}`, kind: "g12" as const, university: u, programs } : null;
    }).filter(Boolean) as any[];
    items.sort((a, b) => b.programs.length - a.programs.length || a.university.name.localeCompare(b.university.name));
    return { level, items };
  }
  const schools = (await getSchools())
    .filter(s => !fields.length || s.fields.some(f => fields.includes(f)))
    .filter(s => !onlyScholarship || s.hasScholarship);
  return { level, items: schools.map(s => ({ key: `i${s.id}`, kind: "intl" as const, school: s })) };
}));

// --- mentors & bookings (step 3, optional) ---------------------------------------------
studentRouter.get("/mentors", student, route(async req => {
  const career = careerById(String(req.query.careerId ?? ""));
  const mentors = await query(`SELECT u.id, u.name, m.title, m.years, m.fields, m.languages, m.bio,
      (SELECT json_agg(json_build_object('id', s.id, 'startsAt', s.starts_at, 'minutes', s.minutes) ORDER BY s.starts_at)
         FROM mentor_slots s WHERE s.mentor_id = m.user_id AND s.starts_at > now() + interval '12 hours'
         AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = s.id AND b.status IN ('pending', 'confirmed'))) AS slots
    FROM mentors m JOIN users u ON u.id = m.user_id WHERE m.status = 'active' AND u.active ORDER BY m.years DESC, u.name`);
  const rec = (m: any) => !!career && m.fields.some((f: number) => career.f.includes(f));
  return { mentors: mentors.map(m => ({ ...m, slots: m.slots ?? [], recommended: rec(m) })).sort((a, b) => Number(b.recommended) - Number(a.recommended)) };
}));

studentRouter.post("/bookings", student, route(async req => {
  const uid = sessionOf(req).uid;
  const me = await one<{ is_pro: boolean }>(`SELECT is_pro FROM users WHERE id = $1`, [uid]);
  if (!me?.is_pro) throw new HttpError(402, "Mentor sessions are part of PathFinder Pro.");
  const b = body(req, z.object({ slotId: z.number().int().positive(), question: z.string().trim().max(500).optional() }));
  const slot = await one<{ id: number; mentor_id: number; starts_at: string }>(
    `SELECT s.id, s.mentor_id, s.starts_at FROM mentor_slots s JOIN mentors m ON m.user_id = s.mentor_id
     WHERE s.id = $1 AND m.status = 'active' AND s.starts_at > now() + interval '12 hours'`, [b.slotId]);
  if (!slot) throw notFound("This time is no longer available. Please pick another.");
  const live = await one<{ n: number }>("SELECT count(*)::int AS n FROM bookings WHERE student_id = $1 AND status IN ('pending', 'confirmed')", [uid]);
  if ((live?.n ?? 0) >= 2) throw conflict("You can have at most 2 upcoming mentor sessions.");
  try {
    const row = await one(`INSERT INTO bookings (slot_id, mentor_id, student_id, question) VALUES ($1, $2, $3, $4) RETURNING id, status`, [slot.id, slot.mentor_id, uid, b.question ?? null]);
    return { booking: row, message: "Request sent. The mentor usually replies within 24 hours." };
  } catch (e: any) { if (e?.code === "23505") throw conflict("Someone just booked this time. Please pick another."); throw e; }
}));

studentRouter.get("/me/bookings", student, route(async req => ({
  bookings: await query(`SELECT b.id, b.status, b.question, b.meeting_link AS "meetingLink", b.created_at AS "createdAt", s.starts_at AS "startsAt", s.minutes,
      u.name AS "mentorName", m.title AS "mentorTitle" FROM bookings b JOIN mentor_slots s ON s.id = b.slot_id
      JOIN users u ON u.id = b.mentor_id JOIN mentors m ON m.user_id = b.mentor_id WHERE b.student_id = $1 ORDER BY s.starts_at DESC`, [sessionOf(req).uid]),
})));

studentRouter.post("/me/bookings/:id/cancel", student, route(async req => {
  const row = await one(`UPDATE bookings SET status = 'cancelled', responded_at = now() WHERE id = $1 AND student_id = $2 AND status IN ('pending', 'confirmed') RETURNING id`, [Number(req.params.id), sessionOf(req).uid]);
  if (!row) throw notFound("Booking not found or already finished.");
  return { ok: true };
}));

// --- Pro: pay outside the app, send screenshot, admin confirms ------------------------------
studentRouter.get("/pro", student, route(async req => {
  const uid = sessionOf(req).uid;
  const user = await one<{ is_pro: boolean; ai_used: number }>("SELECT is_pro, ai_used FROM users WHERE id = $1", [uid]);
  const accounts = await query(`SELECT provider, label, account_name AS "accountName", account_number AS "accountNumber" FROM payment_accounts WHERE enabled AND account_number <> '' ORDER BY label`);
  const latest = await one(`SELECT id, provider, account_name AS "accountName", account_number AS "accountNumber", amount_mmk AS amount, transaction_id AS "transactionId",
      status, reason, dispute_used AS "disputeUsed", created_at AS "createdAt", decided_at AS "decidedAt", proof_data AS proof
      FROM payments WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`, [uid]);
  return { isPro: !!user?.is_pro, aiUsed: user?.ai_used ?? 0, freeAiLimit: ENV.freeAiLimit, price: ENV.proPrice, accounts, latest };
}));

const MAX_PROOF_BYTES = 1024 * 1024;
studentRouter.post("/pro/payments", student, route(async req => {
  const uid = sessionOf(req).uid;
  const b = body(req, z.object({
    requestKey: z.string().uuid(), provider: z.string().min(2).max(16), amount: z.number().int().positive().max(100_000_000),
    transactionId: z.string().trim().regex(/^[A-Za-z0-9-]{6,30}$/, "Enter the transaction ID from your receipt (6–30 letters or numbers)."),
    proof: z.string().max(1_500_000),
  }));
  const again = await one("SELECT id, status FROM payments WHERE request_key = $1 AND student_id = $2", [b.requestKey, uid]);
  if (again) return { payment: again };                                          // same submission twice = one payment
  if ((await one<{ is_pro: boolean }>("SELECT is_pro FROM users WHERE id = $1", [uid]))?.is_pro) throw conflict("You already have Pro.");
  if (b.amount !== ENV.proPrice) throw badRequest(`Please send exactly ${ENV.proPrice.toLocaleString("en-US")} Ks.`);
  const acc = await one<{ account_name: string; account_number: string }>("SELECT account_name, account_number FROM payment_accounts WHERE provider = $1 AND enabled AND account_number <> ''", [b.provider]);
  if (!acc) throw badRequest("Choose an available payment app.");
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(b.proof);
  if (!m) throw badRequest("The screenshot must be a PNG, JPG or WEBP image.");
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > MAX_PROOF_BYTES) throw badRequest("The screenshot is larger than 1 MB.");
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (await one("SELECT 1 FROM payments WHERE transaction_id = $1", [b.transactionId])) throw conflict("This transaction ID was already used. Each payment can only be sent once.");
  if (await one("SELECT 1 FROM payments WHERE proof_sha256 = $1", [sha])) throw conflict("This screenshot was already sent.");
  if (await one("SELECT 1 FROM payments WHERE student_id = $1 AND status IN ('pending', 'disputed')", [uid])) throw conflict("You already have a payment waiting for checking.");
  const row = await one(`INSERT INTO payments (student_id, request_key, provider, account_name, account_number, amount_mmk, transaction_id, proof_data, proof_sha256)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, status`, [uid, b.requestKey, b.provider, acc.account_name, acc.account_number, b.amount, b.transactionId, b.proof, sha]);
  await audit(uid, "payment.submit", `payment:${row.id}`, { amount: b.amount, provider: b.provider });
  return { payment: row, message: "Sent. We will check your payment soon." };
}));

studentRouter.post("/pro/payments/:id/dispute", student, route(async req => {
  const row = await one(`UPDATE payments SET status = 'disputed', dispute_used = true WHERE id = $1 AND student_id = $2 AND status = 'rejected' AND NOT dispute_used AND proof_data IS NOT NULL RETURNING id`, [Number(req.params.id), sessionOf(req).uid]);
  if (!row) throw badRequest("A re-review is not possible for this payment. Please send a new payment.");
  return { ok: true };
}));
