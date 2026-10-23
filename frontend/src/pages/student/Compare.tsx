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
  const countries = new Set(chosen.map(item => item.kind === "g12" ? "Myanmar" : item.school.country).filter(Boolean));
  const programmes = new Set(chosen.flatMap(item => item.kind === "g12" ? item.programs : item.school.programs).map(name => name.trim().toLowerCase()).filter(Boolean));
  const highlights = [
    { label: "Universities", value: `${chosen.length} / 3`, icon: "M3 10 12 4l9 6M5 10v10m7-10v10m7-10v10M3 20h18", detail: "Your selected universities" },
    { label: "Countries", value: countries.size, icon: "M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18", detail: [...countries].join(" · ") || "Explore your options" },
    { label: "Programmes", value: programmes.size, icon: "M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14", detail: "Across your selected universities" },
  ];
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
    ["Annual Average Tuition", i => <div><p className="text-base font-bold text-brand">{t("Confirm with university")}</p><a className="mt-1 inline-block text-xs text-brand underline" href={i.university.website} target="_blank" rel="noreferrer">{t("Official university website")}</a></div>],
    ["Popular Degree Programs", i => i.programs.join(" · ")], ["Admission", i => i.university.admission], ["Type", i => i.university.type],
    ["Location", i => i.university.location], ["Established", i => i.university.established],
    ["Website", i => <a className="text-brand" href={i.university.website} target="_blank" rel="noreferrer">{i.university.website.replace(/^https?:\/\//, "")}</a>],
  ];
  const intlRows: [string, (i: IntlItem) => ReactNode][] = [
    ["Highlights", i => i.school.description],
    ["Annual Average Tuition", i => <div><p className="text-base font-bold text-brand">{i.school.annualTuition || t("Confirm with university")}</p>{!i.school.annualTuition && <a className="mt-1 inline-block text-xs text-brand underline" href={i.school.website} target="_blank" rel="noreferrer">{t("Official university website")}</a>}</div>],
    ["Scholarship Grants", i => <div className="space-y-2"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${i.school.hasScholarship ? "bg-ok-soft text-ok" : "bg-soft text-muted"}`}>{t(i.school.hasScholarship ? "Scholarship available" : "Confirm scholarship availability")}</span><p className="text-sm leading-6">{i.school.scholarship || t("Confirm with university")}</p></div>],
    ["Accepted Credentials", i => <div className="flex flex-wrap gap-2">{([ ["GED", i.school.ged.ok], ["IGCSE", i.school.igcse.ok] ] as const).map(([label, status]) => <span key={label} className={`rounded-md px-2 py-1 text-xs font-semibold ${status === "yes" ? "bg-brand-soft text-brand" : "bg-soft text-muted"}`}>{label} · {t(status === "yes" ? "Accepted" : status === "no" ? "Not direct" : "Confirm")}</span>)}</div>],
    ["Popular Degree Programs", i => i.school.programs.join(" · ")], ["Intakes & deadlines", i => i.school.intakes || t("Confirm with university")],
    ["Entry requirements", i => <>{i.school[lv].note}{lv === "ged" && i.school.ged.tests && <p className="text-xs text-muted">{i.school.ged.tests}</p>}</>],
    ["English requirement", i => i.school.english], ["Degree / partner", i => i.school.partner],
    ["Admission process", i => i.school.admission], ["Pathway", i => i.school.pathway], ["Duration", i => i.school.duration],
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
      <div className="compare-hero compare-enter flex flex-col gap-4 rounded-2xl border border-brand/20 p-5 sm:p-7 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <PageHead back="/student/explorer" eyebrow="Step 2 · Side by side" title="Compare Universities">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand" aria-live="polite">{chosen.length} / 3 {t("selected to compare")}</span>
              <span>{t("Directly compare tuition, scholarships, accepted credentials, and university highlights.")}</span>
            </div>
          </PageHead>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 xl:pt-8">
          <button type="button" className="btn-outline" onClick={() => setPickerOpen(true)} disabled={saving}>
            <span aria-hidden="true" className="mr-1 text-lg leading-none">+</span>{t("Add University")}
          </button>
          <button type="button" className="btn-primary" disabled={chosen.length < 2 || saving} onClick={() => void completeComparison()}>
            {t(saving ? "Saving…" : "Go to My Plan")}
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3" aria-label={t("Comparison highlights")}>
        {highlights.map((highlight, index) => <div key={highlight.label} className="compare-highlight compare-enter flex items-center gap-4 rounded-xl border border-line bg-card p-4" style={{ animationDelay: `${80 * (index + 1)}ms` }}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={highlight.icon} /></svg></span>
          <div className="min-w-0"><p className="flex flex-wrap items-baseline gap-x-2"><strong className="text-2xl tabular-nums text-ink">{highlight.value}</strong><span className="text-sm font-semibold text-muted">{t(highlight.label)}</span></p><p className="mt-1 text-xs leading-5 text-muted">{t(highlight.detail)}</p></div>
        </div>)}
      </div>
      {chosen.length === 0 && <div className="compare-enter flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand/40 bg-brand-soft/40 px-5 py-8 text-center">
        <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-full bg-card text-3xl text-brand">+</span>
        <h2 className="text-lg">{t("Build your comparison")}</h2><p className="max-w-md text-sm text-muted">{t("Choose up to three universities to explore their differences together.")}</p>
        <button type="button" className="btn-primary" onClick={() => setPickerOpen(true)} disabled={saving}>{t("Add University")}</button>
      </div>}
      {chosen.length < 2 && <Note>{t("Pick at least 2 to compare.")}</Note>}
      {saveError && <Note>{saveError}</Note>}
      {chosen.length > 0 && (
        <div>
          <p className="px-1 pb-2 text-xs text-muted sm:hidden">{t("Swipe horizontally to compare universities")}</p>
          <div className="compare-table compare-enter table-wrap max-w-full overflow-x-auto overscroll-x-contain" role="region" aria-label={t("Compare universities")} tabIndex={0}>
            <table className="w-full table-fixed" style={{ minWidth: `calc(9rem + ${18 * chosen.length}rem)` }}>
          <colgroup>
            <col style={{ width: "9rem" }} />
            {chosen.map(i => <col key={i.key} style={{ width: `calc(${100 / chosen.length}% - ${9 / chosen.length}rem)` }} />)}
          </colgroup>
          <thead><tr><th>{t("University overview")}</th>{chosen.map(i => <th key={i.key}><div className="relative [&>div]:h-28 [&>div]:aspect-auto [&>img]:h-28 [&>img]:aspect-auto"><UniPhoto item={i} small /><button type="button" className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-bad/30 bg-card/95 text-bad shadow-sm transition-colors hover:border-bad hover:bg-bad-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bad" aria-label={t("Remove from compare")} title={t("Remove from compare")} disabled={saving} onClick={() => set(p => ({ compare: p.compare.filter(k => k !== i.key) }))}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3" /></svg></button></div><p className="mb-1 text-xs font-semibold uppercase text-brand">{i.kind === "g12" ? i.university.type : i.school.type}</p><span className="font-mono text-xs text-brand">{itemCode(i)}</span> <span className="text-sm text-ink">{itemName(i)}</span><p className="mt-1 text-xs font-normal text-muted">{i.kind === "g12" ? i.university.location : `${i.school.city}, ${i.school.country}`}</p></th>)}</tr></thead>
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
      <Actions>{user?.isPro && <button className="btn-outline" disabled={chosen.length < 2 || saving} onClick={() => void completeComparison("/student/mentors")}>{t("Meet a mentor")}</button>}<button className="btn-primary" disabled={chosen.length < 2 || saving} onClick={() => void completeComparison()}>{t(saving ? "Saving…" : isGuest ? "Continue" : "Save & continue")}</button></Actions>
      {pickerOpen && <CompareUniversityPicker items={data.items} selected={j.compare} onAdd={addUniversity} onClose={closePicker} />}
    </>
  );
}
