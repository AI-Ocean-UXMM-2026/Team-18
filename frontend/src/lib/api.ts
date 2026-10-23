// ===========================================================================
//  api.ts — the single place where the app talks to the backend.
//  Dev: /api is proxied by Vite to http://127.0.0.1:8000 (vite.config.ts).
//  Production: set VITE_API_URL, or serve the API behind /api with nginx.
//  Sessions: the JWT from /auth/login is kept in localStorage and sent as
//  Authorization: Bearer <token>.
// ===========================================================================
export const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined)?.trim() || "/api").replace(/\/+$/, "");
const TOKEN_KEY = "careernet_token";

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string | null) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ } },
};

export class ApiError extends Error { constructor(readonly status: number, message: string) { super(message); } }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(API_BASE + path, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) } });
  } catch { throw new ApiError(0, "Cannot reach the CareerNest server. Is the backend running?"); }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) { tokenStore.set(null); window.dispatchEvent(new Event("careernet:signed-out")); }
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}
export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) => request<T>(p, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(p: string, body?: unknown) => request<T>(p, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
};

// --- shared types -------------------------------------------------------------
export type Role = "student" | "mentor" | "admin";
export type AdminRole = "super" | "ops" | "content";
export type User = { id: number; email: string; name: string; role: Role; adminRole: AdminRole | null; language: "en" | "my"; isPro: boolean; proExpiresAt?: string | null; aiUsed: number };
export type Level = "g12" | "ged" | "igcse";
export type Question = { id: number; area: string; code: string; en: string; my: string };
export type Career = { id: string; t: string; codes: string; f: number[]; demand: string; study: string; blurb: string; positions: string[]; skills: string[]; quals: string[]; outlook: string; subjects: string[]; majors: { n: string; f: number }[]; video: { len: string; ch: string[]; url: string } };
export type Content = { questions: Question[]; careers: Career[]; codes: Record<string, { n: string; d: string }>; fields: Record<string, string> };
export type Top = { priority: number; career: Career; pct: number; reasons: { code: string; name: string; score: number; example: string | null }[] };
export type ScoreResult = { scores: Record<string, number>; holland: string; top: Top[] };
export type G12Item = { key: string; kind: "g12"; university: { id: number; code: string; name: string; location: string; type: string; established: number; description: string; admission: string; website: string; photo: string | null }; programs: string[] };
export type School = { annualTuition?: string; id: string; code: string; name: string; country: string; city: string; type: string; mode: string; established: string; fields: number[]; description: string; partner: string; programs: string[]; ged: { ok: string; note: string; tests: string }; igcse: { ok: string; note: string }; english: string; admission: string; pathway: string; duration: string; intakes: string; hasScholarship: boolean; scholarship: string; website: string; source: string; photo: string; lastChecked: string };
export type IntlItem = { key: string; kind: "intl"; school: School };
export type UniItem = G12Item | IntlItem;
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Slot = { id: number; startsAt: string; minutes: number };
export const itemName = (i: UniItem) => (i.kind === "g12" ? i.university.name : i.school.name);
export const itemCode = (i: UniItem) => (i.kind === "g12" ? i.university.code : i.school.code);
