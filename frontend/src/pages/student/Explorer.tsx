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

export default function Explorer() {
  const { j, set, ready } = useJourney(); const { t } = usePrefs();
  const [, go] = useLocation();
  const [query, setQuery] = useState(""); const [scholarship, setScholarship] = useState(false); const [allFields, setAllFields] = useState(false);
  const { data, loading, error, refresh } = useUniversities(scholarship, allFields);
  const g12 = j.level === "g12";
  const items = useMemo(() => (data?.items ?? []).filter(i => !query || JSON.stringify(i).toLowerCase().includes(query.toLowerCase())), [data, query]);
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
      <div className="card grid items-end gap-4 md:grid-cols-3">
        <label className="label grow">{t("Search")}<input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder={t("University or programme")} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allFields} onChange={e => setAllFields(e.target.checked)} />{t("Show all fields")}</label>
        {!g12 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={scholarship} onChange={e => setScholarship(e.target.checked)} />{t("Only universities with scholarships for international students")}</label>}
      </div>
      {error && <ErrorNote message={error} onRetry={refresh} />}
      {loading && <CardGridSkeleton count={4} />}
      {!loading && <p className="text-sm text-muted">{items.length} {t("results")}</p>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map(i => <UniCard key={i.key} item={i} level={j.level!} inShortlist={j.shortlist.includes(i.key)} inCompare={j.compare.includes(i.key)} onToggle={toggle} />)}</div>
      {!loading && !items.length && <div className="card text-center text-muted">{t("No universities found. Try “Show all fields”.")}</div>}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-bg px-4 py-3">
        <span className="mr-auto text-sm text-muted">{j.compare.length} / 3 {t("selected to compare")}{j.compare.length ? ` · ${items.filter(i => j.compare.includes(i.key)).map(itemName).join(", ")}` : ""}</span>
        <button className="btn-primary" disabled={j.compare.length < 2} onClick={() => go("/student/compare")}>{t("Compare universities")}</button>
      </div>
    </>
  );
}
