// ===========================================================================
//  routes/ai.ts — AI endpoints. Free students get FREE_AI_LIMIT questions,
//  Pro students are unlimited. Everyone has an hourly cap.
// ===========================================================================
import { Router, type Request } from "express";
import { z } from "zod";
import { ENV } from "../env.js";
import { allow } from "../auth.js";
import { askAI, type ChatMessage } from "../ai.js";
import { one } from "../db.js";
import { getSchools } from "../schools.js";
import { advisorPrompt, careerPrompt, questionPrompt } from "../prompts.js";
import { body, HttpError, requireRole, route, sessionOf, tooMany } from "../http.js";

export const aiRouter = Router();
const lang = z.enum(["en", "my"]).default("en");
const messages = z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) })).min(1).max(24)
  .refine(l => l[l.length - 1].role === "user", "The last message must be from the student.");

async function spend(req: Request) {
  const uid = sessionOf(req).uid;
  if (!allow("ai:" + uid, ENV.aiRateLimitPerHour, 3_600_000)) throw tooMany("You asked a lot of questions. Please try again in an hour.");
  const u = await one<{ is_pro: boolean; ai_used: number }>("SELECT is_pro, ai_used FROM users WHERE id = $1", [uid]);
  if (!u?.is_pro && (u?.ai_used ?? 0) >= ENV.freeAiLimit) throw new HttpError(402, `You have used your ${ENV.freeAiLimit} free AI questions. Upgrade to CareerNest Pro for unlimited questions.`);
  await one("UPDATE users SET ai_used = ai_used + 1 WHERE id = $1", [uid]);
}
const last12 = (l: ChatMessage[]) => l.slice(-12);

aiRouter.post("/ai/question", requireRole("student"), route(async req => {
  const b = body(req, z.object({ questionId: z.number().int().min(0).max(500), lang }));
  await spend(req);
  return { reply: await askAI(questionPrompt(b.questionId, b.lang), [{ role: "user", content: "Please explain this statement." }]) };
}));

aiRouter.post("/ai/career", requireRole("student"), route(async req => {
  const b = body(req, z.object({ answers: z.record(z.string(), z.number().int().min(1).max(5)), level: z.enum(["g12", "ged", "igcse"]).default("g12"), lang, messages }));
  await spend(req);
  const reply = await askAI(careerPrompt(b.answers, b.level, b.lang), last12(b.messages));
  return { reply: reply.replace(/^[ \t]*\d{1,2}[.)][ \t]+/gm, "") };
}));

aiRouter.post("/ai/advisor", requireRole("student"), route(async req => {
  const b = body(req, z.object({ level: z.enum(["ged", "igcse"]), careerId: z.string().max(40).optional(), majors: z.array(z.string()).max(2).optional(), comparing: z.array(z.string()).max(3).optional(), lang, messages }));
  await spend(req);
  return { reply: await askAI(advisorPrompt({ ...b, schools: await getSchools() }), last12(b.messages)) };
}));
