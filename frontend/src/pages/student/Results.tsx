// Top 3 careers with priority and the data behind each one.
import { Link } from "wouter";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { useScore } from "@/lib/top3";
import { AdvisorChat } from "@/components/AdvisorChat";
import { Actions, ErrorNote, PageHead, Spinner } from "@/components/ui";

export default function Results() {
  const { j, ready, set } = useJourney(); const { t } = usePrefs();
  const { data, loading, error, refresh } = useScore(j);
  if (!ready || loading) return <Spinner label="Analyzing your answers" />;
  if (error || !data) return <><ErrorNote message={error ?? "No data"} onRetry={refresh} /><Link href="/student/quiz" className="btn-ghost self-start">{t("Back to quiz")}</Link></>;
  return (
    <>
      <PageHead back="/student/quiz" eyebrow="Step 1 · Career results" title="Your top 3 career matches">{t("Your Holland code is")} <b className="font-mono text-ink">{data.holland}</b></PageHead>
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-3">
          {data.top.map(({ career, pct, reasons, priority }) => (
            <article key={career.id} className="card flex flex-col gap-2">
              <div className="flex justify-between text-sm"><span className="eyebrow">#{priority} {t("priority")}</span><span className="font-mono font-bold text-ok">{pct}% {t("match")}</span></div>
              <h2 className="text-xl">{career.t}</h2><p className="text-muted">{career.blurb}</p>
              <div className="rounded-xl bg-soft p-3 text-sm"><b>{t("Why it fits")}</b><ul className="list-disc pl-5">{reasons.map(r => <li key={r.code}>{t("High")} <b>{r.name}</b> ({r.score}){r.example ? `: “${r.example}”` : ""}</li>)}</ul></div>
            </article>
          ))}
        </div>
        <aside className="card flex flex-col gap-2">
          <h2 className="text-lg">{t("Your interest profile")}</h2>
          {Object.entries(data.scores).map(([code, v]) => <div key={code} className="grid grid-cols-[1.5rem_1fr_2rem] items-center gap-2 text-sm"><b className="font-mono">{code}</b><div className="h-2 overflow-hidden rounded-full bg-soft"><div className="h-full bg-brand" style={{ width: `${v}%` }} /></div><span className="text-right font-mono">{v}</span></div>)}
        </aside>
      </div>
      <AdvisorChat title="AI career coach" subtitle="Ask why a career fits you, or what the jobs are really like." endpoint="/ai/career" payload={{ answers: j.answers, level: j.level ?? "g12" }} suggestions={["Explain my results in simple words", "Which of my 3 matches suits me best, and why?"]} />
      <Actions><Link href="/student/movies" className="btn-primary" onClick={() => set({ resultsReviewed: true })}>{t("Next: short movies (optional)")}</Link></Actions>
    </>
  );
}
