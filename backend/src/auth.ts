// ===========================================================================
//  auth.ts — email + password login for all three portals.
//    passwords  scrypt with a random salt, compared in constant time
//    sessions   signed JWT, sent as  Authorization: Bearer <token>
// ===========================================================================
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env.js";

const KEY_LENGTH = 64;
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [alg, salt, key] = stored.split(":");
  if (alg !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "hex");
  const actual = scryptSync(password, salt, KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const secret = new TextEncoder().encode(ENV.jwtSecret);
export type Role = "student" | "mentor" | "admin";
export type AdminRole = "super" | "ops" | "content";
export type Session = { uid: number; role: Role; adminRole: AdminRole | null; sessionVersion: number };
export type CurrentUser = { active: boolean; role: Role; adminRole: AdminRole | null; mentorStatus: string | null; sessionVersion: number };

export function sessionMatchesCurrentUser(session: Session, user: CurrentUser) {
  return user.active
    && session.role === user.role
    && session.sessionVersion === user.sessionVersion
    && (session.role !== "admin" || session.adminRole === user.adminRole)
    && (session.role !== "mentor" || user.mentorStatus === "active");
}

export async function createToken(s: Session) {
  return new SignJWT({ uid: s.uid, role: s.role, adminRole: s.adminRole })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setIssuer("careernet")
    .setExpirationTime(`${ENV.jwtExpireMinutes}m`).sign(secret);
}
export async function readToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: "careernet" });
    const sessionVersion = payload.sessionVersion === undefined ? 0 : Number(payload.sessionVersion);
    if (!Number.isSafeInteger(sessionVersion) || sessionVersion < 0) return null;
    return { uid: Number(payload.uid), role: payload.role as Role, adminRole: (payload.adminRole as AdminRole) ?? null, sessionVersion };
  } catch { return null; }
}

// small in-memory rate limiter (per key)
const buckets = new Map<string, number[]>();
const MAX_RATE_BUCKETS = 20_000;
let lastBucketCleanup = 0;
export function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (now - lastBucketCleanup >= 60_000 || buckets.size >= MAX_RATE_BUCKETS) {
    for (const [bucketKey, timestamps] of buckets) {
      const recent = timestamps.filter(timestamp => now - timestamp < 3_600_000);
      if (!recent.length) buckets.delete(bucketKey);
      else if (recent.length !== timestamps.length) buckets.set(bucketKey, recent);
    }
    while (buckets.size >= MAX_RATE_BUCKETS) buckets.delete(buckets.keys().next().value!);
    lastBucketCleanup = now;
  }
  const recent = (buckets.get(key) ?? []).filter(t => now - t < windowMs);
  if (recent.length >= limit) { buckets.set(key, recent); return false; }
  recent.push(now); buckets.set(key, recent); return true;
}
