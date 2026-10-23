// Accept or decline booking requests. Optional meeting link on accept.
import { useState } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { fmtWhen, LEVELS } from "@/lib/format";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, PageHead, Spinner, toast } from "@/components/ui";
import type { MentorBooking } from "./Dashboard";

export default function Requests() {
  const { t } = usePrefs(); const { content } = useJourney();
  const { data, loading, error, refresh } = useApiData(() => api.get<{ bookings: MentorBooking[] }>("/mentor/bookings"));
  const [links, setLinks] = useState<Record<number, string>>({});
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No data"} onRetry={refresh} />;
  const pending = data.bookings.filter(b => b.status === "pending");
  async function act(id: number, what: "accept" | "decline") {
    try { await api.post(`/mentor/bookings/${id}/${what}`, what === "accept" && links[id] ? { meetingLink: links[id] } : {}); toast(t(what === "accept" ? "Request accepted. The student was notified" : "Request declined")); refresh(); }
    catch (e) { toast((e as Error).message); }
  }
  return (
    <>
      <PageHead eyebrow="Mentor portal" title="Requests">{t("Students only see times you marked as free. Reply within 24 hours, or the request expires.")}</PageHead>
      {!pending.length && <div className="card text-muted">{t("No new requests.")}</div>}
      {pending.map(b => (
        <article key={b.id} className="card flex flex-col gap-2">
          <div className="flex flex-wrap justify-between gap-2"><b>{b.studentFirstName}</b><span className="font-mono text-sm">{fmtWhen(b.startsAt)} · {b.minutes} min</span></div>
          <p className="text-sm">{LEVELS[b.level ?? ""] ?? "–"} · {t("Career")}: <b>{content?.careers.find(c => c.id === b.careerId)?.t ?? "–"}</b>{b.majors?.length ? ` · ${t("Major")}: ${b.majors.join(", ")}` : ""}</p>
          {b.question && <p className="text-sm text-muted">“{b.question}”</p>}
          <label className="label">{t("Meeting link (optional, e.g. Google Meet)")}<input className="input" value={links[b.id] ?? ""} onChange={e => setLinks({ ...links, [b.id]: e.target.value })} placeholder="https://meet.google.com/…" /></label>
          <div className="flex gap-2"><button className="btn-primary btn-sm" onClick={() => act(b.id, "accept")}>{t("Accept")}</button><button className="btn-destructive btn-sm" onClick={() => act(b.id, "decline")}>{t("Decline")}</button></div>
        </article>
      ))}
    </>
  );
}
