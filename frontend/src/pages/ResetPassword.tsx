import { useState } from "react";
import { Link, useLocation } from "wouter";
import AuthLayout from "@/components/AuthLayout";
import BrandLogo from "@/components/BrandLogo";
import PasswordInput from "@/components/PasswordInput";
import { api, ApiError } from "@/lib/api";

export default function ResetPassword() {
  const [tokenFromUrl] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
  const [, go] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  async function requestReset(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null); setMessage(null);
    try {
      const result = await api.post<{ message: string }>("/auth/password/forgot", { email });
      setMessage(result.message);
    } catch (err) { setError(err instanceof ApiError && err.status === 404 ? "Password recovery is not available on this server yet. Please contact the site administrator." : err instanceof Error ? err.message : "Could not request a reset link."); }
    finally { setBusy(false); }
  }

  async function resetPassword(event?: React.FormEvent, generate = false) {
    event?.preventDefault(); setBusy(true); setError(null);
    if (!generate && password !== confirmPassword) { setError("Passwords do not match."); setBusy(false); return; }
    try {
      const result = await api.post<{ password?: string }>("/auth/password/reset", { token: tokenFromUrl, ...(generate ? {} : { password }) });
      setGeneratedPassword(result.password ?? "");
      setComplete(true); setPassword(""); setConfirmPassword("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not reset your password."); }
    finally { setBusy(false); }
  }

  return <AuthLayout>
    <section className="card login-sheet mx-auto flex w-full max-w-md flex-col gap-5 lg:max-w-none">
      <BrandLogo />
      <div><p className="eyebrow">Account recovery</p><h1 className="mt-1 text-3xl">{tokenFromUrl ? "Choose a new password" : "Forgot your password?"}</h1></div>
      {complete ? <div className="flex flex-col gap-4"><p className="rounded-xl border border-line bg-soft p-3 text-sm">Your password has been changed. Sign in with your new password.</p>{generatedPassword && <div className="rounded-xl border border-brand bg-brand-soft p-4"><p className="mb-2 text-sm font-semibold">Your new password</p><output className="block break-all font-mono text-lg text-ink">{generatedPassword}</output><p className="mt-2 text-xs text-muted">Save this password now. It is shown only on this screen.</p></div>}<Link href="/login" className="btn-primary text-center">Back to sign in</Link></div>
        : tokenFromUrl ? <form className="flex flex-col gap-3" onSubmit={resetPassword}>
          <p className="text-sm text-muted">Choose a new password with at least 8 characters. This reset link can only be used once.</p>
          <label className="label">New password<PasswordInput className="input" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} maxLength={200} required /></label>
          <label className="label">Confirm new password<PasswordInput className="input" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} maxLength={200} required /></label>
          {error && <p className="text-sm font-semibold text-bad">{error}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
          <button type="button" className="btn-outline" disabled={busy} onClick={() => void resetPassword(undefined, true)}>Generate a new password for me</button>
        </form> : <form className="flex flex-col gap-3" onSubmit={requestReset}>
          <p className="text-sm text-muted">Enter the email on your account. If it matches an active account, we’ll send a one-time reset link.</p>
          <label className="label">Email<input className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={320} required /></label>
          {error && <p className="text-sm font-semibold text-bad">{error}</p>}
          {message && <p className="rounded-xl border border-line bg-soft p-3 text-sm">{message}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>}
      {!complete && <button type="button" className="btn-outline" onClick={() => go("/login")}>Back to sign in</button>}
    </section>
  </AuthLayout>;
}
