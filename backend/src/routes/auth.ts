// ===========================================================================
//  routes/auth.ts — sign up (students), mentor applications, sign in (all).
// ===========================================================================
import { Router } from "express";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { ENV } from "../env.js";
import { allow, createToken, hashPassword, verifyPassword } from "../auth.js";
import { audit, one, query, tx } from "../db.js";
import { badRequest, body, conflict, route, sessionOf, tooMany, unauthorized, unavailable } from "../http.js";

export const authRouter = Router();
const email = z.string().trim().toLowerCase().email().max(320);
const password = z.string().min(8, "Password needs at least 8 characters.").max(200);
const name = z.string().trim().min(1).max(120);
const resetTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const genericResetMessage = "If an active account uses that email, we’ll send a password reset link shortly.";

async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ENV.emailFrom,
      to: [to],
      subject: "Reset your CareerNest password",
      text: `Use this one-time link to reset your CareerNest password. It expires in 30 minutes: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Use this one-time link to reset your CareerNest password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset my password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

async function profile(uid: number) {
  return one(`SELECT u.id, u.email, u.name, u.role, u.admin_role AS "adminRole", u.language, (u.is_pro AND COALESCE(u.pro_expires_at > now(), false)) AS "isPro", u.pro_expires_at AS "proExpiresAt", u.ai_used AS "aiUsed",
      m.status AS "mentorStatus" FROM users u LEFT JOIN mentors m ON m.user_id = u.id WHERE u.id = $1`, [uid]);
}

authRouter.post("/auth/register", route(async req => {
  const b = body(req, z.object({ email, password, name }));
  if (await one("SELECT 1 FROM users WHERE email = $1", [b.email])) throw conflict("An account with this email already exists. Sign in instead.");
  const u = await one<{ id: number; session_version: number }>("INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'student') RETURNING id, session_version", [b.email, hashPassword(b.password), b.name]);
  const token = await createToken({ uid: u!.id, role: "student", adminRole: null, sessionVersion: u!.session_version });
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
  const u = await one<{ id: number; password_hash: string; role: "student" | "mentor" | "admin"; admin_role: any; active: boolean; session_version: number }>("SELECT id, password_hash, role, admin_role, active, session_version FROM users WHERE email = $1", [b.email]);
  if (!u || !verifyPassword(b.password, u.password_hash)) throw unauthorized("Email or password is not correct.");
  if (!u.active) throw unauthorized("This account is switched off. Contact CareerNest.");
  if (u.role !== b.portal) throw unauthorized(`This is not a ${b.portal} account. Use the ${u.role} sign-in page.`);
  if (u.role === "mentor") {
    const m = await one<{ status: string }>("SELECT status FROM mentors WHERE user_id = $1", [u.id]);
    if (m?.status === "pending") throw unauthorized("Your mentor application is still being reviewed.");
    if (m?.status !== "active") throw unauthorized("Your mentor account is not active. Contact CareerNest.");
  }
  await audit(u.id, "auth.login", b.portal);
  return { token: await createToken({ uid: u.id, role: u.role, adminRole: u.admin_role, sessionVersion: u.session_version }), user: await profile(u.id) };
}));

authRouter.post("/auth/password/forgot", route(async req => {
  const b = body(req, z.object({ email }));
  const ip = req.ip || "local";
  if (!allow("password-reset:" + ip, 5, 60 * 60 * 1000)) throw tooMany("Too many recovery requests. Please try again later.");
  if (!ENV.resendApiKey || !ENV.emailFrom || !ENV.publicAppUrl) {
    throw unavailable("Password recovery email is not configured yet. Please contact the site administrator.");
  }

  await query("DELETE FROM password_reset_tokens WHERE expires_at <= now()");
  const user = await one<{ id: number }>("SELECT id FROM users WHERE email = $1 AND active = true", [b.email]);
  if (!user) return { ok: true, message: genericResetMessage };

  const token = randomBytes(32).toString("base64url");
  const tokenHash = resetTokenHash(token);
  await tx(async client => {
    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);
    await client.query("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + INTERVAL '30 minutes')", [user.id, tokenHash]);
  });

  const resetUrl = new URL("/reset-password", ENV.publicAppUrl);
  resetUrl.hash = new URLSearchParams({ token }).toString();
  try {
    await sendPasswordResetEmail(b.email, resetUrl.toString());
  } catch {
    await query("DELETE FROM password_reset_tokens WHERE token_hash = $1", [tokenHash]);
    throw unavailable("We could not send the recovery email right now. Please try again later.");
  }
  return { ok: true, message: genericResetMessage };
}));

authRouter.post("/auth/password/reset", route(async req => {
  const b = body(req, z.object({ token: z.string().min(20).max(200), password }));
  const tokenHash = resetTokenHash(b.token);
  await tx(async client => {
    const reset = await client.query<{ id: number; user_id: number }>(
      "SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > now() FOR UPDATE",
      [tokenHash],
    );
    const record = reset.rows[0];
    if (!record) throw badRequest("This password reset link is invalid or has expired. Request a new one.");
    await client.query("UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2", [hashPassword(b.password), record.user_id]);
    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [record.user_id]);
  });
  return { ok: true };
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
  await one("UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2", [hashPassword(b.next), current.uid]);
  return { ok: true, token: await createToken({ ...current, sessionVersion: current.sessionVersion + 1 }) };
}));
