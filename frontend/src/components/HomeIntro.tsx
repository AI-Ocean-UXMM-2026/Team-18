import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { usePrefs } from "@/lib/prefs";

const INTRO_SEEN_KEY = "careernest_home_intro_seen";

export default function HomeIntro() {
  const [location] = useLocation();
  const isHomePage = location === "/" || location === "/student";
  const { t } = usePrefs();
  const [showIntro, setShowIntro] = useState(() => {
    try { return !sessionStorage.getItem(INTRO_SEEN_KEY); }
    catch { return true; }
  });
  const introRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const playbackPosition = useRef(0);
  const closeIntro = () => setShowIntro(false);

  useEffect(() => {
    if (!showIntro || !isHomePage) return;
    try { sessionStorage.setItem(INTRO_SEEN_KEY, "1"); } catch { /* Session storage may be disabled. */ }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    introRef.current?.focus();
    const video = videoRef.current;
    let disposed = false;
    const startPlayback = async () => {
      if (!video || disposed) return;
      try { await video.play(); }
      catch {
        if (disposed) return;
        video.muted = true;
        try { await video.play(); } catch { /* Retry on the first user interaction. */ }
      }
    };
    const enableSound = () => {
      if (!video || disposed) return;
      video.muted = false;
      void startPlayback();
    };
    void startPlayback();
    document.addEventListener("pointerdown", enableSound, { once: true });
    document.addEventListener("keydown", enableSound, { once: true });
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
    return () => {
      disposed = true;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", enableSound);
      document.removeEventListener("keydown", enableSound);
    };
  }, [showIntro, isHomePage]);

  if (!showIntro || !isHomePage) return null;
  return (
    <section ref={introRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t("CareerNest introduction video")} className="fixed inset-0 z-[100] grid h-dvh w-full place-items-center overflow-y-auto bg-black/60 p-4 outline-none sm:p-8">
      <div className="relative w-full max-w-[min(28rem,92dvh)] overflow-hidden rounded-xl">
        <video ref={videoRef} tabIndex={-1} className="pointer-events-none block h-auto w-full" src="/careernest-welcome-intro.mp4" autoPlay playsInline disablePictureInPicture disableRemotePlayback preload="auto"
          onContextMenu={event => event.preventDefault()}
          onTimeUpdate={event => { if (!event.currentTarget.seeking) playbackPosition.current = event.currentTarget.currentTime; }}
          onSeeking={event => { if (Math.abs(event.currentTarget.currentTime - playbackPosition.current) > 0.1) event.currentTarget.currentTime = playbackPosition.current; }}
          onRateChange={event => { if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1; }}
          onEnded={closeIntro} onError={() => setShowIntro(false)} aria-label={t("CareerNest introduction video")} />
        <button ref={closeButtonRef} type="button" onClick={closeIntro} aria-label={t("Close introduction")} className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center border-0 bg-transparent text-3xl text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:opacity-60 sm:right-3 sm:top-3"><span aria-hidden="true">×</span></button>
      </div>
    </section>
  );
}
