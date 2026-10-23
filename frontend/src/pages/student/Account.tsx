import PasswordInput from "@/components/PasswordInput";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ErrorNote, PageHead, Pill, Spinner, toast } from "@/components/ui";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";

type PlanInfo = { isPro: boolean; aiUsed: number; freeAiLimit: number };

export default function StudentAccount() {
  const { t, lang, setLang, theme, setTheme } = usePrefs();
  const { user, isGuest, refresh } = useAuth();
  const { data, loading, error, refresh: refreshPlan } = useApiData(() => user ? api.get<PlanInfo>("/pro") : Promise.resolve({ isPro: false, aiUsed: 0, freeAiLimit: 0 }), [user?.id]);
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => setName(user?.name ?? ""), [user?.name]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await api.put("/auth/profile", { name: name.trim() });
      await refresh();
      toast(t("Profile saved"));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("Could not save profile.")); }
    finally { setBusy(false); }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    if (newPassword !== confirmPassword) { setMessage(t("The new passwords do not match.")); setBusy(false); return; }
    try {
      await api.put("/auth/password", { current: currentPassword, next: newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      toast(t("Password changed"));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("Could not change password.")); }
    finally { setBusy(false); }
  }

  if (isGuest) return <>
    <PageHead eyebrow="Student account" title="Profile & settings" />
    <section className="card flex flex-col items-start gap-3">
      <p>{t("Create an account to see profile settings.")}</p>
      <Link href="/register" className="btn-primary">{t("Create an account")}</Link>
    </section>
  </>;
  if (!user) return <Spinner />;

  return <>
    <PageHead eyebrow="Student account" title="Profile & settings">{t("Manage your account and see which CareerNest features are available.")}</PageHead>

    <section className="card flex flex-wrap items-center justify-between gap-4 border-t-4 border-t-brand">
      <div>
        <p className="eyebrow">{t("Current plan")}</p>
        <h2 className="mt-2 text-2xl">{data?.isPro ?? user.isPro ? t("CareerNest Pro") : t("Normal account")}</h2>
        <p className="mt-1 text-sm text-muted">{data?.isPro ?? user.isPro ? t("Your Pro features are active.") : t("You are using the normal free account.")}</p>
      </div>
      {(data?.isPro ?? user.isPro)
        ? <Pill tone="ok">Pro</Pill>
        : <Link href="/student/pro" className="btn-primary">{t("Upgrade to Pro")}</Link>}
    </section>

    <section className="card">
      <h2 className="text-lg">{t("Account details")}</h2>
      <p className="mt-1 text-sm text-muted">{t("Your email address is used to sign in.")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><p className="label">{t("Email")}</p><p className="rounded-lg border border-line bg-soft px-3 py-2.5 text-sm">{user.email}</p></div>
        <div><label className="label" htmlFor="student-name">{t("Name")}</label><input id="student-name" className="input" value={name} onChange={event => setName(event.target.value)} maxLength={120} required /></div>
      </div>
      <div className="mt-4 flex flex-col items-start gap-2">
        <button className="btn-outline" onClick={saveProfile} disabled={busy || !name.trim() || name.trim() === user.name}>{t("Save profile")}</button>
        {message && <p className="text-sm text-bad" role="alert">{message}</p>}
      </div>
    </section>

    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg">{t("AI usage")}</h2><p className="mt-1 text-sm text-muted">{t("Check your AI question allowance.")}</p></div>
        {loading ? <span className="text-sm text-muted">{t("Loading…")}</span> : data?.isPro ? <Pill tone="ok">{t("Unlimited")}</Pill> : <Pill tone="info">{data ? `${data.aiUsed} / ${data.freeAiLimit} ${t("used")}` : t("Normal")}</Pill>}
      </div>
      {error && <ErrorNote message={error} onRetry={refreshPlan} />}
    </section>

    <section className="card"><h2 className="text-lg">{t("Language & appearance")}</h2><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><p className="label mb-2">{t("Language")}</p><div className="grid grid-cols-2 gap-2">{([['en', 'English'], ['my', 'မြန်မာ']] as const).map(([value,label]) => <button key={value} aria-pressed={lang === value} onClick={() => setLang(value)} className={`choice ${lang === value ? 'choice-on' : ''}`}>{label}{lang === value && <span className="text-brand">✓</span>}</button>)}</div></div><div><p className="label mb-2">{t("Appearance")}</p><div className="grid grid-cols-2 gap-2">{(['light','dark'] as const).map(value => <button key={value} aria-pressed={theme === value} onClick={() => setTheme(value)} className={`choice capitalize ${theme === value ? 'choice-on' : ''}`}>{t(value === 'light' ? 'Light' : 'Dark')}{theme === value && <span className="text-brand">✓</span>}</button>)}</div></div></div></section>

    <section className="card">
      <h2 className="text-lg">{t("Change password")}</h2>
      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={changePassword}>
        <label className="label sm:col-span-2">{t("Current password")}<PasswordInput className="input" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required /></label>
        <label className="label">{t("New password")}<PasswordInput className="input" autoComplete="new-password" minLength={8} value={newPassword} onChange={event => setNewPassword(event.target.value)} required /></label>
        <label className="label">{t("Confirm new password")}<PasswordInput className="input" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required /></label>
        <div className="flex flex-col items-start gap-2 sm:col-span-2"><button className="btn-outline" disabled={busy}>{t("Update password")}</button>{message && <p className="text-sm text-bad" role="alert">{message}</p>}</div>
      </form>
    </section>
  </>;
}
