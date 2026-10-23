// ===========================================================================
//  index.ts — the CareerNest API server.
//
//      cd backend
//      npm install
//      cp .env.example .env     (DATABASE_URL, JWT_SECRET, GEMINI_API_KEY)
//      npm run dev              (http://localhost:8000/health)
//
//  The database tables must exist first: run database/schema.sql and migrations.
// ===========================================================================
import express from "express";
import cors from "cors";
import { ENV, aiConfigured, assertEnv } from "./env.js";
import { assertSchemaInstalled, closeDatabase, pingDatabase } from "./db.js";
import { attachSession, errorMiddleware, route } from "./http.js";
import { authRouter } from "./routes/auth.js";
import { studentRouter } from "./routes/student.js";
import { aiRouter } from "./routes/ai.js";
import { mentorRouter } from "./routes/mentor.js";
import { adminRouter } from "./routes/admin.js";
import { getSchools, schoolsSource } from "./schools.js";
import { loadManagedContent } from "./contentStore.js";
import { seedDatabase } from "./seed.js";
import { startSweeper } from "./retention.js";

assertEnv();
const app = express();
// Trust the hosting reverse proxy only. Trusting every forwarded hop lets
// clients forge X-Forwarded-For and evade the login rate limit.
app.set("trust proxy", ENV.isProduction ? 1 : false);
app.use(express.json({ limit: "2mb" }));   // payment screenshots arrive as base64 (max 1 MB image)
app.use(cors({
  origin(origin, cb) {
    if (!origin || ENV.corsOrigins.includes(origin) || ENV.corsOriginRegex.test(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} is not allowed by CORS_ORIGINS.`));
  },
}));
app.use(attachSession);

app.get("/health", route(async () => {
  const database = await pingDatabase();
  let schools = 0; try { schools = (await getSchools()).length; } catch { /* reported as 0 */ }
  return { status: database.ok ? "ok" : "degraded", service: "careernet-api", release: process.env.RENDER_GIT_COMMIT ?? null, database, ai: { provider: ENV.aiProvider, configured: aiConfigured() }, schools: { count: schools, source: schoolsSource() } };
}));

app.use(authRouter);
app.use(studentRouter);
app.use(aiRouter);
app.use(mentorRouter);
app.use(adminRouter);
app.use(errorMiddleware);

async function main() {
  await assertSchemaInstalled();
  await loadManagedContent();
  if (ENV.seedOnStart) await seedDatabase();
  startSweeper();
  const server = app.listen(ENV.port, ENV.host, async () => {
    console.log(`CareerNest API  → http://localhost:${ENV.port}/health`);
    console.log(`AI provider     → ${ENV.aiProvider}${aiConfigured() ? "" : "  (NOT configured: add the API key to backend/.env)"}`);
    try { const s = await getSchools(); console.log(`School data     → ${s.length} universities from ${schoolsSource()}`); }
    catch (e) { console.warn("School data     → could not load:", (e as Error).message); }
  });
  const stop = () => server.close(() => closeDatabase().finally(() => process.exit(0)));
  process.on("SIGINT", stop); process.on("SIGTERM", stop);
}
main().catch(e => { console.error("\n✖ CareerNest API could not start:\n  " + (e instanceof Error ? e.message : e) + "\n"); process.exit(1); });
