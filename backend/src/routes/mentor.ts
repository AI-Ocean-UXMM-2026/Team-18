// ===========================================================================
//  routes/mentor.ts — the mentor portal.
//  A mentor only ever sees bookings made with them, and only the student's
//  first name, level, career and question (no contact details).
// ===========================================================================
import { Router } from "express";
import { z } from "zod";
import { audit, one, query } from "../db.js";
import { badRequest, body, conflict, notFound, requireRole, route, sessionOf } from "../http.js";

export const mentorRouter = Router();
mentorRouter.use("/mentor", requireRole("mentor"));

const BOOKING_SELECT = `SELECT b.id, b.status, b.question, b.meeting_link AS "meetingLink", b.created_at AS "createdAt", s.starts_at AS "startsAt", s.minutes,
  split_part(u.name, ' ', 1) AS "studentFirstName", j.data->>'level' AS level, j.data->>'careerId' AS "careerId", j.data->'majors' AS majors
  FROM bookings b JOIN mentor_slots s ON s.id = b.slot_id JOIN users u ON u.id = b.student_id LEFT JOIN journeys j ON j.student_id = b.student_id`;

mentorRouter.get("/mentor/overview", route(async req => {
  const id = sessionOf(req).uid;
  const counts = await one(`SELECT
      count(*) FILTER (WHERE b.status = 'pending')::int AS pending,
      count(*) FILTER (WHERE b.status = 'confirmed' AND s.starts_at > now())::int AS upcoming,
      count(*) FILTER (WHERE b.status = 'completed')::int AS completed
    FROM bookings b JOIN mentor_slots s ON s.id = b.slot_id WHERE b.mentor_id = $1`, [id]);
  const free = await one(`SELECT count(*)::int AS n FROM mentor_slots s WHERE s.mentor_id = $1 AND s.starts_at > now()
    AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = s.id AND b.status IN ('pending', 'confirmed'))`, [id]);
  const next = await query(`${BOOKING_SELECT} WHERE b.mentor_id = $1 AND b.status = 'confirmed' AND s.starts_at > now() ORDER BY s.starts_at LIMIT 5`, [id]);
  return { ...counts, freeSlots: free?.n ?? 0, next };
}));

mentorRouter.get("/mentor/bookings", route(async req => ({
  bookings: await query(`${BOOKING_SELECT} WHERE b.mentor_id = $1 ORDER BY (b.status = 'pending') DESC, s.starts_at`, [sessionOf(req).uid]),
})));

async function change(req: any, from: string[], to: string, extra = "") {
  const row = await one(`UPDATE bookings SET status = $1, responded_at = now() ${extra} WHERE id = $2 AND mentor_id = $3 AND status::text = ANY($4::text[]) RETURNING id`,
    [to, Number(req.params.id), sessionOf(req).uid, from]);
  if (!row) throw notFound("Booking not found, or it has already changed.");
  await audit(sessionOf(req).uid, `booking.${to}`, `booking:${row.id}`);
  return { ok: true };
}
mentorRouter.post("/mentor/bookings/:id/accept", route(async req => {
  const b = body(req, z.object({ meetingLink: z.string().trim().url().max(300).optional() }));
  if (b.meetingLink) await one("UPDATE bookings SET meeting_link = $1 WHERE id = $2 AND mentor_id = $3", [b.meetingLink, Number(req.params.id), sessionOf(req).uid]);
  return change(req, ["pending"], "confirmed");
}));
mentorRouter.post("/mentor/bookings/:id/decline", route(req => change(req, ["pending"], "declined")));
mentorRouter.post("/mentor/bookings/:id/complete", route(req => change(req, ["confirmed"], "completed")));
mentorRouter.post("/mentor/bookings/:id/no-show", route(req => change(req, ["confirmed"], "no_show")));
mentorRouter.post("/mentor/bookings/:id/cancel", route(req => change(req, ["confirmed"], "cancelled")));

// --- availability: students can only book these times ---------------------------------
mentorRouter.get("/mentor/slots", route(async req => ({
  slots: await query(`SELECT s.id, s.starts_at AS "startsAt", s.minutes,
      (SELECT b.status FROM bookings b WHERE b.slot_id = s.id AND b.status IN ('pending', 'confirmed') LIMIT 1) AS "bookingStatus"
    FROM mentor_slots s WHERE s.mentor_id = $1 AND s.starts_at > now() ORDER BY s.starts_at`, [sessionOf(req).uid]),
})));
mentorRouter.post("/mentor/slots", route(async req => {
  const b = body(req, z.object({ startsAt: z.string().datetime({ offset: true }) }));
  if (new Date(b.startsAt).getTime() < Date.now() + 3_600_000) throw badRequest("Add times at least 1 hour from now.");
  try { return { slot: await one(`INSERT INTO mentor_slots (mentor_id, starts_at) VALUES ($1, $2) RETURNING id, starts_at AS "startsAt", minutes`, [sessionOf(req).uid, b.startsAt]) }; }
  catch (e: any) { if (e?.code === "23505") throw conflict("You already have this time."); throw e; }
}));
mentorRouter.delete("/mentor/slots/:id", route(async req => {
  const busy = await one("SELECT 1 FROM bookings WHERE slot_id = $1 AND status IN ('pending', 'confirmed')", [Number(req.params.id)]);
  if (busy) throw conflict("A student has booked this time. Cancel or decline the booking first.");
  const row = await one("DELETE FROM mentor_slots WHERE id = $1 AND mentor_id = $2 RETURNING id", [Number(req.params.id), sessionOf(req).uid]);
  if (!row) throw notFound("Time not found.");
  return { ok: true };
}));

// --- profile -----------------------------------------------------------------------
mentorRouter.get("/mentor/profile", route(async req => ({
  profile: await one(`SELECT u.name, u.email, m.title, m.years, m.fields, m.languages, m.bio, m.status FROM mentors m JOIN users u ON u.id = m.user_id WHERE m.user_id = $1`, [sessionOf(req).uid]),
})));
mentorRouter.put("/mentor/profile", route(async req => {
  const b = body(req, z.object({ languages: z.string().trim().max(120), bio: z.string().trim().max(1000) }));
  await one("UPDATE mentors SET languages = $1, bio = $2 WHERE user_id = $3", [b.languages, b.bio, sessionOf(req).uid]);
  return { ok: true, note: "Job title and fields are changed by the PathFinder team." };
}));
