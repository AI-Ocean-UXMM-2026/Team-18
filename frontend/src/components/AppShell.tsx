// Header: logo, portal-specific navigation, Go Pro (students), language, sign out.
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";

const STUDENT_STEPS: [RegExp, number][] = [[/^\/student(\/(start|quiz|results|movies|career|majors))?$/, 1], [/^\/student\/(explorer|compare)/, 2], [/^\/student\/mentors/, 3]];
const STEPS = ["Career & major", "University / College", "Mentor (optional)"];
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
  const { lang, setLang, theme, setTheme, t } = usePrefs();
  const step = user?.role === "student" ? STUDENT_STEPS.find(([re]) => re.test(location))?.[1] ?? 0 : 0;
  const nav = user && user.role !== "student" ? NAV[user.role].filter(([p]) => user.role !== "admin" || adminCan(user.adminRole, p)) : [];
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href={user ? (user.role === "student" ? "/student" : `/${user.role}`) : isGuest ? "/student" : "/"} className="flex items-center gap-2 font-bold"><img src="/favicon.svg" alt="" className="h-7 w-7" />CareerNet</Link>
          {user && user.role !== "student" && <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-muted">{t(user.role === "mentor" ? "Mentor portal" : "Admin portal")}</span>}
          {!user && !isGuest && <nav aria-label={t("Portals")} className="hidden items-center gap-1 sm:flex">
            {[ ["/login", "Student"], ["/mentor/login", "Mentor"], ["/admin/login", "Admin"] ].map(([href, label]) => <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-brand-soft hover:text-brand ${location === href ? "bg-brand-soft text-brand" : "text-muted"}`}>{t(label)}</Link>)}
          </nav>}
          {step > 0 && (
            <ol className="order-3 flex w-full flex-wrap gap-1 md:order-none md:w-auto md:flex-1 md:justify-center">
              {STEPS.map((s, i) => <li key={s} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${step === i + 1 ? "bg-brand-soft font-semibold" : "text-muted"}`}><span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${step > i + 1 ? "bg-ok text-white" : step === i + 1 ? "bg-brand text-white" : "border border-line"}`}>{i + 1}</span>{t(s)}</li>)}
            </ol>
          )}
          <div className="ml-auto flex items-center gap-2">
            {user?.role === "student" && <Link href="/student/pro" className={user.isPro ? "btn btn-sm border border-ok bg-ok-soft text-ok" : "btn-outline btn-sm"}>{user.isPro ? "Pro ✓" : t("Go Pro")}</Link>}
            {isGuest && <><Link href="/login" className="btn-ghost btn-sm">{t("Sign in")}</Link><Link href="/register" className="btn-outline btn-sm">{t("Create account")}</Link><button className="btn-ghost btn-sm" onClick={logout}>{t("End guest session")}</button></>}
            <div role="group" aria-label={t("Color theme")} className="flex items-center rounded-lg border border-line bg-soft p-0.5">
              <button type="button" onClick={() => setTheme("light")} aria-label={t("Light theme")} aria-pressed={theme === "light"} title={t("Light theme")} className={`grid h-8 w-8 place-items-center rounded-md text-sm transition ${theme === "light" ? "bg-card text-brand shadow-sm" : "text-muted hover:text-ink"}`}><span aria-hidden>☀</span></button>
              <button type="button" onClick={() => setTheme("dark")} aria-label={t("Dark theme")} aria-pressed={theme === "dark"} title={t("Dark theme")} className={`grid h-8 w-8 place-items-center rounded-md text-sm transition ${theme === "dark" ? "bg-card text-brand shadow-sm" : "text-muted hover:text-ink"}`}><span aria-hidden>☾</span></button>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => setLang(lang === "en" ? "my" : "en")} aria-label="Switch language">{lang === "en" ? "မြန်မာ" : "English"}</button>
            {user && <button className="btn-ghost btn-sm" onClick={logout}>{t("Sign out")}</button>}
          </div>
        </div>
        {nav.length > 0 && (
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
            {nav.map(([p, l]) => <Link key={p} href={p} className={`tab ${location === p ? "tab-on" : ""}`}>{t(l)}</Link>)}
          </nav>
        )}
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-8">{isGuest && <div className="rounded-xl border border-info bg-info-soft px-4 py-3 text-sm">{t("Guest progress is temporary and won't be saved until you create an account.")} <Link href="/register" className="ml-1 font-semibold text-brand">{t("Create account to save your progress")}</Link></div>}{children}</main>
    </div>
  );
}
