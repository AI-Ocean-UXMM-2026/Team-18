// Short movies (about 3 minutes each). Watch, or skip by choosing your career below.
import { useState } from "react";
import { Link } from "wouter";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { useScore } from "@/lib/top3";
import { Actions, PageHead, Spinner } from "@/components/ui";

export default function Movies() {
  const { j, set } = useJourney(); const { t } = usePrefs();
  const { data, loading } = useScore(j);
  const [selected, setSelected] = useState(0);
  const [unplayableVideo, setUnplayableVideo] = useState<string | null>(null);
  if (loading || !data) return <Spinner />;
  const current = data.top[selected]?.career ?? data.top[0].career;
  return (
    <>
      <PageHead back="/student/results" eyebrow="Step 1 · Short movies (optional)" title="See the real job before you choose">{t("About 3 minutes each: professionals show their real work, roles and daily life.")}</PageHead>
      <section className="card">
        <h2 className="text-lg">{t("Career videos are optional")}</h2>
        <p className="mt-1 mb-4 text-sm text-muted">{t("Watch short career spotlights, or skip straight to choosing a career.")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" aria-pressed={j.videoChoice === "watch"} className={`choice ${j.videoChoice === "watch" ? "choice-on" : ""}`} onClick={() => set({ videoChoice: "watch" })}>
            <b>{t("Yes — watch career videos")}</b><small className="text-muted">{t("Watch short videos about your top career matches.")}</small>
          </button>
          <Link href="/student/career" className={`choice ${j.videoChoice === "skip" ? "choice-on" : ""}`} onClick={() => set({ videoChoice: "skip" })}>
            <b>{t("Skip videos & choose my career")}</b><small className="text-muted">{t("Go directly to choosing your career.")}</small>
          </Link>
        </div>
      </section>
      {j.videoChoice === "watch" && <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <article className="overflow-hidden rounded-xl border border-line bg-card">
            <div className="relative grid aspect-video place-items-center bg-brand-deep text-white">
              {current.video.url ? unplayableVideo === current.id ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center" role="alert">
                  <p className="text-sm">{t("This video could not play on this device. Try opening it in a new tab.")}</p>
                  <a className="btn-outline bg-card text-ink" href={current.video.url} target="_blank" rel="noreferrer">{t("Open video in a new tab")}</a>
                </div>
              ) : <video key={current.id} src={current.video.url} controls preload="metadata" playsInline webkit-playsinline="true" onError={() => setUnplayableVideo(current.id)} onCanPlay={() => setUnplayableVideo(null)} onEnded={() => set(p => ({ watched: { ...p.watched, [current.id]: true } }))} className="h-full w-full object-contain" aria-label={`${current.t} career video`} /> : <div className="text-center"><span className="mb-3 block text-4xl" aria-hidden="true">▷</span><p>{t("Video coming soon")}</p></div>}
            </div>
            <div className="p-5"><span className="text-xs font-semibold text-brand">{t("Career spotlight")} · {current.video.len}</span><h2 className="mt-2 text-xl">{current.t}</h2><p className="mt-2 text-sm text-muted">{current.blurb}</p></div>
          </article>
          <section className="card"><h3 className="mb-3 text-lg">{t("What you will discover")}</h3><ul className="space-y-3">{current.video.ch.map(x => <li key={x} className="flex gap-3 text-sm"><span className="text-brand">✓</span>{x}</li>)}</ul></section>
        </div>
        <aside className="card"><h2 className="mb-4 text-lg">{t("Your career playlist")}</h2><div className="flex flex-col gap-3">{data.top.map(({career:c}, index) => <button key={c.id} aria-pressed={selected === index} className={`flex items-center gap-3 rounded-lg border p-3 text-left ${selected === index ? "border-brand bg-brand-soft" : "border-line"}`} onClick={() => setSelected(index)}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-soft text-xl text-brand">▷</span><span><b className="block text-sm">{c.t}</b><small className="text-muted">{c.video.len} · {t(j.watched[c.id] ? "Watched" : "Not watched yet")}</small></span></button>)}</div><p className="mt-5 text-xs leading-5 text-muted">{t("Watching is optional. Continue whenever you are ready to choose your career.")}</p></aside>
      </div>}
      {j.videoChoice === "watch" && <Actions><Link href="/student/career" className="btn-primary">{t("Choose my career")}</Link></Actions>}
    </>
  );
}
