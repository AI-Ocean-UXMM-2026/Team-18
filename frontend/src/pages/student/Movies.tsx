// Short movies (about 3 minutes each). Watch, or skip by choosing your career below.
import { Link } from "wouter";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { useScore } from "@/lib/top3";
import { Actions, PageHead, Spinner } from "@/components/ui";

export default function Movies() {
  const { j, set } = useJourney(); const { t } = usePrefs();
  const { data, loading } = useScore(j);
  if (loading || !data) return <Spinner />;
  return (
    <>
      <PageHead back="/student/results" eyebrow="Step 1 · Short movies (optional)" title="See the real job before you choose">{t("About 3 minutes each: professionals show their real work, roles and daily life.")}</PageHead>
      <div className="grid gap-3">
        <button className={`choice ${j.videoChoice === "watch" ? "choice-on" : ""}`} onClick={() => set({ videoChoice: "watch" })}><b>{t("Watch short movies")}</b><small className="text-muted">{t("3 movies, about 3 minutes each. Or skip and choose your career below.")}</small></button>
      </div>
      {j.videoChoice === "watch" && (
        <div className="grid gap-4 md:grid-cols-3">
          {data.top.map(({ career: c }) => (
            <article key={c.id} className="card flex flex-col gap-3">
              <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand to-ink text-white">
                <b className="absolute left-3 top-2">{c.t}</b>
                {c.video.url ? <video src={c.video.url} controls preload="metadata" playsInline onEnded={() => set(p => ({ watched: { ...p.watched, [c.id]: true } }))} className="absolute inset-0 h-full w-full rounded-xl bg-black object-contain" aria-label={`${c.t} career video`} />
                  : <span className="rounded-lg bg-black/40 px-3 py-1 text-sm">{t("Video coming soon")}</span>}
                <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 font-mono text-xs">{c.video.len}</span>
              </div>
              <ol className="list-decimal pl-5 text-sm text-muted">{c.video.ch.map(x => <li key={x}>{x}</li>)}</ol>
              <span className={`text-sm ${j.watched[c.id] ? "font-semibold text-ok" : "text-muted"}`}>{t(j.watched[c.id] ? "Watched" : "Not watched yet")}</span>
            </article>
          ))}
        </div>
      )}
      <Actions><Link href="/student/career" className="btn-primary">{t("Choose my career")}</Link></Actions>
    </>
  );
}
