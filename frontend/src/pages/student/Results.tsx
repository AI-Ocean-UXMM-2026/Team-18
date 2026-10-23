// Top 3 careers with priority and the data behind each one.
import { Kip } from "@/components/Kip";
import { Link } from "wouter";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { useScore } from "@/lib/top3";
import { Actions, ErrorNote, PageHead, Spinner } from "@/components/ui";

export default function Results() {
  const { j, ready, set } = useJourney(); const { t } = usePrefs();
  const { data, loading, error, refresh } = useScore(j);
  if (!ready || loading) return <Spinner label="Analyzing your answers" />;
  if (error || !data) return <><ErrorNote message={error ?? "No data"} onRetry={refresh} /><Link href="/student/quiz" className="btn-ghost self-start">{t("Back to quiz")}</Link></>;
  return (
    <>
      <PageHead back="/student/quiz" eyebrow="Step 1 · Career results" title="Your top 3 career matches">{t("Your Holland code is")} <b className="font-mono text-ink">{data.holland}</b></PageHead>
      <section className="flex items-center gap-5 rounded-xl border border-brand/20 bg-brand-soft p-5"><Kip size={90} /><div><h2 className="text-lg sm:col-span-2 lg:col-span-3">{t("Your next chapter starts here")}</h2><p className="mt-1 text-sm text-muted">{t("Explore these career matches based on your interests and strengths. Your results are a starting point, not a limit.")}</p></div></section>
      <div className="flex flex-col gap-6">
        <div className="grid gap-5 lg:grid-cols-3">
          {data.top.map(({ career, pct, reasons, priority }) => (
            <article key={career.id} className="card card-flush flex h-full flex-col overflow-hidden">
              <div className="border-b border-line bg-gradient-to-b from-soft to-card p-5">
                <div className="mb-3 flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-deep text-xs font-bold text-white">#{priority}</span><span className="rounded-full border border-ok/20 bg-ok-soft px-3 py-1 text-xs font-bold text-ok">✦ {pct}% {t("match")}</span></div>
                <h2 className="text-lg">{career.t}</h2><p className="mt-2 text-sm leading-6 text-muted">{career.blurb}</p>
              </div>
              <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-soft p-3 text-xs"><div><span className="block text-muted">{t("Study length")}</span><b>{career.study}</b></div><div><span className="block text-muted">{t("Job demand")}</span><b className="text-ok">{career.demand}</b></div></div>
                <div><h3 className="mb-2 text-xs uppercase tracking-wide">{t("Why it fits")}</h3><ul className="space-y-2 text-sm">{reasons.map(r => <li key={r.code} className="flex gap-2"><span className="text-ok">✓</span><span>{t("High")} <b>{r.name}</b> ({r.score}){r.example ? `: “${r.example}”` : ""}</span></li>)}</ul></div>
                <div><h3 className="mb-2 text-xs uppercase tracking-wide">{t("Skills")}</h3><div className="flex flex-wrap gap-1.5">{career.skills.slice(0,3).map(skill => <span key={skill} className="rounded bg-brand-soft px-2 py-1 text-xs text-brand">{skill}</span>)}</div></div>
                <details className="border-t border-line pt-3 text-sm"><summary className="cursor-pointer font-semibold text-brand">{t("Inspect full details")}</summary><p className="mt-3"><b>{t("Example jobs")}: </b>{career.positions.join(", ")}</p><p className="mt-2"><b>{t("Key school subjects")}: </b>{career.subjects.join(", ")}</p></details>
              </div>
            </article>
          ))}
        </div>
        <aside className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <h2 className="text-lg sm:col-span-2 lg:col-span-3">{t("Your interest profile")}</h2>
          {Object.entries(data.scores).map(([code, v]) => <div key={code} className="grid grid-cols-[1.5rem_1fr_2rem] items-center gap-2 text-sm"><b className="font-mono">{code}</b><div className="h-2 overflow-hidden rounded-full bg-soft"><div className="h-full bg-brand" style={{ width: `${v}%` }} /></div><span className="text-right font-mono">{v}</span></div>)}
        </aside>
      </div>
      <Actions><Link href="/student/movies" className="btn-primary" onClick={() => set({ resultsReviewed: true })}>{t("Next: short movies (optional)")}</Link></Actions>
    </>
  );
}
