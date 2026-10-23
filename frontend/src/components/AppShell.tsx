// Shared shell: creative student workspace, portal navigation and settings.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { JOURNEY_PATHS, studentProgress, studentRouteRedirect } from "@/lib/studentFlow";
import { FloatingAdvisor } from "@/components/FloatingAdvisor";
import BrandLogo from "@/components/BrandLogo";

const STUDENT_NAV = [
  ["/student", "Home / Dashboard", "⌂"],
  ["/student/quiz", "Career quiz", "?"],
  ["/student/results", "Career results", "✦"],
  ["/student/movies", "Career videos (optional)", "▷"],
  ["/student/career", "Choose a career", "↗"],
  ["/student/majors", "Majors", "▤"],
  ["/student/explorer", "University explorer", "⌕"],
  ["/student/compare", "Compare universities", "⇄"],
  ["/student/plan", "My plan", "✓"],
  ["/student/pro", "Upgrade to Pro", "✦"],
  ["/student/mentors", "Meet a mentor · Pro", "◷"],
  ["/student/profile", "Profile & settings", "⚙"],
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
  const { j, ready, content } = useJourney();
  const { lang, setLang, theme, setTheme, t } = usePrefs();
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navPanelRef = useRef<HTMLElement>(null);
  const nav = user && user.role !== "student" ? NAV[user.role].filter(([p]) => user.role !== "admin" || adminCan(user.adminRole, p)) : [];
  const studentWorkspace = location.startsWith("/student/") || location === "/student";
  const showGuide = (!user || user.role === "student") && !/^\/(admin|mentor)(\/|$)/.test(location);
  const flow = studentProgress(j, content);
  const { answered, quizDone } = flow;
  const progress = flow.total ? Math.round((answered / flow.total) * 100) : 0;

  useEffect(() => { setNavOpen(false); }, [location]);
  useEffect(() => {
    if (!navOpen) return;
    const panel = navPanelRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getFocusable = () => Array.from(panel?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), [tabindex]:not([tabindex='-1'])") ?? []);
    getFocusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setNavOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      menuButtonRef.current?.focus();
    };
  }, [navOpen]);

  const studentNav = () => <>
    <div className="flex items-center justify-between px-4 pb-3 pt-4 lg:px-3">
      <h2 id="student-navigation-title" className="text-[11px] font-bold uppercase tracking-wider text-muted">{t("Your pathway")}</h2>
      <button type="button" className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-soft" onClick={() => setNavOpen(false)} aria-label={t("Close navigation")}>×</button>
    </div>
    <nav aria-label={t("Student pathway")} className="flex flex-col gap-1 px-2">
      {STUDENT_NAV.map(([path, label, glyph], index) => {
        const active = path === "/student" ? location === path : location === path || location.startsWith(`${path}/`);
        const needsPro = path === "/student/mentors" && flow.comparisonDone && !user?.isPro;
        const itemLabel = path === "/student/pro" && user?.isPro ? "Pro plan" : label;
        const locked = JOURNEY_PATHS.includes(path) && (!ready || !content || !!studentRouteRedirect(path, flow, j.level, user?.isPro));
        const badge = path === "/student/pro" && user?.isPro ? "Active" : needsPro ? "Pro" : locked ? "Locked" : path === "/student/quiz" ? (quizDone ? "Done" : answered ? "In progress" : null)
          : path === "/student/results" || path === "/student/career" ? (quizDone ? "Ready" : "Locked")
          : path === "/student/compare" && j.compare.length ? `${j.compare.length} selected`
          : path === "/student/mentors" ? "Pro" : null;
        const badgeTone = badge === "Done" || badge === "Ready" || badge === "Active" ? "bg-ok-soft text-ok" : badge === "In progress" ? "bg-warn-soft text-warn" : badge === "Locked" ? "border border-line bg-soft text-muted" : "bg-brand-soft text-brand";
        const contents = <>
          <span className="flex min-w-0 items-center gap-2.5"><span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-sm ${active ? "bg-brand text-on-brand" : "bg-soft text-muted"}`}>{glyph}</span><span className="truncate">{t(itemLabel)}</span></span>
          {badge && <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeTone}`}>{t(badge)}</span>}
          {!badge && index === 0 && <span className="sr-only">{t("Current student portal")}</span>}
        </>;
        const className = `student-sidebar-link flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-sm font-semibold ${locked ? "cursor-not-allowed text-muted" : active ? "" : "text-ink hover:bg-soft"}`;
        return locked
          ? <button key={path} type="button" disabled aria-disabled="true" title={t(needsPro ? "Mentor sessions are part of CareerNest Pro." : "Complete the previous step to unlock.")} className={className}>{contents}</button>
          : <Link key={path} href={path} title={t(label)} aria-current={active ? "page" : undefined} className={className} onClick={() => setNavOpen(false)}>{contents}</Link>;
      })}
    </nav>
    <div className="mt-auto p-3">
      <div className="rounded-xl border border-line bg-soft/60 p-3">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold"><span>{t("Quiz progress")}</span><span className="font-mono text-muted">{answered} / {flow.total}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} /></div>
        <p className="mt-2 text-[11px] leading-4 text-muted">{t(answered ? "Your answers are ready when you are." : "Start with the career quiz when you are ready.")}</p>
      </div>
      {(isGuest || user) && <button className="btn-ghost mt-3 w-full" onClick={logout}>{t(isGuest ? "End guest session" : "Sign out")}</button>}
    </div>
  </>;

  const controls = <div className="app-header-controls ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
    {user?.role === "student" && <Link href={user.isPro ? "/student/profile" : "/student/pro"} aria-label={user.isPro ? t("Pro plan") : t("Upgrade to Pro")} className={user.isPro ? "btn btn-sm border border-ok bg-ok-soft text-ok" : "btn-primary btn-sm"}>{user.isPro ? "Pro ✓" : t("Upgrade to Pro")}</Link>}
    {isGuest && <><Link href="/login" className="btn-ghost btn-sm">{t("Sign in")}</Link><Link href="/register" className="btn-outline btn-sm">{t("Create account")}</Link></>}
    {user?.role === "student" && <Link href="/student/profile" className="grid h-11 w-11 place-items-center rounded-full bg-brand-deep text-xs font-bold text-white hover:ring-2 hover:ring-brand" title={t("Profile & settings")} aria-label={t("Profile & settings")}>{user.name.trim().charAt(0).toUpperCase()}</Link>}
    {user && user.role !== "student" && <span className="hidden h-8 w-8 place-items-center rounded-full bg-brand-deep text-xs font-bold text-white sm:grid" title={user.name}>{user.name.trim().charAt(0).toUpperCase()}</span>}
    <div role="group" aria-label={t("Color theme")} className="flex items-center rounded-lg border border-line bg-soft p-0.5">
      <button type="button" onClick={() => setTheme("light")} aria-label={t("Light theme")} aria-pressed={theme === "light"} title={t("Light theme")} className={`grid h-11 w-11 place-items-center rounded-md text-sm transition ${theme === "light" ? "bg-card text-brand shadow-sm" : "text-muted hover:text-ink"}`}><span aria-hidden>☀</span></button>
      <button type="button" onClick={() => setTheme("dark")} aria-label={t("Dark theme")} aria-pressed={theme === "dark"} title={t("Dark theme")} className={`grid h-11 w-11 place-items-center rounded-md text-sm transition ${theme === "dark" ? "bg-card text-brand shadow-sm" : "text-muted hover:text-ink"}`}><span aria-hidden>☾</span></button>
    </div>
    <button className="btn-ghost btn-sm hidden sm:inline-flex" onClick={() => setLang(lang === "en" ? "my" : "en")} aria-label={t(lang === "en" ? "Switch language to Myanmar" : "Switch language to English")}>{lang === "en" ? "မြန်မာ" : "English"}</button>
    <button className="btn-ghost btn-sm sm:hidden" onClick={() => setLang(lang === "en" ? "my" : "en")} aria-label={t(lang === "en" ? "Switch language to Myanmar" : "Switch language to English")}>{lang === "en" ? "MY" : "EN"}</button>
    {isGuest && <button className="btn-ghost btn-sm hidden md:inline-flex" onClick={logout}>{t("End guest session")}</button>}
    {user && <button className="btn-ghost btn-sm hidden sm:inline-flex" onClick={logout}>{t("Sign out")}</button>}
  </div>;

  return (
    <div className="creative-shell min-h-dvh bg-bg">
      <header className="creative-header bg-card">
        <div className="mx-auto flex min-w-0 max-w-[1440px] flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
          {studentWorkspace && <button ref={menuButtonRef} type="button" className="grid h-11 w-11 place-items-center rounded-lg border border-line text-lg text-ink hover:bg-soft" onClick={() => setNavOpen(true)} aria-label={t("Open navigation")} aria-haspopup="dialog" aria-expanded={navOpen} aria-controls="student-navigation">☰</button>}
          <Link href={user ? (user.role === "student" ? "/student" : `/${user.role}`) : isGuest ? "/student" : "/"} aria-label="CareerNest home"><BrandLogo /></Link>
          {studentWorkspace && <div role="status" className={`ml-auto hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold xl:inline-flex ${quizDone ? "border-ok/20 bg-ok-soft text-ok" : answered ? "border-warn/20 bg-warn-soft text-warn" : "border-line bg-soft text-muted"}`}><span className={`h-2 w-2 rounded-full ${quizDone ? "bg-ok" : answered ? "bg-warn" : "bg-muted"}`} aria-hidden="true" />{t(quizDone ? "Career results ready" : answered ? "Quiz in progress" : "Career quiz")}</div>}
          {user && user.role !== "student" && <span className="hidden rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-muted sm:inline-flex">{t(user.role === "mentor" ? "Mentor portal" : "Admin portal")}</span>}
          {!user && !isGuest && <nav aria-label={t("Portals")} className="hidden items-center gap-1 sm:flex">
            {[ ["/login", "Student"], ["/mentor/login", "Mentor"], ["/admin/login", "Admin"] ].map(([href, label]) => <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-brand-soft hover:text-brand ${location === href ? "bg-brand-soft text-brand" : "text-muted"}`}>{t(label)}</Link>)}
          </nav>}
          {showGuide && <Link href="/guide" aria-current={location === "/guide" ? "page" : undefined} className="btn-ghost btn-sm">{t("Guide")}</Link>}
          {controls}
        </div>
        {nav.length > 0 && <nav aria-label={t("Portal navigation")} className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 sm:px-6">{nav.map(([p, l]) => <Link key={p} href={p} aria-current={location === p ? "page" : undefined} className={`tab min-h-11 ${location === p ? "tab-on" : ""}`}>{t(l)}</Link>)}</nav>}
      </header>

      {studentWorkspace ? <div className="mx-auto flex min-h-[calc(100dvh-4rem)] min-w-0 max-w-[1440px]">
        {navOpen && <div className="fixed inset-0 z-40" role="presentation">
          <button type="button" className="absolute inset-0 bg-brand-deep/40 backdrop-blur-[2px]" onClick={() => setNavOpen(false)} aria-label={t("Close navigation")} />
          <aside ref={navPanelRef} id="student-navigation" role="dialog" aria-modal="true" aria-labelledby="student-navigation-title" className="creative-sidebar relative z-10 flex h-full w-[min(20rem,85vw)] flex-col overflow-y-auto border-r-2 border-line bg-card py-2 shadow-2xl" aria-label={t("Student navigation")}>{studentNav()}</aside>
        </div>}
        <main className="mx-auto flex min-w-0 w-full max-w-7xl flex-col gap-6 px-3 pb-16 pt-5 sm:gap-6 sm:px-6 sm:pt-8">
          {isGuest && <div className="rounded-xl border border-info bg-info-soft px-4 py-3 text-sm">{t("Guest progress is temporary and won't be saved until you create an account.")} <Link href="/register" className="ml-1 font-semibold text-brand">{t("Create account to save your progress")}</Link></div>}
          {children}
        </main>
      </div> : <main className="mx-auto flex min-w-0 w-full max-w-[1440px] flex-col gap-6 px-3 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">{children}</main>}
      {studentWorkspace && <FloatingAdvisor />}
    </div>
  );
}
