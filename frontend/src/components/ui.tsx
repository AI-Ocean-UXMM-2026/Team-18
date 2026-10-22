// Small shared UI pieces.
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { usePrefs } from "@/lib/prefs";

const TONES = { ok: "bg-ok-soft text-ok", warn: "bg-warn-soft text-warn", bad: "bg-bad-soft text-bad", info: "bg-info-soft text-info" } as const;
export function Pill({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${TONES[tone]}`}>{children}</span>;
}
export function Spinner({ label = "Loading…" }: { label?: string }) {
  const { t } = usePrefs();
  return <div className="flex items-center gap-3 py-8 text-muted" role="status"><span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-soft border-t-brand" />{t(label)}</div>;
}
export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = usePrefs();
  return <div className="card flex flex-wrap items-center justify-between gap-3 border-bad bg-bad-soft text-bad"><span>{message}</span>{onRetry && <button className="btn-ghost btn-sm" onClick={onRetry}>{t("Try again")}</button>}</div>;
}
/** Page title. `back` puts a small "← Back" link at the top-left (never in the bottom buttons). */
export function PageHead({ eyebrow, title, back, children }: { eyebrow?: string; title: string; back?: string; children?: ReactNode }) {
  const { t } = usePrefs();
  return <div className="flex flex-col gap-2">{back && <Link href={back} className="mb-1 self-start text-sm font-semibold text-muted hover:text-brand">← {t("Back")}</Link>}{eyebrow && <p className="eyebrow">{t(eyebrow)}</p>}<h1 className="text-2xl sm:text-3xl">{t(title)}</h1>{children && <div className="max-w-3xl text-muted">{children}</div>}</div>;
}
export const Actions = ({ children }: { children: ReactNode }) => <div className="mt-2 flex flex-wrap items-center justify-end gap-3">{children}</div>;
export const Note = ({ children }: { children: ReactNode }) => <div className="rounded-xl bg-info-soft px-4 py-3 text-sm">{children}</div>;

/** Tiny toast: toast("Saved") from anywhere. */
let push: ((m: string) => void) | null = null;
export const toast = (m: string) => push?.(m);
export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { push = m => { setMsg(m); setTimeout(() => setMsg(null), 2600); }; return () => { push = null; }; }, []);
  return msg ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-sm text-white shadow-lg">{msg}</div> : null;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string, number?][]; value: T; onChange: (v: T) => void }) {
  const { t } = usePrefs();
  return <nav className="tabs">{tabs.map(([k, l, n]) => <button key={k} className={`tab ${value === k ? "tab-on" : ""}`} onClick={() => onChange(k)}>{t(l)}{n ? <span className="ml-1.5 rounded-full bg-brand px-1.5 text-[11px] text-white">{n}</span> : null}</button>)}</nav>;
}
