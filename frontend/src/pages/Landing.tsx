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
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackPosition = useRef(0);
  const [needsPlay, setNeedsPlay] = useState(false);
  const playIntro = () => { videoRef.current?.play().then(() => setNeedsPlay(false)).catch(() => setNeedsPlay(true)); };
  const startGuestJourney = () => { startGuest(); go("/student"); };
  const closeIntro = () => {
    try { window.localStorage.setItem("careernest-home-intro-seen-v3", "true"); } catch { /* completion still works when storage is unavailable */ }
    setShowIntro(false);
  };

  useEffect(() => {
    try {
      if (window.localStorage.getItem("careernest-home-intro-seen-v3") === "true") return;
    } catch { /* show the introduction if storage is unavailable */ }
    setShowIntro(true);
  }, []);

  useEffect(() => {
    if (!showIntro) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    introRef.current?.focus();
    playIntro();
    const focusable = () => Array.from(introRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), video[controls], a[href], [tabindex]:not([tabindex='-1'])") ?? []);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); return; }
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
      {showIntro && <section ref={introRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t("CareerNest introduction video")} className="fixed inset-0 z-[100] h-dvh w-full overflow-hidden bg-black outline-none">
        <video ref={videoRef} tabIndex={-1} className="pointer-events-none absolute inset-0 h-full w-full object-cover" src="/careernest-home-intro.mp4" autoPlay muted playsInline disablePictureInPicture disableRemotePlayback preload="auto"
          onContextMenu={event => event.preventDefault()}
          onTimeUpdate={event => { if (!event.currentTarget.seeking) playbackPosition.current = event.currentTarget.currentTime; }}
          onSeeking={event => { if (Math.abs(event.currentTarget.currentTime - playbackPosition.current) > 0.1) event.currentTarget.currentTime = playbackPosition.current; }}
          onRateChange={event => { if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1; }}
          onPause={event => { if (!event.currentTarget.ended) setNeedsPlay(true); }}
          onPlaying={() => setNeedsPlay(false)}
          onEnded={closeIntro} onError={() => setShowIntro(false)} aria-label={t("CareerNest introduction video")} />
        {needsPlay && <div className="absolute inset-0 grid place-items-center bg-black/30"><button type="button" className="btn-primary" onClick={playIntro}>{t("Play introduction")}</button></div>}
      </section>}
    </div>
  );
}
