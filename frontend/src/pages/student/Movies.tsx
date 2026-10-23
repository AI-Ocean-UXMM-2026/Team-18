// Short movies (about 3 minutes each). Watch, or skip by choosing your career below.
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { useScore } from "@/lib/top3";
import { Actions, PageHead, Spinner } from "@/components/ui";

export default function Movies() {
  const { j, set } = useJourney(); const { t } = usePrefs();
  const { data, loading } = useScore(j);
  const [selected, setSelected] = useState(0);
  const [unplayableVideo, setUnplayableVideo] = useState<string | null>(null);
  const [showChoice, setShowChoice] = useState(true);
  const [, go] = useLocation();
  const choiceRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!showChoice || loading || !data) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const buttons = () => Array.from(choiceRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    buttons()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); go("/student/results"); return; }
      if (event.key !== "Tab") return;
      const items = buttons(); const first = items[0]; const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !choiceRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !choiceRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, [showChoice, loading, data, go]);
  useEffect(() => {
    if (!data || !j.careerId) return;
    const index = data.top.findIndex(match => match.career.id === j.careerId);
    if (index >= 0) setSelected(index);
  }, [data, j.careerId]);
  if (loading || !data) return <Spinner />;
  const current = data.top[selected]?.career ?? data.top[0].career;
  return (
    <>
      <PageHead back="/student/results" eyebrow="Step 1 · Short movies (optional)" title="See the real job before you choose">{t("About 3 minutes each: professionals show their real work, roles and daily life.")}</PageHead>
      {showChoice && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
        <section ref={choiceRef} role="dialog" aria-modal="true" aria-labelledby="video-choice-title" aria-describedby="video-choice-description" className="relative my-auto w-full max-w-lg rounded-2xl border border-line bg-card p-5 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="video-choice-title" className="text-xl">{t("Watch career videos? (Optional)")}</h2>
            <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-2xl text-muted hover:bg-soft hover:text-ink" onClick={() => go("/student/results")} aria-label={t("Close")}>×</button>
          </div>
          <div id="video-choice-description" className="my-4 rounded-xl border border-line bg-soft p-4">
            <h3 className="font-semibold">{t("Day-in-the-life career videos")}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{t("Watch short career spotlights, or skip straight to choosing a career.")}</p>
          </div>
          <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-3">
            <button type="button" className="btn-outline h-full min-h-16 min-w-0 w-full whitespace-normal px-3 py-3 text-center" onClick={() => { set({ videoChoice: "skip" }); go(j.careerId ? "/student/majors" : "/student/career"); }}>{t(j.careerId ? "Skip videos & explore majors" : "Skip videos & choose my career")}</button>
            <button type="button" className="btn-primary h-full min-h-16 min-w-0 w-full whitespace-normal px-3 py-3 text-center" onClick={() => { set({ videoChoice: "watch" }); setShowChoice(false); }}>{t("Yes — watch career videos")}</button>
          </div>
        </section>
      </div>}
      {(showChoice || j.videoChoice === "watch") && <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <article className="overflow-hidden rounded-xl border border-line bg-card">
            <div className="relative grid h-[min(45dvh,22rem)] min-h-0 min-w-0 place-items-center overflow-hidden bg-brand-deep text-white">
              {current.video.url ? unplayableVideo === current.id ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center" role="alert">
                  <p className="text-sm">{t("This video could not play on this device. Try opening it in a new tab.")}</p>
                  <a className="btn-outline bg-card text-ink" href={current.video.url} target="_blank" rel="noreferrer">{t("Open video in a new tab")}</a>
                </div>
              ) : <video key={current.id} src={current.video.url} controls preload="metadata" playsInline webkit-playsinline="true" onError={() => setUnplayableVideo(current.id)} onCanPlay={() => setUnplayableVideo(null)} onEnded={() => set(p => ({ watched: { ...p.watched, [current.id]: true } }))} className="absolute inset-0 h-full w-full object-contain" aria-label={`${current.t} career video`} /> : <div className="text-center"><span className="mb-3 block text-4xl" aria-hidden="true">▷</span><p>{t("Video coming soon")}</p></div>}
            </div>
            <div className="p-5"><span className="text-xs font-semibold text-brand">{t("Career spotlight")} · {current.video.len}</span><h2 className="mt-2 text-xl">{current.t}</h2><p className="mt-2 text-sm text-muted">{current.blurb}</p></div>
          </article>
          <section className="card"><h3 className="mb-3 text-lg">{t("What you will discover")}</h3><ul className="space-y-3">{current.video.ch.map(x => <li key={x} className="flex gap-3 text-sm"><span className="text-brand">✓</span>{x}</li>)}</ul></section>
        </div>
        <aside className="card"><h2 className="mb-4 text-lg">{t("Your career playlist")}</h2><div className="flex flex-col gap-3">{data.top.map(({career:c}, index) => <button key={c.id} aria-pressed={selected === index} className={`flex items-center gap-3 rounded-lg border p-3 text-left ${selected === index ? "border-brand bg-brand-soft" : "border-line"}`} onClick={() => setSelected(index)}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-soft text-xl text-brand">▷</span><span><b className="block text-sm">{c.t}</b><small className="text-muted">{c.video.len} · {t(j.watched[c.id] ? "Watched" : "Not watched yet")}</small></span></button>)}</div><p className="mt-5 text-xs leading-5 text-muted">{t("Watching is optional. Continue whenever you are ready to choose your career.")}</p></aside>
      </div>}
      {j.videoChoice === "watch" && <Actions><Link href={j.careerId ? "/student/majors" : "/student/career"} className="btn-primary">{t(j.careerId ? "See majors for this career" : "Choose my career")}</Link></Actions>}
    </>
  );
}
