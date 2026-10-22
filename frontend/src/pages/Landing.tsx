import { Link, Redirect } from "wouter";
import { homeFor, useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";

export default function Landing() {
  const { t } = usePrefs(); const { user } = useAuth();
  if (user) return <Redirect to={homeFor(user.role)} />;
  const steps = [["Career & major", "15-min quiz · top 3 careers · 3-min short movies"], ["University / College", "Explore & compare · scholarships · AI advisor"], ["Mentor (optional)", "1-hour session with a professional"]];
  return (
    <>
      <section className="grid items-center gap-8 py-6 md:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">{t("For Grade 12 · GED · IGCSE students and graduates")}</p>
          <h1 className="text-4xl sm:text-5xl">{t("Find a career path you will actually love.")}</h1>
          <p className="text-lg text-muted">{t("Take a 15-minute quiz to find your top 3 careers, choose your major, compare universities and colleges, and meet a professional mentor if you want.")}</p>
          <div className="flex flex-wrap gap-3"><Link href="/register" className="btn-primary">{t("Start the journey, it's free")}</Link><Link href="/login" className="btn-ghost">{t("Sign in")}</Link></div>
          <p className="text-sm text-muted"><Link href="/mentor/login" className="text-brand">{t("Mentor sign in")}</Link> · <Link href="/mentor/apply" className="text-brand">{t("Apply to become a mentor")}</Link></p>
        </div>
        <div className="card flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">{t("Your 3-step journey")}</p>
          {steps.map(([title, sub], i) => <div key={title} className="flex items-start gap-3 rounded-xl bg-soft p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand font-bold text-white">{i + 1}</span><div><b>{t(title)}</b><p className="text-sm text-muted">{t(sub)}</p></div></div>)}
        </div>
      </section>
    </>
  );
}
