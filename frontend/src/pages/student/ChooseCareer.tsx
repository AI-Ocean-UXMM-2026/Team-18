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
  const row = (label: string, cell: (x: (typeof top)[number]) => React.ReactNode) => <tr><th>{t(label)}</th>{top.map(x => <td key={x.career.id}>{cell(x)}</td>)}</tr>;
  return (
    <>
      <PageHead back="/student/movies" eyebrow="Step 1 · Choose your career" title="Compare your options and choose one" />
      <div className="table-wrap"><table>
        <thead><tr><th />{top.map(x => <th key={x.career.id} className="text-base text-ink">#{x.priority} {x.career.t}</th>)}</tr></thead>
        <tbody>
          {row("Match", x => <span className="font-mono">{x.pct}%</span>)}
          {row("Job demand", x => x.career.demand)}
          {row("Study length", x => x.career.study)}
          {row("Key school subjects", x => x.career.subjects.join(", "))}
          {row("Example jobs", x => x.career.positions.slice(0, 3).join(", "))}
          {row("Skills", x => x.career.skills.slice(0, 3).join(", "))}
          {row("", x => <button className={j.careerId === x.career.id ? "btn-primary btn-sm" : "btn-outline btn-sm"} onClick={() => choose(x.career.id)}>{t(j.careerId === x.career.id ? "Chosen" : "Choose")}</button>)}
        </tbody>
      </table></div>
      <Actions><button className="btn-primary" disabled={!j.careerId} onClick={() => go("/student/majors")}>{t("See majors for this career")}</button></Actions>
    </>
  );
}
