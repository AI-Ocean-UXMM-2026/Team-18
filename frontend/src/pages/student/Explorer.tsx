// Step 2: university / college explorer (information only; scholarships are a filter, not a rule).
import { useMemo, useState } from "react";
import { Redirect, useLocation } from "wouter";
import { itemName } from "@/lib/api";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { useUniversities } from "@/lib/unis";
import { AdvisorChat } from "@/components/AdvisorChat";
import { UniCard } from "@/components/UniCard";
import { CardGridSkeleton, ErrorNote, Note, PageHead, Spinner, toast } from "@/components/ui";

function placeFilter(item: import("@/lib/api").UniItem) {
  if (item.kind === "intl") return { value: `country:${item.school.country}`, label: item.school.country };
  const region = item.university.location.split(",").at(-1)?.trim() || "Myanmar";
  return { value: `region:${region}`, label: `${region}, Myanmar` };
}

function acceptsCredential(item: import("@/lib/api").UniItem, credential: string) {
  if (!credential) return true;
  if (item.kind === "g12") return credential === "Grade 12";
  if (credential === "GED") return item.school.ged.ok.toLowerCase() === "yes";
  if (credential === "IGCSE") return item.school.igcse.ok.toLowerCase() === "yes";
  return /matriculation|grade\s*12/i.test(item.school.admission);
}

export default function Explorer() {
  const { j, set, ready } = useJourney(); const { t } = usePrefs();
  const [, go] = useLocation();
  const [searchText, setSearchText] = useState(""); const [query, setQuery] = useState(""); const [scholarship, setScholarship] = useState(false); const [allFields, setAllFields] = useState(true);
  const { data, loading, error, refresh } = useUniversities(scholarship, allFields);
  const g12 = j.level === "g12";
  const placeOptions = useMemo(() => Array.from(new Map((data?.items ?? []).map(item => {
    const place = placeFilter(item); return [place.value, place] as const;
  })).values()).sort((a, b) => a.label.localeCompare(b.label)), [data]);
  const [place, setPlace] = useState(""); const [credential, setCredential] = useState("");
  const items = useMemo(() => (data?.items ?? []).filter(item => {
    const searchFields = item.kind === "g12"
      ? [item.university.name, item.university.location, ...item.programs]
      : [item.school.name, item.school.city, item.school.country, ...item.school.programs];
    return (!query || searchFields.join(" ").toLowerCase().includes(query.toLowerCase()))
      && (!place || placeFilter(item).value === place)
      && acceptsCredential(item, credential);
  }), [data, query, place, credential]);
  if (!ready) return <Spinner />;
  if (!j.careerId || !j.level) return <Redirect to="/student" />;
  const toggle = (list: "shortlist" | "compare", key: string) => set(p => {
    const has = p[list].includes(key);
    if (list === "compare" && !has && p.compare.length >= 3) { toast(t("Compare up to 3. Remove one first.")); return {}; }
    const next = has ? p[list].filter(k => k !== key) : [...p[list], key];
    return list === "compare" && !has && !p.shortlist.includes(key) ? { compare: next, shortlist: [...p.shortlist, key] } : { [list]: next };
  });
  return (
    <>
      <PageHead back="/student/majors" eyebrow="Step 2 · University / college explorer" title={g12 ? "Myanmar universities for your major" : "Universities for GED / IGCSE students"} />
      {!g12 && <Note>{t("GED and IGCSE students usually study abroad. These universities in Thailand, Singapore and Malaysia accept GED or IGCSE students. Use the filter to see only those with scholarships.")}</Note>}
      {!g12 && <AdvisorChat title="AI university advisor" subtitle="Answers use only the CareerNest data on this page. Always confirm with the university." endpoint="/ai/advisor" payload={{ level: j.level, careerId: j.careerId, majors: j.majors }} suggestions={["Which option fits me best, and why?", "Which ones offer scholarships?", "Draft an email to confirm GED/IGCSE entry"]} />}
      <div className="card grid items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
        <form className="flex min-w-0 items-end gap-2 xl:col-span-2" onSubmit={e => { e.preventDefault(); setQuery(searchText.trim()); }}>
          <label className="label min-w-0 flex-1">{t("Search")}<span className="relative block"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg><input className="input pl-10" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder={t("University name or city")} /></span></label>
          <button className="btn-primary shrink-0" type="submit">{t("Search")}</button>
        </form>
        <label className="label">{t("Country or region")}<select className="input" aria-label={t("Country or region")} value={place} onChange={e => setPlace(e.target.value)}><option value="">{t("All countries & regions")}</option>{placeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="label">{t("Accepted credential")}<select className="input" aria-label={t("Accepted credential")} value={credential} onChange={e => setCredential(e.target.value)}><option value="">{t("All credentials")}</option><option value="Grade 12">{t("Grade 12")}</option><option value="GED">GED</option><option value="IGCSE">IGCSE</option></select></label>
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allFields} onChange={e => setAllFields(e.target.checked)} aria-describedby="all-fields-help" />{t("Show all fields")}</label>
          <p id="all-fields-help" className="pl-6 text-xs leading-5 text-muted">{t("All fields are shown by default. Turn this off to match your selected majors.")}</p>
        </div>
        {!g12 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={scholarship} onChange={e => setScholarship(e.target.checked)} />{t("Only universities with scholarships for international students")}</label>}
      </div>
      {error && <ErrorNote message={error} onRetry={refresh} />}
      {loading && <CardGridSkeleton count={4} />}
      {!loading && <p className="text-sm text-muted">{items.length} {t("results")}</p>}
      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map(i => <UniCard key={i.key} item={i} level={j.level!} inShortlist={j.shortlist.includes(i.key)} inCompare={j.compare.includes(i.key)} onToggle={toggle} />)}</div>
      {!loading && !items.length && <div className="card text-center text-muted">{t("No universities found. Try “Show all fields”.")}</div>}
      <div className="sticky bottom-0 z-20 isolate flex flex-wrap items-center gap-3 border-t border-line bg-bg px-4 py-3">
        <span className="mr-auto text-sm text-muted">{j.compare.length} / 3 {t("selected to compare")}{j.compare.length ? ` · ${items.filter(i => j.compare.includes(i.key)).map(itemName).join(", ")}` : ""}</span>
        <button className="btn-primary" disabled={j.compare.length < 2} onClick={() => go("/student/compare")}>{t("Compare universities")}</button>
      </div>
    </>
  );
}
