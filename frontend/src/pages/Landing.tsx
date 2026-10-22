import { Link, Redirect, useLocation } from "wouter";
import { homeFor, useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { FutureSketch } from "@/components/FutureSketch";

export default function Landing() {
  const { t } = usePrefs();
  const { user, isGuest, startGuest } = useAuth();
  const [, go] = useLocation();
  if (user) return <Redirect to={homeFor(user.role)} />;
  if (isGuest) return <Redirect to="/student" />;
  const startGuestJourney = () => { startGuest(); go("/student"); };

  return (
    <div className="-mt-2 flex flex-col gap-8 pb-4">
      <section className="creative-hero px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <span className="pointer-events-none absolute right-6 top-2 text-7xl text-brand/20" aria-hidden="true">✳</span>
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="flex flex-col items-start gap-5">
            <p className="creative-sticker creative-sticker-pink">✦ {t("CareerNet · guided student pathway")}</p>
            <h1 className="creative-display max-w-2xl">{t("Your future.")}<br /><span className="creative-highlight">{t("Make it yours.")}</span></h1>
            <p className="max-w-xl text-base leading-7 text-muted sm:text-lg">{t("Take the career quiz, discover your top matches, then explore majors and universities that fit your education level.")}</p>
            <div className="flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row">
              <button className="btn-primary min-h-12 px-5" onClick={startGuestJourney}>{t("Start the career quiz")} <span aria-hidden>↗</span></button>
              <Link href="/register" className="btn-outline min-h-12 px-5">{t("Create a free account")}</Link>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs font-semibold text-muted sm:text-sm">
              <span>✓ {t("Grade 12, GED and IGCSE")}</span><span>✓ {t("Career interest assessment")}</span><span>✓ {t("Start as a guest")}</span>
            </div>
          </div>

          <div className="hidden md:block"><FutureSketch /></div>
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-line pt-5 text-sm text-muted sm:flex-row">
        <span>CareerNet · {t("Career guidance for students in Myanmar")}</span>
        <div className="flex flex-wrap justify-center gap-4"><Link href="/guide" className="hover:text-brand">{t("Guide")}</Link><Link href="/mentor/login" className="hover:text-brand">{t("Mentor sign in")}</Link><Link href="/mentor/apply" className="hover:text-brand">{t("Apply to become a mentor")}</Link><Link href="/admin/login" className="hover:text-brand">{t("Admin sign in")}</Link></div>
      </footer>
    </div>
  );
}
