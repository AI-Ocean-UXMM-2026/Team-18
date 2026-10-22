import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { homeFor, useAuth } from "@/lib/auth";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { PageHead, Skeleton, Spinner } from "@/components/ui";

const pathway = [
  { number: "01", title: "Career quiz", detail: "Answer questions about your strengths and interests.", icon: "✦" },
  { number: "02", title: "Career matches", detail: "Review your top matches and choose a direction to explore.", icon: "◎" },
  { number: "03", title: "Majors and schools", detail: "Find related majors, explore universities, and compare your options.", icon: "⌂" },
  { number: "04", title: "Your next steps", detail: "Build your plan, then add a mentor session with Pro if you want.", icon: "↗" },
];

export default function Guide() {
  const { t } = usePrefs();
  const { user, loading, isGuest, startGuest } = useAuth();
  const { content, contentLoading } = useJourney();
  const [, go] = useLocation();
  const careers = (content?.careers ?? []).slice(0, 3);
  const [selectedCareer, setSelectedCareer] = useState("");
  if (loading) return <Spinner />;
  if (user && user.role !== "student") return <Redirect to={homeFor(user.role)} />;
  const activeCareer = careers.find(career => career.id === selectedCareer) ?? careers[0];
  const home = user ? homeFor(user.role) : isGuest ? "/student" : "/";
  const startGuestJourney = () => {
    if (user) { go(homeFor(user.role)); return; }
    if (!isGuest) startGuest();
    go("/student");
  };
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <PageHead back={home} eyebrow="Guide" title="How to use CareerNest" />
      <section id="career-preview" className="scroll-mt-24">
        <div className="mx-auto mb-7 max-w-2xl text-center">
          <p className="eyebrow">{t("Explore your options")}</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">{t("Careers begin with understanding your strengths")}</h2>
          <p className="mt-3 text-muted">{t("Preview a few career paths. Your quiz results are matched to your answers.")}</p>
        </div>
        {contentLoading ? <div className="mx-auto max-w-5xl" role="status" aria-label={t("Loading career examples")}>
          <div className="flex justify-center gap-2"><Skeleton className="h-9 w-28 rounded-full" /><Skeleton className="h-9 w-32 rounded-full" /><Skeleton className="h-9 w-24 rounded-full" /></div>
          <div className="mt-4 grid overflow-hidden rounded-3xl border border-line bg-card shadow-sm md:grid-cols-[0.8fr_1.2fr]">
            <div className="bg-gradient-to-br from-brand to-[#18215a] p-6 sm:p-8"><Skeleton className="h-3 w-28 bg-white/20" /><Skeleton className="mt-4 h-8 w-3/4 bg-white/20" /><Skeleton className="mt-4 h-3 w-full bg-white/20" /><Skeleton className="mt-2 h-3 w-4/5 bg-white/20" /><Skeleton className="mt-8 h-3 w-1/2 bg-white/20" /></div>
            <div className="p-6 sm:p-8"><Skeleton className="h-3 w-32" /><Skeleton className="mt-3 h-5 w-4/5" /><Skeleton className="mt-7 h-3 w-36" /><Skeleton className="mt-3 h-5 w-2/3" /><Skeleton className="mt-7 h-11 w-44 rounded-xl" /></div>
          </div>
          <span className="sr-only">{t("Loading career examples")}</span>
        </div> : careers.length > 0 ? <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label={t("Career examples")}>
            {careers.map(career => <button key={career.id} role="tab" aria-selected={activeCareer?.id === career.id} onClick={() => setSelectedCareer(career.id)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeCareer?.id === career.id ? "border-brand bg-brand text-white" : "border-line bg-card text-muted hover:border-brand hover:text-brand"}`}>{t(career.t)}</button>)}
          </div>
          {activeCareer && <div className="mt-4 grid overflow-hidden rounded-3xl border border-line bg-card shadow-sm md:grid-cols-[0.8fr_1.2fr]">
            <div className="flex min-h-56 flex-col justify-between bg-gradient-to-br from-brand to-[#18215a] p-6 text-white sm:p-8">
              <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-100">{t("Career preview")}</p><h3 className="mt-3 text-3xl font-bold">{t(activeCareer.t)}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-indigo-100">{t(activeCareer.blurb)}</p></div>
              <p className="mt-6 text-xs font-semibold text-indigo-100">{t("Career outlook")}: {t(activeCareer.demand)}</p>
            </div>
            <div className="flex flex-col justify-center gap-5 p-6 sm:p-8">
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">{t("Related majors")}</p><p className="mt-1 font-semibold">{activeCareer.majors.slice(0, 3).map(major => t(major.n)).join(" · ") || "–"}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted">{t("Useful school subjects")}</p><p className="mt-1 text-sm text-muted">{activeCareer.subjects.slice(0, 4).map(subject => t(subject)).join(" · ") || "–"}</p></div>
            </div>
          </div>}
        </div> : <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-card p-6 text-center text-sm text-muted">{t("Start the quiz to explore career paths matched to you.")}</div>}
      </section>

      <section id="journey" className="scroll-mt-24 rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-9">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl"><p className="eyebrow">{t("The CareerNest pathway")}</p><h2 className="mt-2 text-3xl sm:text-4xl">{t("From self-discovery to a plan you can act on")}</h2></div>
          <p className="max-w-sm text-sm leading-6 text-muted">{t("Move through each step at your own pace. Your account keeps your progress ready for next time.")}</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pathway.map((item, index) => <article key={item.number} className="group rounded-2xl border border-line bg-bg/70 p-5 transition hover:-translate-y-1 hover:border-brand/40 hover:bg-card hover:shadow-md">
            <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-xl font-bold text-brand">{item.icon}</span><span className="font-mono text-sm font-bold text-brand">{item.number}</span></div>
            <h3 className="mt-5 text-lg">{t(item.title)}</h3><p className="mt-2 text-sm leading-6 text-muted">{t(item.detail)}</p>
            {index === 2 && <p className="mt-4 border-t border-line pt-3 text-xs font-semibold text-brand">{t("GED and IGCSE school data included")}</p>}
          </article>)}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-line bg-card p-5"><span className="text-xl text-brand" aria-hidden>✦</span><h3 className="mt-3 text-lg">{t("AI guidance when you need it")}</h3><p className="mt-2 text-sm leading-6 text-muted">{t("Sign in for the free AI allowance. Pro includes unlimited AI guidance about your career matches and university options.")}</p></article>
        <article className="rounded-2xl border border-line bg-card p-5"><span className="text-xl text-brand" aria-hidden>▤</span><h3 className="mt-3 text-lg">{t("Compare your university options")}</h3><p className="mt-2 text-sm leading-6 text-muted">{t("Explore schools and programs that relate to your education level and chosen major.")}</p></article>
        <article className="rounded-2xl border border-line bg-card p-5"><span className="text-xl text-brand" aria-hidden>◷</span><h3 className="mt-3 text-lg">{t("Optional mentor sessions")}</h3><p className="mt-2 text-sm leading-6 text-muted">{t("Pro members can request a one-hour session with a professional mentor.")}</p></article>
      </section>

      <div className="flex justify-end"><button className="btn-primary" onClick={startGuestJourney}>{t(user || isGuest ? "Continue" : "Start the career quiz")} <span aria-hidden="true">↗</span></button></div>
    </div>
  );
}
