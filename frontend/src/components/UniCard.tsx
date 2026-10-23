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

export function UniCard({ item, level, inShortlist, inCompare, onToggle }: { item: UniItem; level: string; inShortlist: boolean; inCompare: boolean; onToggle: (l: "shortlist" | "compare", k: string) => void }) {
  const { t } = usePrefs(); const [detailsOpen, setDetailsOpen] = useState(false);
  const closeDetails = useCallback(() => setDetailsOpen(false), []);
  return (
    <>
    <article className="card flex min-w-0 flex-col gap-3 overflow-hidden transition-colors hover:border-brand focus-within:border-brand">
      <div className="relative shrink-0"><UniPhoto item={item} /><button type="button" onClick={() => onToggle("shortlist", item.key)} aria-label={t(inShortlist ? "Remove from shortlist" : "Add to shortlist")} aria-pressed={inShortlist} title={t(inShortlist ? "Remove from shortlist" : "Add to shortlist")} className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border shadow-sm transition-colors ${inShortlist ? "border-ok bg-ok text-white" : "border-line bg-card/95 text-muted hover:border-brand hover:text-brand"}`}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={inShortlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 4.75A1.75 1.75 0 0 1 8.25 3h7.5a1.75 1.75 0 0 1 1.75 1.75V21l-5.75-3.8L6 21V4.75Z" /></svg></button></div>
      <div className="flex h-20 shrink-0 items-start gap-3">
        <span className="rounded-md bg-soft px-2 py-1 font-mono text-xs text-brand">{item.kind === "g12" ? item.university.code : item.school.code}</span>
        <div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-base">{item.kind === "g12" ? item.university.name : item.school.name}</h3>
          <p className="line-clamp-2 text-xs text-muted">{item.kind === "g12" ? `${item.university.location} · ${item.university.type}` : `${item.school.city}, ${item.school.country} · ${item.school.type}`}</p></div>
      </div>
      <div className="min-w-0 space-y-3 [overflow-wrap:anywhere]">
        <p className="line-clamp-2 h-12 text-sm leading-6">{item.kind === "g12" ? item.university.description : item.school.description}</p>
        {item.kind === "g12" ? <div className="h-24 overflow-hidden text-sm"><p className="font-semibold">{t("Programmes in your field")}:</p><div className="mt-1.5 flex flex-wrap gap-1.5">{item.programs.slice(0, 6).map(p => <span key={p} className="rounded-full bg-soft px-2.5 py-0.5 text-xs">{p}</span>)}{item.programs.length > 6 && <span className="text-xs text-muted">+{item.programs.length - 6}</span>}</div></div>
          : <div className={`h-24 overflow-hidden rounded-lg px-3 py-2 text-sm leading-6 ${item.school.hasScholarship ? "bg-ok-soft" : "bg-soft text-muted"}`}><p className="line-clamp-3"><b>{t("Scholarship")}:</b> {item.school.scholarship}</p></div>}
        <button type="button" className="w-full border-t border-line pt-2 text-left text-sm font-semibold leading-6 text-brand hover:underline" onClick={() => setDetailsOpen(true)} aria-haspopup="dialog">{t("Show more details")}</button>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 border-t border-line pt-3">
        <button className={inCompare ? "btn-primary btn-sm" : "btn-ghost btn-sm"} onClick={() => onToggle("compare", item.key)}>{t(inCompare ? "In compare" : "Add to compare")}</button>
      </div>
    </article>
    {detailsOpen && <UniversityDetailsDialog item={item} level={level} onClose={closeDetails} />}
    </>
  );
}
