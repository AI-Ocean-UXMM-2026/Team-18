import type { UniItem } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";

export function UniPhoto({ item, small }: { item: UniItem; small?: boolean }) {
  const src = item.kind === "g12" ? item.university.photo : item.school.photo;
  const code = item.kind === "g12" ? item.university.code : item.school.code;
  const where = item.kind === "g12" ? item.university.location : `${item.school.city.split("·")[0].trim()}, ${item.school.country}`;
  const cls = small ? "mb-2 aspect-[2/1] w-full rounded-lg" : "aspect-[16/7] w-full rounded-lg";
  if (src) return <img src={src} alt={`${code} campus`} loading="lazy" className={`${cls} object-cover`} />;
  return <div className={`${cls} flex flex-col justify-end bg-gradient-to-br from-brand-soft to-soft p-4 text-brand`} aria-hidden="true"><b className="text-2xl">{code}</b><span className="text-xs text-muted">{where}</span></div>;
}

export function UniCard({ item, level, inShortlist, inCompare, onToggle }: { item: UniItem; level: string; inShortlist: boolean; inCompare: boolean; onToggle: (l: "shortlist" | "compare", k: string) => void }) {
  const { t } = usePrefs();
  return (
    <article className="card choice-card-hover grid grid-rows-subgrid [grid-row:span_8] overflow-hidden">
      <UniPhoto item={item} />
      <div className="flex min-h-14 items-start gap-3">
        <span className="rounded-md bg-soft px-2 py-1 font-mono text-xs text-brand">{item.kind === "g12" ? item.university.code : item.school.code}</span>
        <div className="min-w-0 flex-1"><h3 className="text-base">{item.kind === "g12" ? item.university.name : item.school.name}</h3>
          <p className="text-xs text-muted">{item.kind === "g12" ? `${item.university.location} · ${item.university.type}` : `${item.school.city}, ${item.school.country} · ${item.school.type}`}</p></div>
      </div>
      <p className="min-h-[4.5rem] text-sm leading-6">{item.kind === "g12" ? item.university.description : item.school.description}</p>
      {item.kind === "g12" ? (
        <div className="text-sm">
          <p className="font-semibold">{t("Programmes in your field")}:</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">{item.programs.slice(0, 6).map(p => <span key={p} className="rounded-full bg-soft px-2.5 py-0.5 text-xs">{p}</span>)}{item.programs.length > 6 && <span className="text-xs text-muted">+{item.programs.length - 6}</span>}</div>
        </div>
      ) : (
        <p className={`min-h-40 rounded-lg px-3 py-2 text-sm leading-6 ${item.school.hasScholarship ? "bg-ok-soft" : "bg-soft text-muted"}`}><b>{t("Scholarship")}:</b> {item.school.scholarship}</p>
      )}
      {item.kind === "g12" ? <div aria-hidden="true" /> : <p className="min-h-12 text-sm leading-6"><b>{t("Pathway")}:</b> {item.school.pathway}</p>}
      {item.kind === "g12" ? <div aria-hidden="true" /> : <p className="min-h-[4.5rem] text-sm leading-6"><b>{t("Entry")}:</b> {level === "igcse" ? item.school.igcse.note : item.school.ged.note}</p>}
      {item.kind === "g12" ? <div aria-hidden="true" /> : <a className="text-xs text-brand" href={item.school.source} target="_blank" rel="noreferrer">{t("source")} · {item.school.lastChecked}</a>}
      <div className="flex items-end gap-2">
        <button className={inShortlist ? "btn-primary btn-sm" : "btn-outline btn-sm"} onClick={() => onToggle("shortlist", item.key)}>{t(inShortlist ? "Shortlisted" : "Shortlist")}</button>
        <button className={inCompare ? "btn-primary btn-sm" : "btn-ghost btn-sm"} onClick={() => onToggle("compare", item.key)}>{t(inCompare ? "In compare" : "Add to compare")}</button>
      </div>
    </article>
  );
}
