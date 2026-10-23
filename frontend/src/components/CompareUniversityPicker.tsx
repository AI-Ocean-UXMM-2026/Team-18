import { useEffect, useRef, useState } from "react";
import { itemName, type UniItem } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";

export default function CompareUniversityPicker({ items, selected, onAdd, onClose }: { items: UniItem[]; selected: string[]; onAdd: (item: UniItem) => void; onClose: () => void }) {
  const { t } = usePrefs();
  const [search, setSearch] = useState("");
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLInputElement>("input")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input") ?? []);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previousFocus?.focus(); };
  }, [onClose]);
  const results = items.filter(item => {
    const location = item.kind === "g12" ? item.university.location : `${item.school.city} ${item.school.country}`;
    const programs = item.kind === "g12" ? item.programs : item.school.programs;
    return `${itemName(item)} ${location} ${programs.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase());
  });
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panel} role="dialog" aria-modal="true" aria-labelledby="add-university-title" className="flex max-h-[85dvh] w-full max-w-2xl flex-col gap-4 rounded-2xl border border-line bg-card p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-3"><h2 id="add-university-title" className="text-xl">{t("Add University")}</h2><button type="button" className="btn-ghost" onClick={onClose} aria-label={t("Close")}>×</button></div>
      <label className="label">{t("Search universities")}<input className="input" value={search} onChange={event => setSearch(event.target.value)} placeholder={t("University, country or programme")} /></label>
      <p role="status" className="text-sm text-muted">{selected.length} / 3 {t("selected to compare")}{selected.length >= 3 && ` · ${t("Remove a university from the comparison to add another.")}`}</p>
      <div className="min-h-0 space-y-2 overflow-y-auto overscroll-contain">
        {results.map(item => <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
          <div className="min-w-0"><h3 className="text-sm font-semibold">{itemName(item)}</h3><p className="mt-1 text-xs text-muted">{item.kind === "g12" ? item.university.location : `${item.school.city}, ${item.school.country}`}</p></div>
          <button type="button" className="btn-outline btn-sm shrink-0" disabled={selected.includes(item.key) || selected.length >= 3} onClick={() => onAdd(item)}>{t(selected.includes(item.key) ? "Added" : "Add to compare")}</button>
        </div>)}
        {!results.length && <p className="p-4 text-sm text-muted">{t("No universities match your search.")}</p>}
      </div>
      <button type="button" className="btn-primary self-end" onClick={onClose}>{t("Done")}</button>
    </section>
  </div>;
}
