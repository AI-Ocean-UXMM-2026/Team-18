import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { homeFor, useAuth } from "@/lib/auth";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { Skeleton } from "@/components/ui";

const pathway = [
  { number: "01", title: "Career quiz", detail: "Answer 20 questions about your strengths and interests.", icon: "✦" },
  { number: "02", title: "Career matches", detail: "Review your top matches and choose a direction to explore.", icon: "◎" },
  { number: "03", title: "Majors and schools", detail: "Find related majors, explore universities, and compare your options.", icon: "⌂" },
  { number: "04", title: "Your next steps", detail: "Build your plan, then add a mentor session with Pro if you want.", icon: "↗" },
];

export default function Landing() {
  const { t } = usePrefs();
  const { user, isGuest, startGuest } = useAuth();
  const { content, contentLoading } = useJourney();
  const [, go] = useLocation();
  const careers = (content?.careers ?? []).slice(0, 3);
  const [selectedCareer, setSelectedCareer] = useState("");
  if (user) return <Redirect to={homeFor(user.role)} />;
  if (isGuest) return <Redirect to="/student" />;
  const activeCareer = careers.find(career => career.id === selectedCareer) ?? careers[0];
  const startGuestJourney = () => { startGuest(); go("/student"); };

  return (
    <div className="-mt-2 flex flex-col gap-16 pb-4 sm:gap-20">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#10183f] px-6 py-10 text-white shadow-xl shadow-indigo-950/10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div className="pointer-events-none absolute -right-24 -top-28 -z-10 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="flex flex-col items-start gap-5">
            <p className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-100">{t("CareerNet · guided student pathway")}</p>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">{t("Find a career path you will actually love.")}</h1>
            <p className="max-w-xl text-base leading-7 text-indigo-100 sm:text-lg">{t("Take the career quiz, discover your top matches, then explore majors and universities that fit your education level.")}</p>
            <div className="flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row">
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#2639ad] shadow-lg shadow-black/10 transition hover:bg-indigo-50" onClick={startGuestJourney}>{t("Start the career quiz")} <span aria-hidden>→</span></button>
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">{t("Create a free account")}</Link>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs font-semibold text-indigo-100 sm:text-sm">
              <span>✓ {t("Grade 12, GED and IGCSE")}</span><span>✓ {t("20-question assessment")}</span><span>✓ {t("Start as a guest")}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-3 rotate-3 rounded-[2rem] border border-white/10 bg-white/5" />
            <div className="relative rounded-[1.6rem] border border-white/15 bg-white p-5 text-ink shadow-2xl shadow-black/20 sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
                <div><p className="eyebrow">{t("Your pathway")}</p><h2 className="mt-1 text-xl">{t("A clear next step")}</h2></div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl text-white" aria-hidden>✦</div>
              </div>
              <div className="relative mt-5 flex flex-col gap-3 before:absolute before:bottom-7 before:left-[19px] before:top-7 before:w-px before:bg-line">
                {pathway.map((item, index) => <div key={item.number} className={`relative flex gap-3 rounded-2xl p-3 ${index === 0 ? "bg-brand-soft" : ""}`}>
                  <span className={`z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${index === 0 ? "bg-brand text-white" : "border border-line bg-card text-brand"}`}>{item.icon}</span>
                  <div className="min-w-0 pt-0.5"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{t(item.title)}</h3><span className="font-mono text-[10px] text-muted">{item.number}</span></div><p className="mt-0.5 text-xs leading-5 text-muted">{t(item.detail)}</p></div>
                </div>)}
              </div>
              <button onClick={startGuestJourney} className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#10183f] px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-brand"><span>{t("Build my career plan")}</span><span aria-hidden>→</span></button>
            </div>
          </div>
        </div>
      </section>

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
              <button className="btn-primary self-start" onClick={startGuestJourney}>{t("Check my fit with the quiz")} <span aria-hidden>→</span></button>
            </div>
          </div>}
        </div> : <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-card p-6 text-center text-sm text-muted">{t("Start the quiz to explore career paths matched to you.")}</div>}
      </section>

      <section id="journey" className="scroll-mt-24 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-9">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl"><p className="eyebrow">{t("The CareerNet pathway")}</p><h2 className="mt-2 text-3xl sm:text-4xl">{t("From self-discovery to a plan you can act on")}</h2></div>
          <p className="max-w-sm text-sm leading-6 text-muted">{t("Move through each step at your own pace. Your account keeps your progress ready for next time.")}</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pathway.map((item, index) => <article key={item.number} className="group rounded-2xl border border-line bg-bg/70 p-5 transition hover:-translate-y-1 hover:border-brand/40 hover:bg-white hover:shadow-md">
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

      <section className="flex flex-col items-center justify-between gap-5 rounded-3xl bg-brand-soft px-6 py-8 text-center sm:flex-row sm:px-9 sm:text-left">
        <div><p className="eyebrow">{t("Start at your own pace")}</p><h2 className="mt-2 text-2xl">{t("Your next step starts with one question")}</h2></div>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-end"><button className="btn-primary" onClick={startGuestJourney}>{t("Continue as guest")}</button><Link href="/register" className="btn-ghost">{t("Create a free account")}</Link><Link href="/login" className="btn-ghost">{t("Sign in")}</Link></div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-line pt-5 text-sm text-muted sm:flex-row">
        <span>CareerNet · {t("Career guidance for students in Myanmar")}</span>
        <div className="flex flex-wrap justify-center gap-4"><Link href="/mentor/login" className="hover:text-brand">{t("Mentor sign in")}</Link><Link href="/mentor/apply" className="hover:text-brand">{t("Apply to become a mentor")}</Link><Link href="/admin/login" className="hover:text-brand">{t("Admin sign in")}</Link></div>
      </footer>
    </div>
  );
}
