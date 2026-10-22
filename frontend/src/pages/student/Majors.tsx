import { Redirect, useLocation, Link } from "wouter";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { Actions, PageHead, Spinner } from "@/components/ui";

const PATHS = {
  g12: ["Matriculation exam (Grade 12)", "Apply to a Myanmar public university", "Bachelor degree in Myanmar", "First job or master's"],
  ged: ["Complete the GED", "IELTS / SAT if required", "Foundation, diploma or direct bachelor", "Bachelor degree abroad"],
  igcse: ["Complete IGCSE", "IELTS if required", "Foundation year (or A-Levels for direct entry)", "Bachelor degree"],
};
export default function Majors() {
  const { j, set, content, ready } = useJourney(); const { t } = usePrefs(); const [, go] = useLocation();
  if (!ready || !content) return <Spinner />;
  const c = content.careers.find(x => x.id === j.careerId);
  if (!c) return <Redirect to="/student/career" />;
  const toggle = (n: string) => set(p => ({ majors: p.majors.includes(n) ? p.majors.filter(m => m !== n) : [...p.majors, n].slice(-2), shortlist: [], compare: [] }));
  return (
    <>
      <PageHead back="/student/career" eyebrow="Step 1 · Major for your career" title={`${t("Majors for")} ${c.t}`} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card"><h2 className="mb-2 text-lg">{t("Relevant school subjects")}</h2><div className="flex flex-wrap gap-2">{c.subjects.map(s => <span key={s} className="rounded-full bg-soft px-3 py-1 text-sm">{s}</span>)}</div></div>
        <div className="card"><h2 className="mb-2 text-lg">{t("Learning pathway")}</h2><ol className="list-decimal pl-5">{PATHS[j.level ?? "g12"].map(p => <li key={p}>{t(p)}</li>)}</ol></div>
      </div>
      <h2 className="text-lg">{t("Choose up to 2 majors to explore")}</h2>
      <div className="grid gap-3 sm:grid-cols-3">{c.majors.map(m => <button key={m.n} className={`choice ${j.majors.includes(m.n) ? "choice-on" : ""}`} onClick={() => toggle(m.n)}><b>{m.n}</b><small className="text-muted">{content.fields[m.f]}</small></button>)}</div>
      <Actions><button className="btn-primary" disabled={!j.majors.length} onClick={() => go("/student/explorer")}>{t("Continue to Step 2: University / College")}</button></Actions>
    </>
  );
}
