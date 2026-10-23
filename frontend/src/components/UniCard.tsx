import { useCallback, useState } from "react";
import type { UniItem } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";
import UniversityDetailsDialog from "@/components/UniversityDetailsDialog";

export function UniPhoto({ item, small }: { item: UniItem; small?: boolean }) {
  const src = item.kind === "g12" ? item.university.photo : item.school.photo;
  const code = item.kind === "g12" ? item.university.code : item.school.code;
  const where = item.kind === "g12" ? item.university.location : `${item.school.city.split("·")[0].trim()}, ${item.school.country}`;
  const cls = small ? "mb-2 aspect-[2/1] w-full rounded-lg" : "aspect-[16/7] w-full rounded-lg";
  if (src) return <img src={src} alt={`${code} campus`} loading="lazy" className={`${cls} object-cover`} />;
  return <div className={`${cls} flex flex-col justify-end bg-gradient-to-br from-brand-soft to-soft p-4 text-brand`} aria-hidden="true"><b className="text-2xl">{code}</b><span className="text-xs text-muted">{where}</span></div>;
}

export function UniCard({ item, level, inCompare, onToggle }: { item: UniItem; level: string; inCompare: boolean; onToggle: (l: "shortlist" | "compare", k: string) => void }) {
  const { t } = usePrefs(); const [detailsOpen, setDetailsOpen] = useState(false);
  const closeDetails = useCallback(() => setDetailsOpen(false), []);
  const website = item.kind === "g12" ? item.university.website : item.school.website;
  return (
    <>
    <article className="card flex min-w-0 flex-col gap-3 overflow-hidden transition-colors hover:border-brand focus-within:border-brand">
      <div className="relative shrink-0"><UniPhoto item={item} /><button type="button" onClick={() => onToggle("compare", item.key)} aria-label={t(inCompare ? "Remove from compare" : "Add to compare")} aria-pressed={inCompare} title={t(inCompare ? "Remove from compare" : "Add to compare")} className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border shadow-sm transition-colors ${inCompare ? "border-brand bg-brand text-on-brand" : "border-line bg-card/95 text-muted hover:border-brand hover:text-brand"}`}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{inCompare ? <path d="m5 12 4 4L19 6" /> : <><rect x="3.5" y="4.5" width="7" height="15" rx="1.5" /><rect x="13.5" y="4.5" width="7" height="6" rx="1.5" /><path d="M17 14v5m-2.5-2.5h5" /></>}</svg></button></div>
      <div className="flex h-20 shrink-0 items-start gap-3">
        <span className="rounded-md bg-soft px-2 py-1 font-mono text-xs text-brand">{item.kind === "g12" ? item.university.code : item.school.code}</span>
        <div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-base">{item.kind === "g12" ? item.university.name : item.school.name}</h3>
          <p className="line-clamp-2 text-xs text-muted">{item.kind === "g12" ? `${item.university.location} · ${item.university.type}` : `${item.school.city}, ${item.school.country} · ${item.school.type}`}</p></div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 [overflow-wrap:anywhere]">
        <p className="line-clamp-2 h-12 text-sm leading-6">{item.kind === "g12" ? item.university.description : item.school.description}</p>
        {item.kind === "g12" ? <div className="h-24 overflow-hidden text-sm"><p className="font-semibold">{t("Programmes in your field")}:</p><div className="mt-1.5 flex flex-wrap gap-1.5">{item.programs.slice(0, 6).map(p => <span key={p} className="rounded-full bg-soft px-2.5 py-0.5 text-xs">{p}</span>)}{item.programs.length > 6 && <span className="text-xs text-muted">+{item.programs.length - 6}</span>}</div></div>
          : <div className={`h-24 overflow-hidden rounded-lg px-3 py-2 text-sm leading-6 ${item.school.hasScholarship ? "bg-ok-soft" : "bg-soft text-muted"}`}><p className="line-clamp-3"><b>{t("Scholarship")}:</b> {item.school.scholarship}</p></div>}
        <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-line pt-3">
          <button type="button" className="btn-primary min-w-0 px-3" onClick={() => setDetailsOpen(true)} aria-haspopup="dialog">{t("View Full Details")}</button>
          {website && <a className="btn-outline btn-sm shrink-0" href={website} target="_blank" rel="noreferrer">{t("Portal")}<svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3h6v6m0-6-8 8"/><path d="M15 11v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/></svg></a>}
        </div>
      </div>
    </article>
    {detailsOpen && <UniversityDetailsDialog item={item} level={level} onClose={closeDetails} />}
    </>
  );
}
