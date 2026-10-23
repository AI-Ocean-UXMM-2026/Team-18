// ===========================================================================
//  routes/auth.ts — sign up (students), mentor applications, sign in (all).
// ===========================================================================
import { Router } from "express";
import { z } from "zod";
import { ENV } from "../env.js";
import { allow, createToken, hashPassword, verifyPassword } from "../auth.js";
import { audit, one, tx } from "../db.js";
import { badRequest, body, conflict, route, sessionOf, tooMany, unauthorized } from "../http.js";

export const authRouter = Router();
const email = z.string().trim().toLowerCase().email().max(320);
const password = z.string().min(8, "Password needs at least 8 characters.").max(200);
const name = z.string().trim().min(1).max(120);
async function profile(uid: number) {
  return one(`SELECT u.id, u.email, u.name, u.role, u.admin_role AS "adminRole", u.language, (u.is_pro AND COALESCE(u.pro_expires_at > now(), false)) AS "isPro", u.pro_expires_at AS "proExpiresAt", u.ai_used AS "aiUsed",
      m.status AS "mentorStatus" FROM users u LEFT JOIN mentors m ON m.user_id = u.id WHERE u.id = $1`, [uid]);
}

authRouter.post("/auth/register", route(async req => {
  const b = body(req, z.object({ email, password, name }));
  if (await one("SELECT 1 FROM users WHERE email = $1", [b.email])) throw conflict("An account with this email already exists. Sign in instead.");
  const u = await one<{ id: number }>("INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'student') RETURNING id", [b.email, hashPassword(b.password), b.name]);
  const token = await createToken({ uid: u!.id, role: "student", adminRole: null });
  return { token, user: await profile(u!.id) };
}));

authRouter.post("/auth/mentor-apply", route(async req => {
  const b = body(req, z.object({ email, password, name, title: z.string().trim().min(2).max(160), years: z.number().int().min(1, "Experience must be at least 1 year.").max(50, "Experience cannot exceed 50 years."), fields: z.array(z.number().int().min(1).max(11)).min(1).max(5), languages: z.string().trim().max(120).optional(), bio: z.string().trim().max(1000).optional() }));
  if (await one("SELECT 1 FROM users WHERE email = $1", [b.email])) throw conflict("An account with this email already exists.");
  await tx(async c => {
    const u = (await c.query("INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'mentor') RETURNING id", [b.email, hashPassword(b.password), b.name])).rows[0];
    await c.query("INSERT INTO mentors (user_id, title, years, fields, languages, bio, status) VALUES ($1, $2, $3, $4, $5, $6, 'pending')", [u.id, b.title, b.years, b.fields, b.languages ?? "Myanmar · English", b.bio ?? null]);
  });
  return { ok: true, message: "Application sent. The CareerNest team will review it before you can sign in." };
}));

authRouter.post("/auth/login", route(async req => {
  const ip = req.ip || "local";
  if (!allow("login:" + ip, ENV.loginRateLimit, ENV.loginRateWindowSeconds * 1000)) throw tooMany("Too many sign-in attempts. Wait a minute and try again.");
  const b = body(req, z.object({ email, password: z.string().min(1), portal: z.enum(["student", "mentor", "admin"]) }));
  const u = await one<{ id: number; password_hash: string; role: "student" | "mentor" | "admin"; admin_role: any; active: boolean }>("SELECT id, password_hash, role, admin_role, active FROM users WHERE email = $1", [b.email]);
  if (!u || !verifyPassword(b.password, u.password_hash)) throw unauthorized("Email or password is not correct.");
  if (!u.active) throw unauthorized("This account is switched off. Contact CareerNest.");
  if (u.role !== b.portal) throw unauthorized(`This is not a ${b.portal} account. Use the ${u.role} sign-in page.`);
  if (u.role === "mentor") {
    const m = await one<{ status: string }>("SELECT status FROM mentors WHERE user_id = $1", [u.id]);
    if (m?.status === "pending") throw unauthorized("Your mentor application is still being reviewed.");
    if (m?.status !== "active") throw unauthorized("Your mentor account is not active. Contact CareerNest.");
  }
  await audit(u.id, "auth.login", b.portal);
  return { token: await createToken({ uid: u.id, role: u.role, adminRole: u.admin_role }), user: await profile(u.id) };
}));

authRouter.get("/auth/me", route(async req => ({ user: await profile(sessionOf(req).uid) })));

authRouter.put("/auth/profile", route(async req => {
  const b = body(req, z.object({ name }));
  await one("UPDATE users SET name = $1 WHERE id = $2", [b.name, sessionOf(req).uid]);
  return { user: await profile(sessionOf(req).uid) };
}));

authRouter.put("/auth/language", route(async req => {
  const b = body(req, z.object({ language: z.enum(["en", "my"]) }));
  await one("UPDATE users SET language = $1 WHERE id = $2", [b.language, sessionOf(req).uid]);
  return { ok: true };
}));

authRouter.put("/auth/password", route(async req => {
  const b = body(req, z.object({ current: z.string().min(1), next: password }));
  const u = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [sessionOf(req).uid]);
  if (!u || !verifyPassword(b.current, u.password_hash)) throw badRequest("Your current password is not correct.");
  const current = sessionOf(req);
  await one("UPDATE users SET password_hash = $1 WHERE id = $2", [hashPassword(b.next), current.uid]);
  return { ok: true, token: await createToken(current) };
}));
