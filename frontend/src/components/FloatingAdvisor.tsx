import { useEffect, useRef, useState } from "react";
import { AdvisorChat } from "@/components/AdvisorChat";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";

export function FloatingAdvisor() {
  const { j } = useJourney();
  const { t } = usePrefs();
  const [open, setOpen] = useState(false);
  const [dock, setDock] = useState<"right" | "left" | "hidden">("right");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    let frame = 0;
    const checkPlacement = () => {
      const root = rootRef.current;
      const launcher = root?.querySelector<HTMLButtonElement>("[data-kip-launcher]");
      if (!root || !launcher) return;
      const current = launcher.getBoundingClientRect();
      const obstacles = Array.from(document.querySelectorAll<HTMLElement>(
        "main :is(button, a, input, select, textarea), main .page-actions, header nav :is(button, a), [data-kip-avoid]",
      )).filter(element => !root.contains(element) && element.getClientRects().length > 0);
      const overlaps = (left: number) => obstacles.some(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0
          && left < rect.right + 8 && left + current.width > rect.left - 8
          && current.top < rect.bottom + 8 && current.bottom > rect.top - 8;
      });
      const right = Math.max(16, window.innerWidth - current.width - 16);
      const left = 16;
      const next = !overlaps(right) ? "right" : !overlaps(left) ? "left" : "hidden";
      setDock(previous => previous === next ? previous : next);
      if (next === "hidden" && open) setOpen(false);
    };
    const scheduleCheck = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(checkPlacement);
    };
    const observer = new MutationObserver(scheduleCheck);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", scheduleCheck, { passive: true, capture: true });
    window.addEventListener("resize", scheduleCheck);
    scheduleCheck();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleCheck, true);
      window.removeEventListener("resize", scheduleCheck);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`fixed bottom-4 z-40 flex flex-col sm:bottom-6 ${dock === "left" ? "left-4 items-start sm:left-6" : "right-4 items-end sm:right-6"}`}>
      <section id="kip-advisor-panel" role="dialog" aria-labelledby="kip-advisor-title" aria-modal="false" className={`${open ? "mb-3 flex" : "hidden"} max-h-[min(72dvh,40rem)] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-y-auto rounded-2xl border border-line bg-card shadow-2xl`}>
        <div className="hero-gradient flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mascot text-sm font-extrabold text-brand-deep">K</span>
            <div className="min-w-0">
              <h2 id="kip-advisor-title" className="truncate text-sm font-bold !text-white">{t("Kip AI Advisor")}</h2>
              <p className="text-[11px] leading-4 text-white/80">{t("Career and university guidance")}</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg text-white hover:bg-white/15" aria-label={t("Close chat")}>×</button>
        </div>
        <div className="min-h-0 overflow-y-auto p-2 sm:p-3">
          <AdvisorChat
            title="AI career coach"
            subtitle="Ask about careers, majors, or university options."
            endpoint="/ai/career"
            payload={{ answers: j.answers, level: j.level ?? "g12" }}
            suggestions={["What careers match my interests?", "How should I choose a university major?"]}
          />
        </div>
      </section>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="kip-advisor-panel"
        aria-label={t("Chat with Kip")}
        onClick={() => setOpen(value => !value)}
        data-kip-launcher
        aria-hidden={dock === "hidden"}
        tabIndex={dock === "hidden" ? -1 : 0}
        disabled={dock === "hidden"}
        className={`hero-gradient group flex h-11 items-center gap-2 rounded-full border-2 border-white px-3 text-white shadow-xl transition hover:scale-[1.03] hover:shadow-2xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 sm:h-12 sm:px-4 ${dock === "hidden" ? "invisible pointer-events-none" : ""}`}
        title={t("Chat with Kip AI Advisor")}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mascot text-xs font-extrabold text-brand-deep shadow-sm">K</span>
        <span className="hidden text-left text-xs font-bold leading-none sm:block">{t("Chat with Kip")}</span>
        <span aria-hidden="true" className="ml-0.5 text-sm text-lime transition group-hover:rotate-12">✦</span>
      </button>
    </div>
  );
}
