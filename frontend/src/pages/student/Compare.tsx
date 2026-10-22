// Side-by-side compare. No fees, no marks. Choices auto-save to the account.
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { itemCode, itemName, type G12Item, type IntlItem, type UniItem } from "@/lib/api";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { useUniversities } from "@/lib/unis";
import { AdvisorChat } from "@/components/AdvisorChat";
import { UniPhoto } from "@/components/UniCard";
import { Actions, Note, PageHead, Spinner, toast } from "@/components/ui";

export default function Compare() {
  const { j, set } = useJourney(); const { t } = usePrefs(); const { user, isGuest } = useAuth(); const [, go] = useLocation();
  const { data, loading } = useUniversities(false, true);
  if (loading || !data) return <Spinner />;
  const find = (k: string) => data.items.find(i => i.key === k);
  const chosen = j.compare.map(find).filter(Boolean) as UniItem[];
  const addable = j.shortlist.filter(k => !j.compare.includes(k)).map(find).filter(Boolean) as UniItem[];
  const lv = j.level === "igcse" ? "igcse" : "ged";
  const g12Rows: [string, (i: G12Item) => ReactNode][] = [
    ["Programmes", i => i.programs.join(" · ")], ["Admission", i => i.university.admission], ["Type", i => i.university.type],
    ["Location", i => i.university.location], ["Established", i => i.university.established],
    ["Website", i => <a className="text-brand" href={i.university.website} target="_blank" rel="noreferrer">{i.university.website.replace(/^https?:\/\//, "")}</a>],
  ];
  const intlRows: [string, (i: IntlItem) => ReactNode][] = [
    ["Scholarships", i => <span className={i.school.hasScholarship ? "" : "text-muted"}>{i.school.scholarship}</span>],
    ["Entry requirements", i => <>{i.school[lv].note}{lv === "ged" && i.school.ged.tests && <p className="text-xs text-muted">{i.school.ged.tests}</p>}</>],
    ["English requirement", i => i.school.english], ["Programmes", i => i.school.programs.join(" · ")], ["Degree / partner", i => i.school.partner],
    ["Admission process", i => i.school.admission], ["Pathway", i => i.school.pathway], ["Duration", i => i.school.duration], ["Intakes", i => i.school.intakes],
    ["Location", i => `${i.school.city}, ${i.school.country}`], ["Study mode", i => i.school.mode], ["Established", i => i.school.established || "–"],
    ["Website", i => <a className="text-brand" href={i.school.website} target="_blank" rel="noreferrer">{i.school.website.replace(/^https?:\/\//, "")}</a>],
    ["Source", i => <a className="text-brand" href={i.school.source} target="_blank" rel="noreferrer">{t("Entry info")} · {i.school.lastChecked}</a>],
  ];
  const rows = (j.level === "g12" ? g12Rows : intlRows) as [string, (i: UniItem) => ReactNode][];
  return (
    <>
      <PageHead back="/student/explorer" eyebrow="Step 2 · Compare universities" title="Side by side" />
      {chosen.length < 2 && <Note>{t("Pick at least 2 to compare.")}</Note>}
      {addable.length > 0 && chosen.length < 3 && <div className="flex flex-wrap gap-2">{addable.map(i => <button key={i.key} className="btn-outline btn-sm" onClick={() => set(p => ({ compare: [...p.compare, i.key].slice(0, 3) }))}>+ {itemCode(i)}</button>)}</div>}
      {chosen.length > 0 && (
        <div className="table-wrap"><table>
          <thead><tr><th className="w-40" />{chosen.map(i => <th key={i.key}><UniPhoto item={i} small /><span className="font-mono text-xs text-brand">{itemCode(i)}</span> <span className="text-sm text-ink">{itemName(i)}</span><button className="block text-xs font-semibold text-brand" onClick={() => set(p => ({ compare: p.compare.filter(k => k !== i.key) }))}>{t("Remove")}</button></th>)}</tr></thead>
          <tbody>{rows.map(([label, cell]) => <tr key={label}><th>{t(label)}</th>{chosen.map(i => <td key={i.key} className="min-w-52">{cell(i)}</td>)}</tr>)}</tbody>
        </table></div>
      )}
      {j.level !== "g12" && chosen.length > 0 && <AdvisorChat title="AI university advisor" subtitle="Ask about the options in this table." endpoint="/ai/advisor" payload={{ level: j.level, careerId: j.careerId, majors: j.majors, comparing: chosen.map(itemName) }} suggestions={["Compare these for me in plain words", "Which one is the safest choice?"]} />}
      <Actions>{user?.isPro && <Link href="/student/mentors" className="btn-outline">{t("Meet a mentor")}</Link>}<button className="btn-primary" onClick={() => { if (!isGuest) toast(t("Saved")); go("/student/plan"); }}>{t(isGuest ? "Continue" : "Save & continue")}</button></Actions>
    </>
  );
}
