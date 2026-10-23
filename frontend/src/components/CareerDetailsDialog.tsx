import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Top } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";

export default function CareerDetailsDialog({ match, onClose, onSelect }: { match: Top; onClose: () => void; onSelect: () => void }) {
  const { t } = usePrefs();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { career, pct } = match;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("button, a[href], [tabindex='0']") ?? []);
      const first = items[0]; const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="career-details-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <h2 id="career-details-title" className="pt-2 text-xl">{career.t}</h2>
          <button ref={closeRef} type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-2xl text-muted hover:bg-soft hover:text-ink" aria-label={t("Close")} onClick={onClose}>×</button>
        </header>
        <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-5 text-sm sm:p-6" tabIndex={0}>
          <div className="flex flex-wrap gap-2"><span className="rounded-full bg-brand-soft px-3 py-1 font-semibold text-brand">{pct}% {t("match")}</span><span className="rounded-full bg-ok-soft px-3 py-1 font-semibold text-ok">{t("Job demand")}: {t(career.demand)}</span></div>
          <p className="leading-6">{career.blurb}</p>
          {career.video.ch.length > 0 && <section><h3 className="mb-2 font-semibold">{t("What you will discover")}</h3><ul className="list-disc space-y-1 pl-5 text-muted">{career.video.ch.map(task => <li key={task}>{task}</li>)}</ul></section>}
          <section className="rounded-xl border border-line bg-brand-soft p-4"><h3 className="mb-2 font-semibold">{t("Relevant school subjects")}</h3><p className="leading-6">{career.subjects.join(" · ")}</p></section>
          <section><h3 className="mb-2 font-semibold">{t("Recommended university majors")}</h3><div className="flex flex-wrap gap-2">{career.majors.map(major => <span key={major.n} className="rounded-lg bg-ok-soft px-3 py-1 font-semibold text-ok">{major.n}</span>)}</div></section>
          <section><h3 className="mb-2 font-semibold">{t("Example jobs")}</h3><p className="leading-6 text-muted">{career.positions.join(", ")}</p></section>
          <section><h3 className="mb-2 font-semibold">{t("Skills")}</h3><div className="flex flex-wrap gap-2">{career.skills.map(skill => <span key={skill} className="rounded bg-soft px-2 py-1">{skill}</span>)}</div></section>
          {career.quals.length > 0 && <section><h3 className="mb-2 font-semibold">{t("Qualifications")}</h3><ul className="list-disc space-y-1 pl-5 text-muted">{career.quals.map(qualification => <li key={qualification}>{qualification}</li>)}</ul></section>}
          {career.outlook && <section><h3 className="mb-2 font-semibold">{t("Career outlook")}</h3><p className="leading-6 text-muted">{career.outlook}</p></section>}
        </div>
        <footer className="flex shrink-0 justify-end border-t border-line p-4 sm:px-6"><button type="button" className="btn-primary w-full sm:w-auto" onClick={onSelect}>{t("Select career & continue")}</button></footer>
      </section>
    </div>, document.body,
  );
}
