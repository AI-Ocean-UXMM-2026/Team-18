// Side-by-side university overview, tuition, scholarships and entry information.
import { useCallback, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { itemCode, itemName, type G12Item, type IntlItem, type UniItem } from "@/lib/api";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { useUniversities } from "@/lib/unis";
import { AdvisorChat } from "@/components/AdvisorChat";
import CompareUniversityPicker from "@/components/CompareUniversityPicker";
import { UniPhoto } from "@/components/UniCard";
import { Actions, Note, PageHead, Spinner, toast } from "@/components/ui";

export default function Compare() {
  const { j, set, save } = useJourney(); const { t } = usePrefs(); const { user, isGuest } = useAuth(); const [, go] = useLocation();
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const closePicker = useCallback(() => setPickerOpen(false), []);
  const { data, loading } = useUniversities(false, true);
  if (loading || !data) return <Spinner />;
  const find = (k: string) => data.items.find(i => i.key === k);
  const chosen = j.compare.map(find).filter(Boolean) as UniItem[];
  function addUniversity(item: UniItem) {
    set(previous => {
      if (previous.compare.includes(item.key) || previous.compare.length >= 3) return {};
      const compare = [...previous.compare, item.key];
      return { compare, shortlist: [...new Set([...compare, ...previous.shortlist])].slice(0, 30) };
    });
  }
  async function completeComparison(path = "/student/plan") {
    setSaving(true); setSaveError("");
    try {
      await save({ comparisonCompleted: true });
      if (!isGuest) toast(t("Saved"));
      go(path);
    } catch (error) { setSaveError(error instanceof Error ? error.message : t("Could not save your comparison. Please try again.")); }
    finally { setSaving(false); }
  }
  const lv = j.level === "igcse" ? "igcse" : "ged";
  const g12Rows: [string, (i: G12Item) => ReactNode][] = [
    ["Highlights", i => i.university.description],
    ["Programmes", i => i.programs.join(" · ")], ["Admission", i => i.university.admission], ["Type", i => i.university.type],
    ["Location", i => i.university.location], ["Established", i => i.university.established],
    ["Website", i => <a className="text-brand" href={i.university.website} target="_blank" rel="noreferrer">{i.university.website.replace(/^https?:\/\//, "")}</a>],
  ];
  const intlRows: [string, (i: IntlItem) => ReactNode][] = [
    ["Highlights", i => i.school.description],
    ["Annual Average Tuition", i => <div><p className="text-base font-bold text-brand">{i.school.annualTuition || t("Confirm with university")}</p>{!i.school.annualTuition && <a className="mt-1 inline-block text-xs text-brand underline" href={i.school.website} target="_blank" rel="noreferrer">{t("Official university website")}</a>}</div>],
    ["Scholarship Grants", i => <div className="space-y-2"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${i.school.hasScholarship ? "bg-ok-soft text-ok" : "bg-soft text-muted"}`}>{t(i.school.hasScholarship ? "Scholarship available" : "Confirm scholarship availability")}</span><p className="text-sm leading-6">{i.school.scholarship || t("Confirm with university")}</p></div>],
    ["Accepted Credentials", i => <div className="flex flex-wrap gap-2">{([ ["GED", i.school.ged.ok], ["IGCSE", i.school.igcse.ok] ] as const).map(([label, status]) => <span key={label} className={`rounded-md px-2 py-1 text-xs font-semibold ${status === "yes" ? "bg-brand-soft text-brand" : "bg-soft text-muted"}`}>{label} · {t(status === "yes" ? "Accepted" : status === "no" ? "Not direct" : "Confirm")}</span>)}</div>],
    ["Entry requirements", i => <>{i.school[lv].note}{lv === "ged" && i.school.ged.tests && <p className="text-xs text-muted">{i.school.ged.tests}</p>}</>],
    ["English requirement", i => i.school.english], ["Programmes", i => i.school.programs.join(" · ")], ["Degree / partner", i => i.school.partner],
    ["Admission process", i => i.school.admission], ["Pathway", i => i.school.pathway], ["Duration", i => i.school.duration], ["Intakes", i => i.school.intakes],
    ["Location", i => `${i.school.city}, ${i.school.country}`], ["Study mode", i => i.school.mode], ["Established", i => i.school.established || "–"],
    ["Website", i => <a className="text-brand" href={i.school.website} target="_blank" rel="noreferrer">{i.school.website.replace(/^https?:\/\//, "")}</a>],
    ["Source", i => <a className="text-brand" href={i.school.source} target="_blank" rel="noreferrer">{t("Entry info")} · {i.school.lastChecked}</a>],
  ];
  const rows = (j.level === "g12" ? g12Rows : intlRows) as [string, (i: UniItem) => ReactNode][];
  const expandableLabels = new Set(["Entry requirements", "English requirement", "Programmes", "Degree / partner", "Admission process"]);
  const collapsedRows = j.level === "g12" ? rows.slice(0, Math.ceil(rows.length / 2)) : rows.filter(([label]) => !expandableLabels.has(label));
  const visibleRows = showAllInfo ? rows : collapsedRows;
  return (
    <>
      <PageHead back="/student/explorer" eyebrow="Step 2 · Compare universities" title="Side by side" />
      {chosen.length < 2 && <Note>{t("Pick at least 2 to compare.")}</Note>}
      {chosen.length > 0 && (
        <div>
          <p className="px-1 pb-2 text-xs text-muted sm:hidden">{t("Swipe horizontally to compare universities")}</p>
          <div className="table-wrap max-w-full overflow-x-auto overscroll-x-contain" role="region" aria-label={t("Compare universities")} tabIndex={0}>
            <table className="w-full table-fixed" style={{ minWidth: `calc(9rem + ${18 * chosen.length}rem)` }}>
          <colgroup>
            <col style={{ width: "9rem" }} />
            {chosen.map(i => <col key={i.key} style={{ width: `calc(${100 / chosen.length}% - ${9 / chosen.length}rem)` }} />)}
          </colgroup>
          <thead><tr><th>{t("University overview")}</th>{chosen.map(i => <th key={i.key}><div className="[&>img]:h-28 [&>img]:aspect-auto [&>div]:h-28 [&>div]:aspect-auto"><UniPhoto item={i} small /></div><p className="mb-1 text-xs font-semibold uppercase text-brand">{i.kind === "g12" ? i.university.type : i.school.type}</p><span className="font-mono text-xs text-brand">{itemCode(i)}</span> <span className="text-sm text-ink">{itemName(i)}</span><p className="mt-1 text-xs font-normal text-muted">{i.kind === "g12" ? i.university.location : `${i.school.city}, ${i.school.country}`}</p><button className="mt-1 block min-h-11 border-0 bg-transparent p-0 text-sm font-semibold text-brand transition-colors hover:text-bad focus-visible:text-bad" disabled={saving} onClick={() => set(p => ({ compare: p.compare.filter(k => k !== i.key) }))}>{t("Remove")}</button></th>)}</tr></thead>
          <tbody>{visibleRows.map(([label, cell]) => <tr key={label}><th>{t(label)}</th>{chosen.map(i => <td key={i.key}>{cell(i)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
      {chosen.length > 0 && collapsedRows.length < rows.length && (
        <div className="flex justify-center">
          <button
            type="button"
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-ok/50 bg-card px-4 py-4 text-center font-semibold text-ok transition hover:bg-ok-soft"
            aria-expanded={showAllInfo}
            onClick={() => setShowAllInfo(value => !value)}
          >
            <svg
              aria-hidden="true"
              className={`h-5 w-5 transition-transform ${showAllInfo ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="none"
            >
              <path d="m4.5 7.5 5.5 5 5.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t(showAllInfo ? "Show less details" : "Show more details")}
          </button>
        </div>
      )}
      {j.level !== "g12" && chosen.length > 0 && <AdvisorChat title="AI university advisor" subtitle="Ask about the options in this table." endpoint="/ai/advisor" payload={{ level: j.level, careerId: j.careerId, majors: j.majors, comparing: chosen.map(itemName) }} suggestions={["Compare these for me in plain words", "Which one is the safest choice?"]} />}
      <Actions>{user?.isPro && <button className="btn-outline" disabled={chosen.length < 2 || saving} onClick={() => void completeComparison("/student/mentors")}>{t("Meet a mentor")}</button>}<button className="btn-primary" disabled={chosen.length < 2 || saving} onClick={() => void completeComparison()}>{t(saving ? "Saving�" : isGuest ? "Continue" : "Save & continue")}</button></Actions>
    </>
  );
}
