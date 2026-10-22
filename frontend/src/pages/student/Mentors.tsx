// Step 3 (optional, Pro only): 1-hour mentor session. Request → mentor accepts → session.
import { useState } from "react";
import { Link } from "wouter";
import { api, type Slot } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { fmtDay, fmtTime, fmtWhen } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { Actions, CardGridSkeleton, ErrorNote, PageHead, Pill, toast } from "@/components/ui";

type Mentor = { id: number; name: string; title: string; years: number; fields: number[]; languages: string; bio: string | null; slots: Slot[]; recommended: boolean };
type Booking = { id: number; status: string; question: string | null; meetingLink: string | null; startsAt: string; minutes: number; mentorName: string; mentorTitle: string };
const STATUS: Record<string, [string, "ok" | "warn" | "bad" | "info"]> = {
  pending: ["Waiting for the mentor to accept", "info"], confirmed: ["Confirmed", "ok"], declined: ["Mentor can't make this time", "bad"],
  cancelled: ["Cancelled", "bad"], completed: ["Completed", "ok"], no_show: ["Missed", "bad"], expired: ["No reply, please pick another time", "warn"],
};

export default function Mentors() {
  const { t } = usePrefs(); const { user, isGuest } = useAuth();
  if (isGuest) return <section className="card mx-auto flex max-w-lg flex-col items-center gap-3 text-center"><p className="eyebrow">Step 3 · Meet a mentor</p><h1 className="text-2xl">{t("Mentor sessions are part of CareerNest Pro")}</h1><p className="text-muted">{t("Create an account and upgrade to Pro to meet a mentor.")}</p><div className="flex flex-wrap justify-center gap-2"><Link href="/register" className="btn-primary">{t("Create an account")}</Link><Link href="/student/compare" className="btn-ghost">{t("Continue")}</Link></div></section>;
  if (!user?.isPro) return (
    <>
      <PageHead back="/student/compare" eyebrow="Step 3 · Meet a mentor (optional)" title="A 1-hour session with a professional in your career" />
      <section className="card flex flex-col items-center gap-3 text-center">
        <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Pro</span>
        <h2 className="text-lg">{t("Mentor sessions are part of CareerNest Pro")}</h2>
        <p className="text-muted">{t("Upgrade once to book a 1-hour session with a professional.")}</p>
        <Link href="/student/pro" className="btn-primary">{t("Go Pro")}</Link>
      </section>
    </>
  );
  return <MentorMarketplace />;
}

function MentorMarketplace() {
  const { j, content } = useJourney(); const { t } = usePrefs(); const { user } = useAuth();
  const mentors = useApiData(() => api.get<{ mentors: Mentor[] }>(`/mentors?careerId=${j.careerId ?? ""}`), [j.careerId]);
  const bookings = useApiData(() => api.get<{ bookings: Booking[] }>("/me/bookings"));
  const [pick, setPick] = useState<{ mentor: Mentor; slot: Slot } | null>(null);
  const [question, setQuestion] = useState(""); const [busy, setBusy] = useState(false);
  const career = content?.careers.find(c => c.id === j.careerId);

  async function request() {
    if (!pick) return; setBusy(true);
    try { const r = await api.post<{ message: string }>("/bookings", { slotId: pick.slot.id, question: question || undefined }); toast(r.message); setPick(null); setQuestion(""); mentors.refresh(); bookings.refresh(); }
    catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  }
  async function cancel(id: number) { try { await api.post(`/me/bookings/${id}/cancel`); bookings.refresh(); mentors.refresh(); toast(t("Booking cancelled")); } catch (e) { toast((e as Error).message); } }

  return (
    <>
      <PageHead back="/student/compare" eyebrow="Step 3 · Meet a mentor (optional)" title="A 1-hour session with a professional in your career">
        {t("Learn about the job market, positions and skills, confirm your major, and discuss your university choices. Pick a mentor and a time they are free.")}
      </PageHead>
      {bookings.data && bookings.data.bookings.length > 0 && (
        <section className="flex flex-col gap-2"><h2 className="text-lg">{t("My sessions")}</h2>
          {bookings.data.bookings.map(b => (
            <article key={b.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div><b>{b.mentorName}</b> <span className="text-sm text-muted">· {b.mentorTitle}</span><p className="font-mono text-sm">{fmtWhen(b.startsAt)} · {b.minutes} min</p>
                {b.status === "confirmed" && (b.meetingLink ? <a className="text-sm font-semibold text-brand" href={b.meetingLink} target="_blank" rel="noreferrer">{t("Join the video call")}</a> : <p className="text-xs text-muted">{t("The meeting link will be sent before the session.")}</p>)}</div>
              <div className="flex items-center gap-2"><Pill tone={STATUS[b.status][1]}>{t(STATUS[b.status][0])}</Pill>{["pending", "confirmed"].includes(b.status) && <button className="btn-ghost btn-sm" onClick={() => cancel(b.id)}>{t("Cancel")}</button>}</div>
            </article>
          ))}
        </section>
      )}
      {mentors.error && <ErrorNote message={mentors.error} onRetry={mentors.refresh} />}
      {mentors.loading ? <CardGridSkeleton count={2} /> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {mentors.data?.mentors.map(m => (
            <article key={m.id} className={`card flex flex-col gap-2 ${m.recommended ? "border-brand" : ""}`}>
              <div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-lg font-semibold text-brand" aria-hidden="true">{m.name.split(" ").slice(0,2).map(n => n[0]).join("")}</span><div><b>{m.name}</b><p className="text-sm">{m.title}</p><p className="text-xs text-muted">{m.years} {t("years experience")} · {m.languages}</p></div></div>
              {m.recommended && career && <span className="self-start rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">{t("Recommended for")} {career.t}</span>}
              {m.bio && <p className="my-2 text-sm leading-6 text-muted">{m.bio}</p>}
              {m.slots.length ? <div className="flex flex-wrap gap-1.5">{m.slots.slice(0, 9).map(s => <button key={s.id} className={`rounded-lg border px-2 py-1 font-mono text-xs ${pick?.slot.id === s.id ? "border-brand bg-brand text-on-brand" : "border-line hover:border-brand"}`} onClick={() => setPick({ mentor: m, slot: s })}>{fmtDay(s.startsAt)} {fmtTime(s.startsAt)}</button>)}</div>
                : <p className="text-sm text-muted">{t("No free times right now. Check again later.")}</p>}
            </article>
          ))}
        </div>
      )}
      {pick && (
        <section className="card flex flex-col gap-3 border-brand">
          <h2 className="text-lg">{t("Confirm your request")}</h2>
          <p><b>{pick.mentor.name}</b> · <span className="font-mono">{fmtWhen(pick.slot.startsAt)}</span> · 1 {t("hour")}</p>
          <label className="label">{t("Question for the mentor (optional)")}<textarea className="input" rows={2} value={question} onChange={e => setQuestion(e.target.value)} placeholder={t("What does a normal first year in this job look like?")} /></label>
          <p className="text-xs text-muted">{t("The mentor accepts or declines within 24 hours.")}</p>
          <div className="flex gap-2"><button className="btn-ghost" onClick={() => setPick(null)}>{t("Back")}</button><button className="btn-primary" disabled={busy} onClick={request}>{t("Send request")}</button></div>
        </section>
      )}
      <Actions><Link href="/student/plan" className="btn-primary">{t("See my plan")}</Link></Actions>
    </>
  );
}
