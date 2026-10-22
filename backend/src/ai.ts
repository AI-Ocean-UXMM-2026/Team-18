// ===========================================================================
//  ai.ts — one function to call the AI. Switch with AI_PROVIDER in .env.
//  The key stays on the server; the browser never sees it.
// ===========================================================================
import { ENV } from "./env.js";
import { HttpError } from "./http.js";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function askAI(system: string, messages: ChatMessage[]): Promise<string> {
  return ENV.aiProvider === "claude" ? claude(system, messages) : gemini(system, messages);
}

async function gemini(system: string, messages: ChatMessage[]) {
  if (!ENV.geminiKey) throw new HttpError(503, "AI is not set up yet (GEMINI_API_KEY is empty).");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${ENV.geminiModel}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": ENV.geminiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) { console.error("[ai] Gemini:", data?.error?.message ?? res.status); throw new HttpError(502, "The AI could not answer right now."); }
  return (data.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("").trim();
}

async function claude(system: string, messages: ChatMessage[]) {
  if (!ENV.anthropicKey) throw new HttpError(503, "AI is not set up yet (ANTHROPIC_API_KEY is empty).");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ENV.anthropicKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: ENV.claudeModel, max_tokens: 1024, temperature: 0.3, system, messages }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) { console.error("[ai] Claude:", data?.error?.message ?? res.status); throw new HttpError(502, "The AI could not answer right now."); }
  return (data.content ?? []).map((c: any) => c.text ?? "").join("").trim();
}
