import { useEffect, useRef, useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { homeFor, useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { KipGuide } from "@/components/Kip";

export default function Landing() {
  const { t } = usePrefs();
  const { user, isGuest, startGuest } = useAuth();
  const [, go] = useLocation();
  const [showIntro, setShowIntro] = useState(false);
  const introRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const startGuestJourney = () => { startGuest(); go("/student"); };
  const closeIntro = () => {
    try { window.localStorage.setItem("careernest-home-intro-seen-v1", "true"); } catch { /* intro can still be dismissed when storage is unavailable */ }
    setShowIntro(false);
  };

  useEffect(() => {
    try {
      if (window.localStorage.getItem("careernest-home-intro-seen-v1") === "true") return;
    } catch { /* show the introduction if storage is unavailable */ }
    setShowIntro(true);
  }, []);

  useEffect(() => {
    if (!showIntro) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const focusable = () => Array.from(introRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), video[controls], a[href], [tabindex]:not([tabindex='-1'])") ?? []);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeIntro(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0]; const last = items[items.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !introRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !introRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [showIntro]);

  if (user) return <Redirect to={homeFor(user.role)} />;
  if (isGuest) return <Redirect to="/student" />;

  return (
    <div className="-mt-2 flex flex-col gap-8 pb-4">
      <section className="creative-hero relative px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <span className="pointer-events-none absolute right-6 top-2 text-7xl text-brand/20" aria-hidden="true">✳</span>
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="flex flex-col items-start gap-5">
            <p className="creative-sticker px-3 py-1 text-xs">✦ {t("CareerNest · guided student pathway")}</p>
            <h1 className="creative-display max-w-2xl">{t("Your future.")}<br /><span className="text-hero-muted">{t("Make it yours.")}</span></h1>
            <p className="max-w-xl text-base leading-7 text-white/85 sm:text-lg">{t("Take the career quiz, discover your top matches, then explore majors and universities that fit your education level.")}</p>
            <div className="flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row">
              <button className="btn-primary" onClick={startGuestJourney}>{t("Start the career quiz")} <span aria-hidden>↗</span></button>
              <Link href="/register" className="btn-outline">{t("Create a free account")}</Link>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs font-semibold text-white/85 sm:text-sm">
              <span>✓ {t("Grade 12, GED and IGCSE")}</span><span>✓ {t("Career interest assessment")}</span><span>✓ {t("Start as a guest")}</span>
            </div>
          </div>

          <div className="block"><KipGuide /></div>
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-line pt-5 text-sm text-muted sm:flex-row">
        <span>CareerNest · {t("Career guidance for students in Myanmar")}</span>
        <div className="flex flex-wrap justify-center gap-4"><Link href="/guide" className="hover:text-brand">{t("Guide")}</Link><Link href="/mentor/login" className="hover:text-brand">{t("Mentor sign in")}</Link><Link href="/mentor/apply" className="hover:text-brand">{t("Apply to become a mentor")}</Link><Link href="/admin/login" className="hover:text-brand">{t("Admin sign in")}</Link></div>
      </footer>
      {showIntro && <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeIntro(); }}>
        <section ref={introRef} role="dialog" aria-modal="true" aria-labelledby="home-intro-title" aria-describedby="home-intro-description" className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
          <div className="flex items-start justify-between gap-4 p-4 sm:p-6">
            <div><p className="eyebrow">CareerNest</p><h2 id="home-intro-title" className="mt-1 text-xl font-bold sm:text-2xl">{t("A quick introduction to CareerNest")}</h2><p id="home-intro-description" className="mt-2 text-sm text-muted">{t("Watch this short welcome video to learn what you can do here.")}</p></div>
            <button ref={closeButtonRef} type="button" className="btn-ghost btn-sm shrink-0" onClick={closeIntro} aria-label={t("Close introduction")}>×</button>
          </div>
          <video className="block max-h-[65dvh] w-full bg-black object-contain" src="/careernest-home-intro.mp4" controls autoPlay muted playsInline preload="metadata" onEnded={closeIntro} aria-label={t("CareerNest introduction video")} />
          <div className="flex justify-end p-4 sm:p-6"><button type="button" className="btn-primary" onClick={closeIntro}>{t("Continue to CareerNest")}</button></div>
        </section>
      </div>}
    </div>
  );
}
