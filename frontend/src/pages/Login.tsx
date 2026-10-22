// One sign-in page per portal: /login, /mentor/login, /admin/login
import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import type { Role } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import AuthLayout from "@/components/AuthLayout";

const TITLES: Record<Role, string> = { student: "Student sign in", mentor: "Mentor sign in", admin: "Admin sign in" };
const DEMO_ACCOUNTS: Record<Role, { email: string; label: string }[]> = {
  student: [
    { email: "student@careernet.local", label: "Demo student · Normal (limited AI)" },
    { email: "pro@careernet.local", label: "Demo student · Pro (AI + PDF)" },
  ],
  mentor: [{ email: "hnin@mentor.careernet.local", label: "Demo mentor" }],
  admin: [{ email: "super@careernet.local", label: "Super admin" }],
};
export default function Login({ portal }: { portal: Role }) {
  const { user, login, startGuest } = useAuth(); const { t } = usePrefs(); const [, go] = useLocation();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  if (user) return <Redirect to={homeFor(user.role)} />;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try { const u = await login(portal, email, password); go(homeFor(u.role)); } catch (err) { setError(err instanceof Error ? err.message : "Could not sign in."); } finally { setBusy(false); }
  }
  return (
    <AuthLayout>
    <section className="card login-sheet mx-auto flex w-full max-w-md flex-col gap-5 lg:max-w-none">
      <p className="creative-sticker creative-sticker-pink">✦ CareerNest</p><h1 className="text-3xl">{t(TITLES[portal])}</h1>
      <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
        <label className="label">{t("Email")}<input className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="label">{t("Password")}<input className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <p className="text-sm font-semibold text-bad">{error}</p>}
        <button className="btn-primary" disabled={busy}>{t("Sign in")}</button>
      </form>
      <aside className="rounded-xl border border-line bg-soft p-3" aria-label="Demo accounts">
        <p className="text-sm font-semibold">Demo accounts <span className="font-normal text-muted">(for testing)</span></p>
        <p className="mt-1 text-xs text-muted">Password: <code>careernet123</code></p>
        <div className="mt-2 flex flex-col gap-1">
          {DEMO_ACCOUNTS[portal].map(account => <button key={account.email} type="button" className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-card" onClick={() => { setEmail(account.email); setPassword("careernet123"); setError(null); }}>
            <span className="min-w-0 flex-1">{account.label}</span><span className="shrink-0 text-xs font-semibold text-brand">Use account</span>
          </button>)}
        </div>
      </aside>
      {portal === "student" && <><p className="text-center text-sm">{t("New here?")} <Link href="/register" className="font-semibold text-brand">{t("Create an account")}</Link></p><button type="button" className="btn-outline" onClick={() => { startGuest(); go("/student"); }}>{t("Continue as guest")}</button></>}
      {portal === "mentor" && <p className="text-center text-sm"><Link href="/mentor/apply" className="font-semibold text-brand">{t("Apply to become a mentor")}</Link></p>}
      {portal === "admin" && <p className="text-center text-xs text-muted">{t("Admin accounts are created by the Super admin only.")}</p>}
    </section>
    </AuthLayout>
  );
}
