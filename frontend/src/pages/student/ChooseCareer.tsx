import { Link, useLocation } from "wouter";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { useScore } from "@/lib/top3";
import { Actions, PageHead, Spinner } from "@/components/ui";

export default function ChooseCareer() {
  const { j, set } = useJourney(); const { t } = usePrefs(); const [, go] = useLocation();
  const { data, loading } = useScore(j);
  if (loading || !data) return <Spinner />;
  const top = data.top;
  const choose = (id: string) => set(p => (p.careerId === id ? {} : { careerId: id, majors: [], shortlist: [], compare: [] }));
  return (
    <>
      <PageHead back="/student/movies" eyebrow="Step 1 · Choose your career" title="Compare your options and choose one" />
      <section className="space-y-3" aria-labelledby="career-fit-heading">
        <div><h2 id="career-fit-heading" className="text-lg">{t("Your career matches")}</h2><p className="text-sm text-muted">{t("Pick the career that feels right to you.")}</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {top.map(x => {
            const chosen = j.careerId === x.career.id;
            return <article key={x.career.id} className={`card flex h-full flex-col gap-4 ${chosen ? "border-brand ring-1 ring-brand/30" : ""}`}>
              <div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft font-mono text-sm font-bold text-brand">#{x.priority}</span><span className="rounded-full bg-ok-soft px-3 py-1 text-xs font-bold text-ok">{x.pct}% {t("match")}</span></div>
              <h3 className="text-lg leading-snug">{x.career.t}</h3>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm"><span className="text-muted">{t("Job demand")}</span><b>{t(x.career.demand)}</b></div>
              <button className={`mt-auto w-full ${chosen ? "btn-primary" : "btn-outline"}`} aria-pressed={chosen} onClick={() => choose(x.career.id)}>{t(chosen ? "Chosen" : "Choose")}</button>
            </article>;
          })}
        </div>
      </section>
      <section className="space-y-3" aria-labelledby="career-study-heading">
        <div><h2 id="career-study-heading" className="text-lg">{t("Study preparation")}</h2><p className="text-sm text-muted">{t("See the study length and school subjects for each option.")}</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {top.map(x => <article key={x.career.id} className="card space-y-4">
            <h3 className="font-semibold leading-snug">{x.career.t}</h3>
            <div className="rounded-lg bg-soft p-3"><span className="block text-xs text-muted">{t("Study length")}</span><b className="text-sm">{x.career.study}</b></div>
            <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("Key school subjects")}</h4><div className="flex flex-wrap gap-1.5">{x.career.subjects.map(subject => <span key={subject} className="rounded-full bg-brand-soft px-2.5 py-1 text-xs text-brand">{subject}</span>)}</div></div>
          </article>)}
        </div>
      </section>
      <section className="space-y-3" aria-labelledby="career-work-heading">
        <div><h2 id="career-work-heading" className="text-lg">{t("Work and skills")}</h2><p className="text-sm text-muted">{t("Explore example roles and skills for each career.")}</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {top.map(x => <article key={x.career.id} className="card space-y-4">
            <h3 className="font-semibold leading-snug">{x.career.t}</h3>
            <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("Example jobs")}</h4><ul className="space-y-1 text-sm">{x.career.positions.slice(0, 3).map(role => <li key={role}>• {role}</li>)}</ul></div>
            <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("Skills")}</h4><div className="flex flex-wrap gap-1.5">{x.career.skills.slice(0, 3).map(skill => <span key={skill} className="rounded-full bg-soft px-2.5 py-1 text-xs">{skill}</span>)}</div></div>
          </article>)}
        </div>
      </section>
      <Actions><button className="btn-primary" disabled={!j.careerId} onClick={() => go("/student/majors")}>{t("See majors for this career")}</button></Actions>
    </>
  );
}
