// ===========================================================================
//  ai.ts — server-side AI providers and Gemini -> OpenRouter failover.
//  Provider keys stay on the server; the browser never sees them.
// ===========================================================================
import { ENV, openrouterEnabled } from "./env.js";
import { HttpError } from "./http.js";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const TOTAL_TIMEOUT_MS = 42_000;
const GEMINI_TIMEOUT_MS = 30_000;
const OPENROUTER_TIMEOUT_MS = 30_000;

class ProviderFailure extends Error {
  constructor(readonly provider: string, readonly status?: number, message = "request failed") {
    super(message);
  }

  // A malformed request is a caller problem; retrying it with another provider
  // would hide the error and waste a request.
  get canFallback() { return this.status !== 400; }
}

export async function askAI(system: string, messages: ChatMessage[]): Promise<string> {
  if (ENV.aiProvider === "claude") return claude(system, messages);

  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  const geminiKeys = [ENV.geminiKey, ENV.geminiFallbackKey].filter((key, index, all) => !!key && all.indexOf(key) === index);
  let lastFailure: ProviderFailure | undefined;

  for (let index = 0; index < geminiKeys.length; index++) {
    const key = geminiKeys[index];
    // Reserve a full request window for the fallback, shared across Gemini keys.
    const geminiBudget = remaining(deadline) - (openrouterEnabled() ? OPENROUTER_TIMEOUT_MS : 0);
    if (geminiBudget <= 0) break;
    try {
      return await gemini(system, messages, key, Math.min(GEMINI_TIMEOUT_MS, geminiBudget));
    } catch (error) {
      lastFailure = asProviderFailure("Gemini", error);
      logFailure(lastFailure);
      // The extra Gemini key exists specifically for quota/rate-limit failures.
      if (index + 1 >= geminiKeys.length || lastFailure.status !== 429 || remaining(deadline) <= 0) break;
    }
  }

  if (lastFailure && !lastFailure.canFallback) throw aiUnavailable();

  if (openrouterEnabled() && remaining(deadline) > 0) {
    try {
      return await openrouter(system, messages, Math.min(OPENROUTER_TIMEOUT_MS, remaining(deadline)));
    } catch (error) {
      lastFailure = asProviderFailure("OpenRouter", error);
      logFailure(lastFailure);
    }
  }

  if (!geminiKeys.length && !openrouterEnabled()) {
    throw new HttpError(503, "AI is not set up yet. Add GEMINI_API_KEY or configure a free OpenRouter fallback.");
  }
  throw aiUnavailable();
}

function remaining(deadline: number) { return Math.max(0, deadline - Date.now()); }

async function gemini(system: string, messages: ChatMessage[], key: string, timeoutMs: number): Promise<string> {
  if (!key || timeoutMs <= 0) throw new ProviderFailure("Gemini", undefined, "request timed out");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${ENV.geminiModel}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
      signal: controller.signal,
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new ProviderFailure("Gemini", res.status, data?.error?.message ?? `HTTP ${res.status}`);
    const reply = (data.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("").trim();
    if (!reply) throw new ProviderFailure("Gemini", undefined, "empty response");
    return reply;
  } catch (error) {
    if (error instanceof ProviderFailure) throw error;
    throw new ProviderFailure("Gemini", undefined, error instanceof Error ? error.message : "network error");
  } finally {
    clearTimeout(timer);
  }
}

async function openrouter(system: string, messages: ChatMessage[], timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.openrouterKey}`,
        "HTTP-Referer": ENV.openrouterReferer,
        "X-Title": "CareerNest",
      },
      body: JSON.stringify({
        model: ENV.openrouterModel,
        messages: [{ role: "system", content: system }, ...messages],
        temperature: 0.3,
        max_tokens: 2048,
        // This is a concise chat reply. Optional reasoning can consume the
        // entire token budget and leave message.content empty.
        reasoning: { enabled: false },
      }),
      signal: controller.signal,
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) throw new ProviderFailure("OpenRouter", res.status, data?.error?.message ?? `HTTP ${res.status}`);
    const content = data.choices?.[0]?.message?.content;
    const reply = typeof content === "string"
      ? content.trim()
      : Array.isArray(content) ? content.map((part: any) => typeof part?.text === "string" ? part.text : "").join("").trim() : "";
    if (!reply) throw new ProviderFailure("OpenRouter", undefined,
      `empty response (finish_reason=${data.choices?.[0]?.finish_reason ?? "unknown"}, completion_tokens=${data.usage?.completion_tokens ?? "unknown"})`);
    return reply;
  } catch (error) {
    if (error instanceof ProviderFailure) throw error;
    throw new ProviderFailure("OpenRouter", undefined, error instanceof Error ? error.message : "network error");
  } finally {
    clearTimeout(timer);
  }
}

async function claude(system: string, messages: ChatMessage[]): Promise<string> {
  if (!ENV.anthropicKey) throw new HttpError(503, "AI is not set up yet (ANTHROPIC_API_KEY is empty).");
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ENV.anthropicKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: ENV.claudeModel, max_tokens: 1024, temperature: 0.3, system, messages }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) { console.error("[ai] Claude request failed:", res.status); throw aiUnavailable(); }
    const reply = (data.content ?? []).map((c: any) => c.text ?? "").join("").trim();
    if (!reply) throw aiUnavailable();
    return reply;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error("[ai] Claude request failed:", error instanceof Error ? error.message : "network error");
    throw aiUnavailable();
  }
}

function asProviderFailure(provider: string, error: unknown) {
  return error instanceof ProviderFailure ? error : new ProviderFailure(provider, undefined, error instanceof Error ? error.message : "request failed");
}

function logFailure(error: ProviderFailure) {
  console.error(`[ai] ${error.provider} failed${error.status ? ` (${error.status})` : ""}:`, error.message);
}

function aiUnavailable() {
  return new HttpError(502, "The AI could not answer right now. Please try again shortly.");
}
