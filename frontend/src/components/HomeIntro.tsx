import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/lib/prefs";

export default function HomeIntro() {
  const { t } = usePrefs();
  const [showIntro, setShowIntro] = useState(true);
  const introRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const playbackPosition = useRef(0);
  const [needsPlay, setNeedsPlay] = useState(false);
  const playIntro = () => { videoRef.current?.play().then(() => setNeedsPlay(false)).catch(() => setNeedsPlay(true)); };
  const closeIntro = () => setShowIntro(false);

  useEffect(() => {
    if (!showIntro) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    playIntro();
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

  if (!showIntro) return null;
  return (
    <section ref={introRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t("CareerNest introduction video")} className="fixed inset-0 z-[100] grid h-dvh w-full place-items-center overflow-y-auto bg-black/60 p-4 outline-none sm:p-8">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-white/20 bg-black shadow-2xl">
        <video ref={videoRef} tabIndex={-1} className="pointer-events-none block aspect-video max-h-[80dvh] w-full object-contain" src="/careernest-home-intro.mp4" autoPlay muted playsInline disablePictureInPicture disableRemotePlayback preload="auto"
          onContextMenu={event => event.preventDefault()}
          onTimeUpdate={event => { if (!event.currentTarget.seeking) playbackPosition.current = event.currentTarget.currentTime; }}
          onSeeking={event => { if (Math.abs(event.currentTarget.currentTime - playbackPosition.current) > 0.1) event.currentTarget.currentTime = playbackPosition.current; }}
          onRateChange={event => { if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1; }}
          onPause={event => { if (!event.currentTarget.ended) setNeedsPlay(true); }}
          onPlaying={() => setNeedsPlay(false)}
          onEnded={closeIntro} onError={() => setShowIntro(false)} aria-label={t("CareerNest introduction video")} />
        {needsPlay && <div className="absolute inset-0 grid place-items-center bg-black/30"><button type="button" className="btn-primary" onClick={playIntro}>{t("Play introduction")}</button></div>}
        <button ref={closeButtonRef} type="button" onClick={closeIntro} aria-label={t("Close introduction")} className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center border-0 bg-transparent text-3xl text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-3 sm:top-3"><span aria-hidden="true">×</span></button>
      </div>
    </section>
  );
}
