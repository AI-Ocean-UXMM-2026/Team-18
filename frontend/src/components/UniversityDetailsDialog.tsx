import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { UniItem } from "@/lib/api";
import { itemName } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return <div className="grid gap-1 border-b border-line/70 py-2 last:border-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4"><dt className="font-semibold text-ink">{label}</dt><dd className="min-w-0 whitespace-pre-wrap break-words text-muted">{value}</dd></div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-2"><h3 className="text-base font-semibold">{title}</h3><dl>{children}</dl></section>;
}

export default function UniversityDetailsDialog({ item, level, onClose }: { item: UniItem; level: string; onClose: () => void }) {
  const { t } = usePrefs();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const name = itemName(item);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], [tabindex='0']") ?? []);
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, [onClose]);

  const status = (value: string) => ({ yes: t("Yes"), no: t("No"), confirm: t("Confirm") }[value] ?? value);
  const picture = item.kind === "g12" ? item.university.photo : item.school.photo;
  const location = item.kind === "g12" ? item.university.location : `${item.school.city}, ${item.school.country}`;
  const type = item.kind === "g12" ? item.university.type : item.school.type;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-5" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="university-details-title" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-brand">{t("University details")}</p><h2 id="university-details-title" className="mt-1 text-lg sm:text-xl">{name}</h2><p className="mt-1 text-sm text-muted">{location} · {type}</p></div>
          <button ref={closeRef} type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-2xl text-muted hover:bg-soft hover:text-ink" aria-label={t("Close")} onClick={onClose}>×</button>
        </header>
        <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-4 text-sm sm:p-6" tabIndex={0}>
          {picture ? <img src={picture} alt={`${name} campus`} className="max-h-64 w-full rounded-xl object-cover" /> : <div className="grid h-32 place-items-center rounded-xl bg-gradient-to-br from-brand-soft to-soft text-3xl font-semibold text-brand">{item.kind === "g12" ? item.university.code : item.school.code}</div>}
          {item.kind === "g12" ? <>
            <p className="leading-6">{item.university.description}</p>
            <Section title={t("University information")}>
              <Detail label={t("Location")} value={item.university.location} />
              <Detail label={t("Type")} value={item.university.type} />
              <Detail label={t("Established")} value={String(item.university.established)} />
            </Section>
            <Section title={t("Programmes in your field")}><Detail label={t("Programmes")} value={item.programs.join(", ")} /></Section>
            <Section title={t("Admission")}><Detail label={t("Admission process")} value={item.university.admission} /></Section>
            {item.university.website && <p><a className="font-semibold text-brand hover:underline" href={item.university.website} target="_blank" rel="noreferrer">{t("Visit university website")}</a></p>}
          </> : <>
            <p className="leading-6">{item.school.description}</p>
            <Section title={t("University information")}>
              <Detail label={t("Location")} value={location} />
              <Detail label={t("Type")} value={item.school.type} />
              <Detail label={t("Study mode")} value={item.school.mode} />
              <Detail label={t("Established")} value={item.school.established} />
              <Detail label={t("Degree / partner")} value={item.school.partner} />
            </Section>
            <Section title={t("Programmes")}><Detail label={t("Available programmes")} value={item.school.programs.join(", ")} /></Section>
            <Section title={t("Admissions")}>
              <Detail label={`${t("GED")} · ${t("Entry")}`} value={`${status(item.school.ged.ok)}${item.school.ged.note ? ` — ${item.school.ged.note}` : ""}`} />
              <Detail label={t("GED tests")} value={item.school.ged.tests} />
              <Detail label={`${t("IGCSE")} · ${t("Entry")}`} value={`${status(item.school.igcse.ok)}${item.school.igcse.note ? ` — ${item.school.igcse.note}` : ""}`} />
              <Detail label={t("English requirement")} value={item.school.english} />
              <Detail label={t("Admission process")} value={item.school.admission} />
            </Section>
            <Section title={t("Study options")}>
              <Detail label={t("Pathway")} value={item.school.pathway} />
              <Detail label={t("Duration")} value={item.school.duration} />
              <Detail label={t("Intakes")} value={item.school.intakes} />
            </Section>
            <Section title={t("Scholarship")}><Detail label={t("Scholarship status")} value={`${item.school.hasScholarship ? t("Available") : t("Not available")}${item.school.scholarship ? ` — ${item.school.scholarship}` : ""}`} /></Section>
            <Section title={t("Sources")}><Detail label={t("Last checked")} value={item.school.lastChecked} /></Section>
            {item.school.source && <p><a className="font-semibold text-brand hover:underline" href={item.school.source} target="_blank" rel="noreferrer">{t("Open source")}</a></p>}
            {item.school.website && <p><a className="font-semibold text-brand hover:underline" href={item.school.website} target="_blank" rel="noreferrer">{t("Visit university website")}</a></p>}
          </>}
          {level === "ged" || level === "igcse" ? <p className="rounded-lg bg-soft p-3 text-xs leading-5 text-muted">{t("Confirm current entry requirements directly with the university before applying.")}</p> : null}
        </div>
        <footer className="flex shrink-0 justify-end border-t border-line p-3 sm:px-6"><button type="button" className="btn-outline w-full sm:w-auto" onClick={onClose}>{t("Close")}</button></footer>
      </section>
    </div>, document.body,
  );
}
