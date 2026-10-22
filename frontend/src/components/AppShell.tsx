// Shared shell: creative student workspace, portal navigation and settings.
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";

const STUDENT_STEPS: [RegExp, number][] = [[/^\/student(\/(start|quiz|results|movies|career|majors))?$/, 1], [/^\/student\/(explorer|compare)/, 2], [/^\/student\/mentors/, 3]];
const STEPS = ["Career & major", "University / College", "Mentor (optional)"];
const STUDENT_NAV = [
  ["/student", "Home / Dashboard", "⌂"],
  ["/student/quiz", "Career quiz", "?"],
  ["/student/results", "Career results", "✦"],
  ["/student/career", "Choose a career", "↗"],
  ["/student/majors", "Majors", "▤"],
  ["/student/explorer", "University explorer", "⌕"],
  ["/student/compare", "Compare universities", "⇄"],
  ["/student/movies", "Career videos (optional)", "▷"],
  ["/student/mentors", "Meet a mentor · Pro", "◷"],
  ["/student/plan", "My plan", "✓"],
] as const;
const NAV: Record<string, [string, string][]> = {
  mentor: [["/mentor", "Dashboard"], ["/mentor/requests", "Requests"], ["/mentor/availability", "Availability"], ["/mentor/sessions", "Sessions"], ["/mentor/profile", "Profile"]],
  admin: [["/admin", "Dashboard"], ["/admin/payments", "Payments"], ["/admin/payment-accounts", "Payment accounts"], ["/admin/mentors", "Mentors"], ["/admin/students", "Students"], ["/admin/universities", "Universities"], ["/admin/content", "Content"], ["/admin/admins", "Admins"]],
};
const ADMIN_ALLOWED: Record<string, string[]> = {
  super: NAV.admin.map(n => n[0]),
  ops: ["/admin", "/admin/payments", "/admin/mentors", "/admin/students"],
  content: ["/admin", "/admin/universities", "/admin/content"],
};
export const adminCan = (adminRole: string | null | undefined, path: string) => !!adminRole && (ADMIN_ALLOWED[adminRole] ?? []).includes(path);

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isGuest, logout } = useAuth();
  const { j } = useJourney();
  const { lang, setLang, theme, setTheme, t } = usePrefs();
  const [navOpen, setNavOpen] = useState(false);
  const step = user?.role === "student" || isGuest ? STUDENT_STEPS.find(([re]) => re.test(location))?.[1] ?? 0 : 0;
  const nav = user && user.role !== "student" ? NAV[user.role].filter(([p]) => user.role !== "admin" || adminCan(user.adminRole, p)) : [];
  const studentWorkspace = location.startsWith("/student/") || location === "/student";
  const answered = Object.keys(j.answers).length;
  const quizDone = answered >= 20;
  const progress = Math.min(100, Math.round((answered / 20) * 100));

  useEffect(() => { setNavOpen(false); }, [location]);
  useEffect(() => {
    if (!navOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setNavOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [navOpen]);

  const studentNav = (mobile = false) => <>
    <div className="flex items-center justify-between px-4 pb-3 pt-4 lg:px-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{t("Your pathway")}</p>
      {mobile && <button type="button" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-soft" onClick={() => setNavOpen(false)} aria-label={t("Close navigation")}>×</button>}
    </div>
    <nav aria-label={t("Student pathway")} className="flex flex-col gap-1 px-2">
      {STUDENT_NAV.map(([path, label, glyph], index) => {
        const active = path === "/student" ? location === path : location === path || location.startsWith(`${path}/`);
        const badge = path === "/student/quiz" ? (quizDone ? "Done" : answered ? "In progress" : null)
          : path === "/student/results" || path === "/student/career" ? (quizDone ? "Ready" : "Locked")
          : path === "/student/compare" && j.compare.length ? `${j.compare.length} selected`
          : path === "/student/mentors" ? "Pro" : null;
        const badgeTone = badge === "Done" || badge === "Ready" ? "bg-ok-soft text-ok" : badge === "In progress" ? "bg-warn-soft text-warn" : badge === "Locked" ? "border border-line bg-soft text-muted" : "bg-brand-soft text-brand";
        return <Link key={path} href={path} title={t(label)} aria-current={active ? "page" : undefined} className={`student-sidebar-link flex min-h-11 items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-sm font-semibold ${active ? "" : "text-ink hover:bg-soft"}`} onClick={() => mobile && setNavOpen(false)}>
          <span className="flex min-w-0 items-center gap-2.5"><span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-sm ${active ? "bg-brand text-white" : "bg-soft text-muted"}`}>{glyph}</span><span className="truncate">{t(label)}</span></span>
          {badge && <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeTone}`}>{t(badge)}</span>}
          {!badge && index === 0 && <span className="sr-only">{t("Current student portal")}</span>}
        </Link>;
      })}
    </nav>
    <div className="mt-auto p-3">
      <div className="rounded-xl border border-line bg-soft/60 p-3">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold"><span>{t("Quiz progress")}</span><span className="font-mono text-muted">{answered} / 20</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} /></div>
        <p className="mt-2 text-[11px] leading-4 text-muted">{t(answered ? "Your answers are ready when you are." : "Start with the career quiz when you are ready.")}</p>
      </div>
      {mobile && (isGuest || user) && <button className="btn-ghost mt-3 w-full" onClick={logout}>{t(isGuest ? "End guest session" : "Sign out")}</button>}
    </div>
  </>;

  const controls = <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
    {user?.role === "student" && <Link href="/student/pro" className={user.isPro ? "btn btn-sm border border-ok bg-ok-soft text-ok" : "btn-outline btn-sm"}>{user.isPro ? "Pro ✓" : t("Go Pro")}</Link>}
    {isGuest && <><Link href="/login" className="btn-ghost btn-sm">{t("Sign in")}</Link><Link href="/register" className="btn-outline btn-sm">{t("Create account")}</Link></>}
    {user && <span className="hidden h-8 w-8 place-items-center rounded-full bg-[#142B63] text-xs font-bold text-white sm:grid" title={user.name}>{user.name.trim().charAt(0).toUpperCase()}</span>}
    <div role="group" aria-label={t("Color theme")} className="flex items-center rounded-lg border border-line bg-soft p-0.5">
      <button type="button" onClick={() => setTheme("light")} aria-label={t("Light theme")} aria-pressed={theme === "light"} title={t("Light theme")} className={`grid h-8 w-8 place-items-center rounded-md text-sm transition ${theme === "light" ? "bg-card text-brand shadow-sm" : "text-muted hover:text-ink"}`}><span aria-hidden>☀</span></button>
      <button type="button" onClick={() => setTheme("dark")} aria-label={t("Dark theme")} aria-pressed={theme === "dark"} title={t("Dark theme")} className={`grid h-8 w-8 place-items-center rounded-md text-sm transition ${theme === "dark" ? "bg-card text-brand shadow-sm" : "text-muted hover:text-ink"}`}><span aria-hidden>☾</span></button>
    </div>
    <button className="btn-ghost btn-sm hidden sm:inline-flex" onClick={() => setLang(lang === "en" ? "my" : "en")} aria-label={t("Switch language")}>{lang === "en" ? "မြန်မာ" : "English"}</button>
    <button className="btn-ghost btn-sm sm:hidden" onClick={() => setLang(lang === "en" ? "my" : "en")} aria-label={t("Switch language")}>{lang === "en" ? "MY" : "EN"}</button>
    {isGuest && <button className="btn-ghost btn-sm hidden md:inline-flex" onClick={logout}>{t("End guest session")}</button>}
    {user && <button className="btn-ghost btn-sm hidden sm:inline-flex" onClick={logout}>{t("Sign out")}</button>}
  </div>;

  return (
    <div className="creative-shell min-h-dvh bg-bg">
      <header className="creative-header sticky top-0 z-30 bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          {studentWorkspace && <button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-line text-lg text-ink hover:bg-soft lg:hidden" onClick={() => setNavOpen(true)} aria-label={t("Open navigation")} aria-expanded={navOpen}>☰</button>}
          <Link href={user ? (user.role === "student" ? "/student" : `/${user.role}`) : isGuest ? "/student" : "/"} className="flex items-center gap-2.5 text-ink"><span className="creative-logo" aria-hidden="true">✦</span><span className="creative-brand">CareerNet<span className="text-brand">.</span></span></Link>
          {user && user.role !== "student" && <span className="hidden rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-muted sm:inline-flex">{t(user.role === "mentor" ? "Mentor portal" : "Admin portal")}</span>}
          {!user && !isGuest && <nav aria-label={t("Portals")} className="hidden items-center gap-1 sm:flex">
            {[ ["/login", "Student"], ["/mentor/login", "Mentor"], ["/admin/login", "Admin"] ].map(([href, label]) => <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-brand-soft hover:text-brand ${location === href ? "bg-brand-soft text-brand" : "text-muted"}`}>{t(label)}</Link>)}
          </nav>}
          {controls}
          {step > 0 && (
            <ol className="order-3 flex w-full flex-wrap gap-1 border-t border-line pt-2 lg:hidden">
              {STEPS.map((s, i) => <li key={s} className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] sm:text-xs ${step === i + 1 ? "bg-brand-soft font-semibold text-brand" : "text-muted"}`}><span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${step > i + 1 ? "bg-ok text-white" : step === i + 1 ? "bg-brand text-white" : "border border-line"}`}>{i + 1}</span>{t(s)}</li>)}
            </ol>
          )}
        </div>
        {nav.length > 0 && <nav aria-label={t("Portal navigation")} className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 sm:px-6">{nav.map(([p, l]) => <Link key={p} href={p} className={`tab ${location === p ? "tab-on" : ""}`}>{t(l)}</Link>)}</nav>}
      </header>

      {studentWorkspace ? <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1440px]">
        <aside className="creative-sidebar sticky top-[4.1rem] hidden h-[calc(100dvh-4.1rem)] w-64 shrink-0 flex-col overflow-y-auto border-r-2 border-line bg-card py-2 lg:flex">{studentNav()}</aside>
        {navOpen && <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <button type="button" className="absolute inset-0 bg-[#142B63]/40 backdrop-blur-[2px]" onClick={() => setNavOpen(false)} aria-label={t("Close navigation")} />
          <aside className="creative-sidebar relative z-10 flex h-full w-[min(19rem,85vw)] flex-col overflow-y-auto border-r-2 border-line bg-card py-2 shadow-2xl" aria-label={t("Student navigation")}>{studentNav(true)}</aside>
        </div>}
        <main className="mx-auto flex min-w-0 w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
          {isGuest && <div className="rounded-xl border border-info bg-info-soft px-4 py-3 text-sm">{t("Guest progress is temporary and won't be saved until you create an account.")} <Link href="/register" className="ml-1 font-semibold text-brand">{t("Create account to save your progress")}</Link></div>}
          {step > 0 && <ol className="hidden flex-wrap gap-2 lg:flex">{STEPS.map((s, i) => <li key={s} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${step === i + 1 ? "border-brand/30 bg-brand-soft font-semibold text-brand" : "border-line bg-card text-muted"}`}><span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${step > i + 1 ? "bg-ok text-white" : step === i + 1 ? "bg-brand text-white" : "border border-line"}`}>{step > i + 1 ? "✓" : i + 1}</span>{t(s)}</li>)}</ol>}
          {children}
        </main>
      </div> : <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-8">{children}</main>}
    </div>
  );
}
