// ===========================================================================
//  db.ts — the single PostgreSQL connection pool + small query helpers.
// ===========================================================================
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { ENV } from "./env.js";

pg.types.setTypeParser(pg.types.builtins.INT8, v => Number(v));
pg.types.setTypeParser(pg.types.builtins.NUMERIC, v => Number(v));

let pool: pg.Pool | null = null;
export function getPool() {
  if (!pool) {
    const connectionUrl = new URL(ENV.databaseUrl);
    const usesSupabasePooler = connectionUrl.hostname.endsWith(".pooler.supabase.com");
    const ssl = usesSupabasePooler
      ? { ca: fs.readFileSync(path.resolve(import.meta.dirname, "../certs/prod-ca-2021.crt"), "utf8"), rejectUnauthorized: true }
      : undefined;
    // node-postgres lets sslmode in the URL override the explicit SSL options.
    // Supabase's CA above provides certificate verification for its pooler.
    if (usesSupabasePooler) connectionUrl.searchParams.delete("sslmode");
    pool = new pg.Pool({ connectionString: connectionUrl.toString(), ...(ssl ? { ssl } : {}), max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 });
    pool.on("error", e => console.error("[db] idle client error:", e.message));
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = any>(sql: string, params: unknown[] = []) {
  return (await getPool().query<T>(sql, params)).rows;
}
export async function one<T extends pg.QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await query<T>(sql, params))[0] ?? null;
}

/** Runs fn inside BEGIN/COMMIT; rolls back on any error. */
export async function tx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function pingDatabase() {
  try { await getPool().query("SELECT 1"); return { ok: true as const }; }
  catch (e) { return { ok: false as const, error: e instanceof Error ? e.message : String(e) }; }
}

const REQUIRED_TABLES = ["users", "journeys", "mentors", "mentor_slots", "bookings", "payment_accounts", "payments", "audit_log", "admin_universities", "password_reset_tokens"];
/** Additive, idempotent recovery migration for existing deployments. */
export async function ensurePasswordRecoverySchema() {
  await tx(async client => {
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0");
    await client.query(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await client.query("CREATE INDEX IF NOT EXISTS password_reset_tokens_expiry_idx ON password_reset_tokens (expires_at)");
  });
}
export async function assertSchemaInstalled() {
  const rows = await query<{ table_name: string }>("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  const have = new Set(rows.map(r => r.table_name));
  const missing = REQUIRED_TABLES.filter(t => !have.has(t));
  if (missing.length) throw new Error(`Database is missing tables: ${missing.join(", ")}. Run database/schema.sql and all scripts in database/migrations/ first (see README section 3).`);
  const proExpiry = await one("SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'pro_expires_at'");
  if (!proExpiry) throw new Error("Run database/migrations/20261023_monthly_pro.sql before starting the monthly Pro backend.");
}

export async function audit(actorId: number | null, action: string, target: string | null, details?: unknown) {
  await query("INSERT INTO audit_log (actor_id, action, target, details) VALUES ($1, $2, $3, $4)", [actorId, action, target, details ? JSON.stringify(details) : null]);
}

export async function closeDatabase() { await pool?.end(); pool = null; }
