// ===========================================================================
//  db.ts — the single PostgreSQL connection pool + small query helpers.
// ===========================================================================
import pg from "pg";
import { ENV } from "./env.js";

pg.types.setTypeParser(pg.types.builtins.INT8, v => Number(v));
pg.types.setTypeParser(pg.types.builtins.NUMERIC, v => Number(v));

let pool: pg.Pool | null = null;
export function getPool() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: ENV.databaseUrl, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 });
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

const REQUIRED_TABLES = ["users", "journeys", "mentors", "mentor_slots", "bookings", "payment_accounts", "payments", "audit_log"];
export async function assertSchemaInstalled() {
  const rows = await query<{ table_name: string }>("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  const have = new Set(rows.map(r => r.table_name));
  const missing = REQUIRED_TABLES.filter(t => !have.has(t));
  if (missing.length) throw new Error(`Database is missing tables: ${missing.join(", ")}. Run database/schema.sql first (see README section 3).`);
}

export async function audit(actorId: number | null, action: string, target: string | null, details?: unknown) {
  await query("INSERT INTO audit_log (actor_id, action, target, details) VALUES ($1, $2, $3, $4)", [actorId, action, target, details ? JSON.stringify(details) : null]);
}

export async function closeDatabase() { await pool?.end(); pool = null; }
