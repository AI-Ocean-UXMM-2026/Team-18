// One sign-in page per portal: /login, /mentor/login, /admin/login
import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import type { Role } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";

const TITLES: Record<Role, string> = { student: "Student sign in", mentor: "Mentor sign in", admin: "Admin sign in" };
export default function Login({ portal }: { portal: Role }) {
  const { user, login } = useAuth(); const { t } = usePrefs(); const [, go] = useLocation();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  if (user) return <Redirect to={homeFor(user.role)} />;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try { const u = await login(portal, email, password); go(homeFor(u.role)); } catch (err) { setError(err instanceof Error ? err.message : "Could not sign in."); } finally { setBusy(false); }
  }
  return (
    <section className="card mx-auto flex w-full max-w-md flex-col gap-4">
      <p className="eyebrow">CareerNet</p><h1 className="text-2xl">{t(TITLES[portal])}</h1>
      <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
        <label className="label">{t("Email")}<input className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="label">{t("Password")}<input className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <p className="text-sm font-semibold text-bad">{error}</p>}
        <button className="btn-primary" disabled={busy}>{t("Sign in")}</button>
      </form>
      {portal === "student" && <p className="text-center text-sm">{t("New here?")} <Link href="/register" className="font-semibold text-brand">{t("Create an account")}</Link></p>}
      {portal === "mentor" && <p className="text-center text-sm"><Link href="/mentor/apply" className="font-semibold text-brand">{t("Apply to become a mentor")}</Link></p>}
      {portal === "admin" && <p className="text-center text-xs text-muted">{t("Admin accounts are created by the Super admin only.")}</p>}
    </section>
  );
}
