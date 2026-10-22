// ===========================================================================
//  journey.tsx — the student's progress, saved to the server (journeys table)
//  so it follows them to any device. Loaded after sign-in, saved on change.
// ===========================================================================
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, type Content, type Level } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { updateJourney } from "./studentFlow";

export type Journey = {
  level: Level | null; answers: Record<string, number>; careerId: string | null; majors: string[];
  shortlist: string[]; compare: string[]; videoChoice: "watch" | "skip" | null; watched: Record<string, boolean>;
  quizCompleted?: boolean; resultsReviewed?: boolean; majorsConfirmed?: boolean; comparisonCompleted?: boolean;
};
export const EMPTY: Journey = { level: null, answers: {}, careerId: null, majors: [], shortlist: [], compare: [], videoChoice: null, watched: {} };

type Ctx = { j: Journey; ready: boolean; content: Content | null; contentLoading: boolean; set: (patch: Partial<Journey> | ((j: Journey) => Partial<Journey>)) => void };
const JourneyCtx = createContext<Ctx | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [j, setJ] = useState<Journey>(EMPTY);
  const [ready, setReady] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const sessionKey = isGuest ? "guest" : user?.role === "student" ? `student:${user.id}` : "none";
  const [content, setContent] = useState<Content | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const pending = useRef<Partial<Journey>>({});
  const guestDraft = useRef<Journey | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { api.get<Content>("/content").then(setContent).catch(() => setContent(null)).finally(() => setContentLoading(false)); }, []);
  useEffect(() => {
    let active = true;
    setReady(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = null; pending.current = {};
    if (isGuest) { guestDraft.current = null; setJ(EMPTY); setLoadedFor(sessionKey); setReady(true); return; }
    if (user?.role !== "student") { guestDraft.current = null; setJ(EMPTY); setLoadedFor(sessionKey); setReady(true); return; }
    const draft = guestDraft.current;
    guestDraft.current = null;
    api.get<{ journey: Partial<Journey> }>("/me/journey").then(async r => {
      if (!active) return;
      const journey = { ...EMPTY, ...r.journey, ...(draft ?? {}) };
      setJ(journey);
      if (draft) await api.put("/me/journey", draft).catch(() => { /* account remains usable if saving fails */ });
    }).catch(() => { if (active) setJ({ ...EMPTY, ...(draft ?? {}) }); }).finally(() => { if (active) { setLoadedFor(sessionKey); setReady(true); } });
    return () => { active = false; if (timer.current) clearTimeout(timer.current); };
  }, [user?.id, user?.role, isGuest]);

  const set: Ctx["set"] = patch => setJ(prev => {
    const p = typeof patch === "function" ? patch(prev) : patch;
    const next = updateJourney(prev, p);
    if (isGuest) guestDraft.current = next;
    if (user?.role === "student") {
      pending.current = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { const body = pending.current; pending.current = {}; api.put("/me/journey", body).catch(() => { /* retried on next change */ }); }, 500);
    }
    return next;
  });
  return <JourneyCtx.Provider value={{ j, ready: ready && loadedFor === sessionKey, content, contentLoading, set }}>{children}</JourneyCtx.Provider>;
}
export function useJourney() { const v = useContext(JourneyCtx); if (!v) throw new Error("JourneyProvider missing"); return v; }

/** Fields of the chosen majors (or all majors of the career). */
export function majorFields(j: Journey, content: Content | null) {
  const c = content?.careers.find(x => x.id === j.careerId);
  if (!c) return [];
  const chosen = c.majors.filter(m => j.majors.includes(m.n)).map(m => m.f);
  return [...new Set(chosen.length ? chosen : c.majors.map(m => m.f))];
}
