import { describe, expect, it } from "vitest";
import { createToken, readToken, sessionMatchesCurrentUser, type CurrentUser, type Session } from "./auth.js";

const activeAdmin: CurrentUser = { active: true, role: "admin", adminRole: "ops", mentorStatus: null };
const adminSession: Session = { uid: 7, role: "admin", adminRole: "ops" };

describe("session authorization freshness", () => {
  it("round-trips authorized claims through a signed token", async () => {
    const session = adminSession;
    const decoded = await readToken(await createToken(session));
    expect(decoded).toEqual(session);
    expect(sessionMatchesCurrentUser(decoded!, activeAdmin)).toBe(true);
  });

  it("allows a session whose account and role are still active", () => {
    expect(sessionMatchesCurrentUser(adminSession, activeAdmin)).toBe(true);
  });

  it("rejects an old token after an admin role is changed", () => {
    expect(sessionMatchesCurrentUser(adminSession, { ...activeAdmin, adminRole: "content" })).toBe(false);
  });

  it("rejects a token after the account is disabled or its role changes", () => {
    expect(sessionMatchesCurrentUser(adminSession, { ...activeAdmin, active: false })).toBe(false);
    expect(sessionMatchesCurrentUser(adminSession, { ...activeAdmin, role: "student", adminRole: null })).toBe(false);
  });

  it("allows only active mentors to keep using mentor sessions", () => {
    const mentor: Session = { uid: 8, role: "mentor", adminRole: null };
    const current: CurrentUser = { active: true, role: "mentor", adminRole: null, mentorStatus: "active" };
    expect(sessionMatchesCurrentUser(mentor, current)).toBe(true);
    expect(sessionMatchesCurrentUser(mentor, { ...current, mentorStatus: "suspended" })).toBe(false);
    expect(sessionMatchesCurrentUser(mentor, { ...current, mentorStatus: "pending" })).toBe(false);
  });
});
