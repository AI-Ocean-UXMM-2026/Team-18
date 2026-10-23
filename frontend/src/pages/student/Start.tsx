// Step 1 start: education level + quiz intro.
import { useLocation } from "wouter";
import type { Level } from "@/lib/api";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { Actions, Spinner } from "@/components/ui";
import { KipGuide } from "@/components/Kip";
import JourneyOverview from "@/components/JourneyOverview";
import { studentProgress } from "@/lib/studentFlow";

export default function Start() {
  const { j, set, ready, content } = useJourney(); const { t } = usePrefs(); const [, go] = useLocation();
  if (!ready) return <Spinner />;
  const levels: [Level, string, string][] = [
    ["g12", "Grade 12", "Myanmar Matriculation exam. Myanmar public universities."],
    ["ged", "GED", "US high school equivalency. Universities abroad."],
    ["igcse", "IGCSE", "Cambridge / Edexcel. Foundation programmes and partner degrees."],
  ];
  const flow = studentProgress(j, content);
  const answered = flow.answered;
  return (
    <>
      <section className="dashboard-hero dashboard-reveal creative-hero grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1.3fr_0.7fr]">
        <div className="dashboard-decoration" aria-hidden="true"><span /><span /><span /></div>
        <div className="relative z-10 flex min-w-0 flex-col items-start gap-5">
          <p className="creative-sticker px-3 py-1 text-xs font-semibold">✦ {t("Career quiz")}</p>
          <h1 className="creative-display">{t("Find your")}<br /><span className="text-hero-muted">{t("next move.")}</span></h1>
          <p className="max-w-md text-base leading-7 text-white/85">{content?.questions.length ?? 0} {t("questions. There are no right or wrong answers.")}</p>
          <div className="flex flex-wrap gap-2 text-xs text-white/90">{["Interests", "Strengths", "Possibilities"].map(label => <span key={label} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5"><span aria-hidden="true" className="mr-1.5 text-amber-200">✦</span>{t(label)}</span>)}</div>
          <div className="w-full max-w-sm rounded-xl border border-white/20 bg-white/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold text-white"><span>{t("Quiz progress")}</span><span className="font-mono">{answered} / {flow.total}</span></div>
            <div role="progressbar" aria-label={t("Quiz progress")} aria-valuenow={answered} aria-valuemin={0} aria-valuemax={Math.max(flow.total, 1)} className="h-2 overflow-hidden rounded-full bg-white/20"><div className="dashboard-progress h-full rounded-full bg-amber-200" style={{ width: `${flow.total ? Math.min(100, answered / flow.total * 100) : 0}%` }} /></div>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/75">{t("Discover your potential, explore your options, and take the next step toward your future.")}</p>
        </div>
        <div className="relative z-10 block"><KipGuide /></div>
      </section>
      <JourneyOverview />
      <section className="dashboard-reveal mt-3 flex flex-col gap-4">
        <div className="flex items-center gap-3"><span aria-hidden="true" className="font-mono text-xs font-bold text-brand">01 /</span><h2 className="text-xl">{t("Select your education level")}</h2></div>
        <div className="grid gap-4 sm:grid-cols-3">
          {levels.map(([id, name, sub], index) => <button key={id} aria-pressed={j.level === id} className={`dashboard-level dashboard-reveal choice relative level-choice ${j.level === id ? "choice-on" : ""}`} style={{ animationDelay: `${80 * (index + 1)}ms` }} onClick={() => set({ level: id, shortlist: [], compare: [] })}><span className="flex w-full items-center gap-3"><span className="level-number grid place-items-center" aria-hidden="true">0{index + 1}</span><svg aria-hidden="true" className="h-6 w-6 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={index === 0 ? "m2 9 10-5 10 5-10 5L2 9Zm4 3v6c4 3 8 3 12 0v-6M22 9v7" : index === 1 ? "M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18" : "M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"} /></svg></span>{j.level === id && <span className="absolute right-4 top-4 text-lg font-bold text-brand" aria-hidden="true">✓</span>}<b className="text-xl">{t(name)}</b><small className="mt-1 text-muted">{t(sub)}</small></button>)}
        </div>
      </section>
      {flow.quizDone && <p className="dashboard-reveal flex items-center gap-3 rounded-xl border border-ok/20 bg-ok-soft px-4 py-3 text-sm text-ok"><span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-card">✓</span>{t("You already finished the quiz.")}</p>}
      <Actions><button className="btn-primary" disabled={!j.level || !content} onClick={() => go(flow.nextPath)}>{t(flow.quizDone ? "Continue" : answered ? "Continue quiz" : "Start quiz")} <span aria-hidden="true">↗</span></button></Actions>
    </>
  );
}
