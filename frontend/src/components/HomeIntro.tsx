import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/lib/prefs";

export default function HomeIntro() {
  const { t } = usePrefs();
  const [showIntro, setShowIntro] = useState(true);
  const introRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackPosition = useRef(0);
  const [needsPlay, setNeedsPlay] = useState(false);
  const playIntro = () => { videoRef.current?.play().then(() => setNeedsPlay(false)).catch(() => setNeedsPlay(true)); };
  const closeIntro = () => setShowIntro(false);

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

  if (!showIntro) return null;
  return (
    <section ref={introRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t("CareerNest introduction video")} className="fixed inset-0 z-[100] h-dvh w-full overflow-hidden bg-black outline-none">
        <video ref={videoRef} tabIndex={-1} className="pointer-events-none absolute inset-0 h-full w-full object-cover" src="/careernest-home-intro.mp4" autoPlay muted playsInline disablePictureInPicture disableRemotePlayback preload="auto"
          onContextMenu={event => event.preventDefault()}
          onTimeUpdate={event => { if (!event.currentTarget.seeking) playbackPosition.current = event.currentTarget.currentTime; }}
          onSeeking={event => { if (Math.abs(event.currentTarget.currentTime - playbackPosition.current) > 0.1) event.currentTarget.currentTime = playbackPosition.current; }}
          onRateChange={event => { if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1; }}
          onPause={event => { if (!event.currentTarget.ended) setNeedsPlay(true); }}
          onPlaying={() => setNeedsPlay(false)}
          onEnded={closeIntro} onError={() => setShowIntro(false)} aria-label={t("CareerNest introduction video")} />
        {needsPlay && <div className="absolute inset-0 grid place-items-center bg-black/30"><button type="button" className="btn-primary" onClick={playIntro}>{t("Play introduction")}</button></div>}
      </section>
  );
}
