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
  return <div className="flex flex-col gap-5 py-3" role="status" aria-label={t(label)}>
    <span className="sr-only">{t(label)}</span>
    <div className="space-y-3">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-9 w-2/3 max-w-md" />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map(i => <div key={i} className="rounded-2xl border border-line bg-card p-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="mt-4 h-5 w-2/3" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
      </div>)}
    </div>
    <div className="rounded-2xl border border-line bg-card p-5">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
    </div>
  </div>;
}
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-block ${className}`} aria-hidden="true" />;
}
export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  const { t } = usePrefs();
  return <div className="grid gap-4 md:grid-cols-2" role="status" aria-label={t("Loading results")}>{Array.from({ length: count }, (_, i) => <article key={i} className="rounded-2xl border border-line bg-card p-5">
    <div className="flex items-start gap-3"><Skeleton className="h-11 w-11 shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><Skeleton className="h-5 w-3/4" /><Skeleton className="mt-2 h-3 w-1/2" /></div></div>
    <Skeleton className="mt-5 h-3 w-full" /><Skeleton className="mt-2 h-3 w-11/12" /><Skeleton className="mt-2 h-3 w-2/3" />
    <div className="mt-5 flex gap-2"><Skeleton className="h-8 w-24 rounded-lg" /><Skeleton className="h-8 w-20 rounded-lg" /></div>
  </article>)}</div>;
}
export function CardListSkeleton({ count = 2 }: { count?: number }) {
  const { t } = usePrefs();
  return <div className="flex flex-col gap-3" role="status" aria-label={t("Loading results")}>{Array.from({ length: count }, (_, i) => <article key={i} className="flex gap-4 rounded-2xl border border-line bg-card p-4 sm:p-5">
    <Skeleton className="h-28 w-20 shrink-0 rounded-xl sm:w-28" />
    <div className="flex-1"><Skeleton className="h-5 w-2/5" /><Skeleton className="mt-3 h-3 w-4/5" /><Skeleton className="mt-2 h-3 w-full" /><Skeleton className="mt-2 h-3 w-3/5" /><Skeleton className="mt-4 h-8 w-28 rounded-lg" /></div>
  </article>)}</div>;
}
export function TableSkeleton({ rows = 4, columns = 4 }: { rows?: number; columns?: number }) {
  const { t } = usePrefs();
  return <div className="overflow-hidden rounded-2xl border border-line bg-card" role="status" aria-label={t("Loading results")}>
    <div className="grid gap-4 border-b border-line bg-soft/60 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, i) => <Skeleton key={i} className="h-3 w-3/4" />)}</div>
    {Array.from({ length: rows }, (_, row) => <div key={row} className="grid gap-4 border-b border-line px-4 py-4 last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, col) => <Skeleton key={col} className="h-4 w-full max-w-40" />)}</div>)}
  </div>;
}
export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = usePrefs();
  return <div className="card flex flex-wrap items-center justify-between gap-3 border-bad bg-bad-soft text-bad"><span>{message}</span>{onRetry && <button className="btn-ghost btn-sm" onClick={onRetry}>{t("Try again")}</button>}</div>;
}
/** Page title. `back` puts a small "← Back" link at the top-left (never in the bottom buttons). */
export function PageHead({ eyebrow, title, back, children }: { eyebrow?: string; title: string; back?: string; children?: ReactNode }) {
  const { t } = usePrefs();
  return <div className="creative-pagehead flex flex-col gap-3">{back && <Link href={back} className="mb-1 self-start text-sm font-semibold text-muted hover:text-brand">← {t("Back")}</Link>}{eyebrow && <p className="eyebrow">{t(eyebrow)}</p>}<h1 className="text-3xl sm:text-4xl">{t(title)}</h1>{children && <div className="max-w-3xl text-muted">{children}</div>}</div>;
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
