import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { request } from "node:http";
import type { Server } from "node:http";
import { createHash } from "node:crypto";

const mock = vi.hoisted(() => ({ one: vi.fn(), query: vi.fn(), clientQuery: vi.fn() }));
vi.mock("../db.js", () => ({ one: mock.one, query: mock.query, audit: vi.fn(), tx: (callback: any) => callback({ query: mock.clientQuery }) }));
vi.mock("../env.js", async importOriginal => {
  const actual = await importOriginal<typeof import("../env.js")>();
  return { ...actual, ENV: { ...actual.ENV, resendApiKey: "test-only", emailFrom: "test@example.invalid", publicAppUrl: "https://example.invalid" } };
});
import { authRouter } from "./auth.js";
import { verifyPassword } from "../auth.js";
import { errorMiddleware } from "../http.js";

let server: Server;
let port: number;
function post(path: string, body: unknown) {
  return new Promise<{ status: number; body: any; cacheControl: string | undefined }>((resolve, reject) => {
    const req = request({ hostname: "127.0.0.1", port, path, method: "POST", headers: { "Content-Type": "application/json" } }, res => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => resolve({ status: res.statusCode!, body: JSON.parse(data), cacheControl: res.headers["cache-control"] }));
    });
    req.on("error", reject); req.end(JSON.stringify(body));
  });
}
beforeAll(async () => {
  const app = express(); app.use(express.json()); app.use(authRouter); app.use(errorMiddleware);
  server = await new Promise<Server>(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  port = (server.address() as { port: number }).port;
});
afterAll(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
beforeEach(() => { vi.clearAllMocks(); mock.query.mockResolvedValue([]); mock.clientQuery.mockResolvedValue({ rows: [] }); vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true })); });
afterEach(() => vi.unstubAllGlobals());

describe("password recovery HTTP flow", () => {
  it("handles the recovery request endpoint and sends a hashed one-time verification link", async () => {
    mock.one.mockResolvedValue({ id: 9 });
    const result = await post("/auth/password/forgot", { email: " STUDENT@example.invalid " });
    expect(result.status).toBe(200);
    expect(result.body.password).toBeUndefined();
    expect(result.body.token).toBeUndefined();
    const delivery = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(delivery.to).toEqual(["student@example.invalid"]);
    const link = new URL(delivery.text.match(/https:\/\/\S+/)[0]);
    const token = new URLSearchParams(link.hash.slice(1)).get("token")!;
    const insertion = mock.clientQuery.mock.calls.find(([sql]) => sql.startsWith("INSERT INTO password_reset_tokens"))!;
    expect(insertion[1][1]).toBe(createHash("sha256").update(token).digest("hex"));
    expect(insertion[0]).toContain("30 minutes");
  });
  it("does not reveal whether an email exists", async () => {
    mock.one.mockResolvedValue(null);
    const result = await post("/auth/password/forgot", { email: "missing@example.invalid" });
    expect(result.status).toBe(200);
    expect(result.body.message).toContain("If an active account");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not issue a new password without a valid email-verification token", async () => {
    expect((await post("/auth/password/reset", { email: "student@example.invalid" })).status).toBe(400);
    expect((await post("/auth/password/reset", { token: "expired-or-consumed-token" })).status).toBe(400);
    expect(mock.clientQuery.mock.calls.some(([sql]) => sql.startsWith("UPDATE users"))).toBe(false);
  });
  it("generates and displays a new password only after verification, stores its hash and revokes sessions", async () => {
    mock.clientQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 9 }] });
    const result = await post("/auth/password/reset", { token: "valid-secret-verification-token" });
    expect(result.status).toBe(200);
    expect(result.cacheControl).toBe("no-store");
    expect(result.body.password).toHaveLength(24);
    const update = mock.clientQuery.mock.calls.find(([sql]) => sql.startsWith("UPDATE users"))!;
    expect(verifyPassword(result.body.password, update[1][0])).toBe(true);
    expect(update[0]).toContain("session_version + 1");
    expect(mock.clientQuery.mock.calls.some(([sql]) => sql.startsWith("DELETE FROM password_reset_tokens"))).toBe(true);
  });
  it("still lets a verified user choose their own new password", async () => {
    mock.clientQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 9 }] });
    const result = await post("/auth/password/reset", { token: "another-valid-secret-token", password: "chosen-secure-password" });
    expect(result.status).toBe(200);
    expect(result.body.password).toBeUndefined();
    const update = mock.clientQuery.mock.calls.find(([sql]) => sql.startsWith("UPDATE users"))!;
    expect(verifyPassword("chosen-secure-password", update[1][0])).toBe(true);
  });
  it("reports email delivery failures and removes the undelivered token", async () => {
    mock.one.mockResolvedValue({ id: 9 });
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403 } as Response);
    const result = await post("/auth/password/forgot", { email: "student@example.invalid" });
    expect(result.status).toBe(503);
    expect(mock.query.mock.calls.some(([sql]) => sql.includes("WHERE token_hash = $1"))).toBe(true);
  });
});
