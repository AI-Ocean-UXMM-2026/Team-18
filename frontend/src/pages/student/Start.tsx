// Step 1 start: education level + quiz intro (about 15 minutes).
import { useLocation } from "wouter";
import type { Level } from "@/lib/api";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { Actions, Spinner } from "@/components/ui";
import { FutureSketch } from "@/components/FutureSketch";

export default function Start() {
  const { j, set, ready } = useJourney(); const { t } = usePrefs(); const [, go] = useLocation();
  if (!ready) return <Spinner />;
  const levels: [Level, string, string][] = [
    ["g12", "Grade 12", "Myanmar Matriculation exam. Myanmar public universities."],
    ["ged", "GED", "US high school equivalency. Universities abroad."],
    ["igcse", "IGCSE", "Cambridge / Edexcel. Foundation programmes and partner degrees."],
  ];
  const answered = Object.keys(j.answers).length;
  return (
    <>
      <section className="creative-hero grid items-center gap-2 p-6 sm:p-8 md:grid-cols-[1.3fr_0.7fr]">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <p className="creative-sticker creative-sticker-pink">✦ {t("Career quiz")}</p>
          <h1 className="creative-display">{t("Find your")}<br /><span className="creative-highlight">{t("next move.")}</span></h1>
          <p className="max-w-md text-sm leading-6 text-muted">{t("20 questions · about 15 minutes. There are no right or wrong answers.")}</p>
          <span className="rounded-full border border-line bg-card px-3 py-1.5 font-mono text-xs font-semibold">{answered} / 20 · {t("Quiz progress")}</span>
        </div>
        <div className="hidden md:block"><FutureSketch /></div>
      </section>
      <section className="mt-3 flex flex-col gap-4">
        <div className="flex items-center gap-3"><span aria-hidden="true" className="font-mono text-xs font-bold text-brand">01 /</span><h2 className="text-xl">{t("Select your education level")}</h2></div>
        <div className="grid gap-4 sm:grid-cols-3">
          {levels.map(([id, name, sub], index) => <button key={id} aria-pressed={j.level === id} className={`choice level-choice ${j.level === id ? "choice-on" : ""}`} onClick={() => set({ level: id, shortlist: [], compare: [] })}><span className="level-number" aria-hidden="true">0{index + 1}</span>{j.level === id && <span className="absolute right-4 top-4 text-lg font-bold text-brand" aria-hidden="true">✓</span>}<b className="text-xl">{t(name)}</b><small className="mt-1 text-muted">{t(sub)}</small></button>)}
        </div>
      </section>
      {answered === 20 && j.careerId && <p className="text-sm text-muted">{t("You already finished the quiz.")} <button className="font-semibold text-brand" onClick={() => go("/student/plan")}>{t("See my plan")}</button></p>}
      <Actions><button className="btn-primary" disabled={!j.level} onClick={() => go("/student/quiz")}>{t(answered ? "Continue quiz" : "Start quiz")} <span aria-hidden="true">↗</span></button></Actions>
    </>
  );
}
