import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import AuthLayout from "@/components/AuthLayout";

export default function Register() {
  const { register } = useAuth(); const { t } = usePrefs(); const [, go] = useLocation();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!f.name.trim()) return setError(t("Enter your name."));
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError(t("Enter a valid email address."));
    if (f.password.length < 8) return setError(t("Password needs at least 8 characters."));
    setBusy(true);
    try { await register(f.name.trim(), f.email.trim(), f.password); go("/student"); } catch (err) { setError(err instanceof Error ? err.message : "Could not create the account."); } finally { setBusy(false); }
  }
  const field = (k: keyof typeof f, label: string, type = "text", ac = "") => <label className="label">{t(label)}<input className="input" type={type} autoComplete={ac} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>;
  return (
    <AuthLayout>
    <section className="card mx-auto flex w-full max-w-md flex-col gap-4 lg:max-w-none">
      <p className="eyebrow">CareerNest</p><h1 className="text-2xl">{t("Create your account")}</h1>
      <p className="text-sm text-muted">{t("Save your results and come back any time, on any device.")}</p>
      <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
        {field("name", "Name", "text", "name")}{field("email", "Email", "email", "email")}{field("password", "Password", "password", "new-password")}
        {error && <p className="text-sm font-semibold text-bad">{error}</p>}
        <button className="btn-primary" disabled={busy}>{t("Create account")}</button>
      </form>
      <p className="text-center text-sm">{t("I already have an account")} · <Link href="/login" className="font-semibold text-brand">{t("Sign in")}</Link></p>
    </section>
    </AuthLayout>
  );
}
