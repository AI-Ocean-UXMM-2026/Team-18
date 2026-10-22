// ===========================================================================
//  env.ts — everything the backend reads from .env, in one place.
// ===========================================================================
import "dotenv/config";

const text = (key: string, fallback = "") => (process.env[key] ?? fallback).trim();
const number = (key: string, fallback: number) => {
  const raw = process.env[key];
  const parsed = Number(raw);
  return raw !== undefined && raw.trim() !== "" && Number.isFinite(parsed) ? parsed : fallback;
};
const flag = (key: string, fallback: boolean) => {
  const v = text(key).toLowerCase();
  return v ? ["1", "true", "yes"].includes(v) : fallback;
};

export const ENV = {
  databaseUrl: text("DATABASE_URL"),
  supabaseUrl: text("SUPABASE_URL").replace(/\/+$/, ""),
  supabaseServiceRoleKey: text("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseVideoBucket: text("SUPABASE_VIDEO_BUCKET", "career-videos"),
  jwtSecret: text("JWT_SECRET", "dev-only-change-me-please-set-JWT_SECRET"),
  jwtExpireMinutes: number("JWT_EXPIRE_MINUTES", 1440),
  port: number("PORT", 8000),
  host: text("HOST", "0.0.0.0"),
  corsOrigins: text("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",").map(s => s.trim()).filter(Boolean),
  corsOriginRegex: new RegExp(
    text("CORS_ORIGIN_REGEX", "^https?://(localhost|127\\.0\\.0\\.1|10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|192\\.168\\.\\d{1,3}\\.\\d{1,3}|172\\.(1[6-9]|2\\d|3[01])\\.\\d{1,3}\\.\\d{1,3})(:\\d+)?$") || "^$",
  ),
  seedOnStart: flag("SEED_ON_START", true),
  seedPassword: text("SEED_PASSWORD", "careernet123"),

  schoolsSheetUrl: text("SCHOOLS_SHEET_CSV_URL"),
  schoolsCacheSeconds: number("SCHOOLS_CACHE_SECONDS", 600),

  proPrice: number("PRO_PRICE_MMK", 5000),
  freeAiLimit: number("FREE_AI_LIMIT", 5),
  proofRetentionHours: number("PROOF_RETENTION_HOURS", 240),

  aiProvider: (text("AI_PROVIDER", "gemini").toLowerCase() === "claude" ? "claude" : "gemini") as "gemini" | "claude",
  geminiKey: text("GEMINI_API_KEY"),
  geminiFallbackKey: text("GEMINI_FALLBACK_API_KEY"),
  geminiModel: text("GEMINI_MODEL", "gemini-2.5-flash"),
  openrouterKey: text("OPENROUTER_API_KEY"),
  openrouterModel: text("OPENROUTER_MODEL", "nvidia/nemotron-3.5-lightning:free"),
  openrouterReferer: text("OPENROUTER_REFERER", "https://careernest.onrender.com"),
  anthropicKey: text("ANTHROPIC_API_KEY"),
  claudeModel: text("CLAUDE_MODEL", "claude-haiku-5-5"),
  aiRateLimitPerHour: number("AI_RATE_LIMIT_PER_HOUR", 30),

  loginRateLimit: number("LOGIN_RATE_LIMIT", 10),
  loginRateWindowSeconds: number("LOGIN_RATE_WINDOW_SECONDS", 60),
  isProduction: text("NODE_ENV") === "production",
} as const;

export const openrouterEnabled = () => !!ENV.openrouterKey && ENV.openrouterModel.endsWith(":free");
export const aiConfigured = () => ENV.aiProvider === "claude"
  ? !!ENV.anthropicKey
  : !!(ENV.geminiKey || ENV.geminiFallbackKey || openrouterEnabled());

export function assertEnv() {
  if (!ENV.databaseUrl) throw new Error("DATABASE_URL is not set. Copy backend/.env.example to backend/.env and add your PostgreSQL connection string.");
  if (ENV.isProduction && ENV.jwtSecret.startsWith("dev-only")) throw new Error("Set a real JWT_SECRET in .env before running in production.");
  if (ENV.isProduction && ENV.seedOnStart) console.warn("[env] SEED_ON_START is true in production. Turn it off once real accounts exist.");
}
