// Step 1 start: education level + quiz intro (about 15 minutes).
import { useLocation } from "wouter";
import type { Level } from "@/lib/api";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { Actions, PageHead, Spinner } from "@/components/ui";

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
      <PageHead eyebrow="Step 1 · Career & major" title="Career quiz">{t("20 questions · about 15 minutes. There are no right or wrong answers.")}</PageHead>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg">{t("Select your education level")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {levels.map(([id, name, sub]) => <button key={id} className={`choice ${j.level === id ? "choice-on" : ""}`} onClick={() => set({ level: id, shortlist: [], compare: [] })}><b className="text-lg">{t(name)}</b><small className="text-muted">{t(sub)}</small></button>)}
        </div>
      </section>
      {answered === 20 && j.careerId && <p className="text-sm text-muted">{t("You already finished the quiz.")} <button className="font-semibold text-brand" onClick={() => go("/student/plan")}>{t("See my plan")}</button></p>}
      <Actions><button className="btn-primary" disabled={!j.level} onClick={() => go("/student/quiz")}>{t(answered ? "Continue quiz" : "Start quiz")}</button></Actions>
    </>
  );
}
