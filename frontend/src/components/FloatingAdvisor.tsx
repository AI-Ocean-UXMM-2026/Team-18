import { Kip } from "@/components/Kip";
import { useEffect, useRef, useState } from "react";
import { AdvisorChat } from "@/components/AdvisorChat";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";

export function FloatingAdvisor() {
  const { j } = useJourney();
  const { user, isGuest } = useAuth();
  const { t } = usePrefs();
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = false;
  }, [open]);

  return (
    <div className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] right-[max(0.5rem,env(safe-area-inset-right))] z-40 flex flex-col items-end sm:bottom-6 sm:right-6">
      <section id="kip-advisor-panel" role="dialog" aria-labelledby="kip-advisor-title" aria-describedby="kip-advisor-description" aria-modal="false" className={`${open ? "mb-2 flex sm:mb-3" : "hidden"} h-[min(75dvh,40rem)] max-h-[calc(100dvh_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom)_-_1rem)] w-[min(25rem,calc(100vw-1rem))] min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl sm:w-[min(25rem,calc(100vw-2rem))]`}>
        <div className="hero-gradient flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15" aria-hidden="true"><Kip size={48} mood="thinking" /></span>
            <div className="min-w-0">
              <h2 id="kip-advisor-title" className="truncate text-sm font-bold !text-white">{t("Kip AI Advisor")}</h2>
              <p id="kip-advisor-description" className="text-[11px] leading-4 text-white/80">{t("Career and university guidance")}</p>
            </div>
          </div>
          <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-xl text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={t("Close chat")} title={t("Close chat")}>×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
          {user?.role === "student" || isGuest ? <AdvisorChat
            fillPanel
            title="AI career coach"
            subtitle="Ask about careers, majors, or university options."
            endpoint="/ai/career"
            payload={{ answers: j.answers, level: j.level ?? "g12" }}
            suggestions={["What careers match my interests?", "How should I choose a university major?"]}
          /> : <section className="card ai-surface flex flex-col gap-3">
            <h2 className="ai-heading text-lg">✦ {t("Kip AI Advisor")}</h2>
            <p className="text-sm text-muted">{t("Sign in to the student portal to chat with Kip about careers and universities.")}</p>
            <Link href="/login" className="btn-primary btn-sm self-start">{t("Student sign in")}</Link>
          </section>}
        </div>
      </section>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="kip-advisor-panel"
        aria-label={t("Chat with Kip")}
        onClick={() => setOpen(value => !value)}
        data-kip-launcher
        ref={launcherRef}
        className="hero-gradient group flex h-11 items-center gap-2 rounded-full border-2 border-white px-3 text-white shadow-xl transition hover:scale-[1.03] hover:shadow-2xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 sm:h-12 sm:px-4"
        title={t("Chat with Kip AI Advisor")}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15" aria-hidden="true"><Kip size={40} mood="waving" /></span>
        <span className="hidden text-left text-xs font-bold leading-none sm:block">{t("Chat with Kip")}</span>
        <span aria-hidden="true" className="ml-0.5 text-sm text-lime transition group-hover:rotate-12">✦</span>
      </button>
    </div>
  );
}
