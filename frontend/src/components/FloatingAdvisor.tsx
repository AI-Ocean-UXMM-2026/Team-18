import { useEffect, useState } from "react";
import { AdvisorChat } from "@/components/AdvisorChat";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";

export function FloatingAdvisor() {
  const { j } = useJourney();
  const { t } = usePrefs();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end sm:bottom-6 sm:right-6">
      <section id="kip-advisor-panel" role="dialog" aria-labelledby="kip-advisor-title" aria-modal="false" className={`${open ? "mb-3 flex" : "hidden"} max-h-[min(72dvh,40rem)] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-y-auto rounded-2xl border border-line bg-card shadow-2xl`}>
        <div className="flex items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-[#142b63] to-[#1e5fbf] px-4 py-3 text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e65100] text-sm font-extrabold text-[#142b63]">K</span>
            <div className="min-w-0">
              <h2 id="kip-advisor-title" className="truncate text-sm font-bold !text-white">{t("Kip AI Advisor")}</h2>
              <p className="text-[11px] leading-4 text-blue-100">{t("Career and university guidance")}</p>
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
        className="group relative grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#142b63] to-[#1e5fbf] p-0 text-white shadow-xl transition hover:scale-[1.05] hover:shadow-2xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
        title={t("Chat with Kip AI Advisor")}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e65100] text-sm font-extrabold text-[#142b63] shadow-sm">K</span>
        <span aria-hidden="true" className="absolute right-1.5 top-1.5 text-xs text-[#ffd166] transition group-hover:rotate-12">✦</span>
      </button>
    </div>
  );
}
