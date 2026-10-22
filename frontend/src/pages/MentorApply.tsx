// Mentor application: reviewed by an admin before the mentor can sign in.
import { useState } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";
import { useJourney } from "@/lib/journey";

export default function MentorApply() {
  const { t } = usePrefs(); const { content } = useJourney();
  const [f, setF] = useState({ name: "", email: "", password: "", title: "", years: 5, field: 1, languages: "Myanmar · English", bio: "" });
  const [error, setError] = useState<string | null>(null); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setBusy(true);
    try { await api.post("/auth/mentor-apply", { name: f.name, email: f.email, password: f.password, title: f.title, years: Number(f.years), fields: [Number(f.field)], languages: f.languages, bio: f.bio }); setDone(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not send."); } finally { setBusy(false); }
  }
  if (done) return <section className="card mx-auto flex max-w-md flex-col gap-3 text-center"><h1 className="text-2xl">{t("Application sent")}</h1><p className="text-muted">{t("The PathFinder team will review it. You can sign in after it is approved.")}</p><Link href="/mentor/login" className="btn-primary">{t("Mentor sign in")}</Link></section>;
  const inp = (k: keyof typeof f, label: string, type = "text") => <label className="label">{t(label)}<input className="input" type={type} value={f[k] as string | number} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>;
  return (
    <section className="card mx-auto flex w-full max-w-lg flex-col gap-4">
      <p className="eyebrow">{t("Mentor portal")}</p><h1 className="text-2xl">{t("Apply to become a mentor")}</h1>
      <p className="text-sm text-muted">{t("Mentors give 1-hour online sessions about their career: job market, positions, skills, majors and universities.")}</p>
      <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
        {inp("name", "Full name")}{inp("email", "Email", "email")}{inp("password", "Password (min 8 characters)", "password")}
        {inp("title", "Job title (e.g. Civil Engineer, construction)")}
        <div className="grid grid-cols-2 gap-3">{inp("years", "Years of experience", "number")}
          <label className="label">{t("Career field")}<select className="input" value={f.field} onChange={e => setF({ ...f, field: Number(e.target.value) })}>{Object.entries(content?.fields ?? {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label></div>
        {inp("languages", "Languages")}
        <label className="label">{t("Short bio (optional)")}<textarea className="input" rows={3} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} /></label>
        {error && <p className="text-sm font-semibold text-bad">{error}</p>}
        <button className="btn-primary" disabled={busy}>{t("Send application")}</button>
      </form>
      <p className="text-center text-sm"><Link href="/mentor/login" className="text-brand">{t("I already have a mentor account")}</Link></p>
    </section>
  );
}
