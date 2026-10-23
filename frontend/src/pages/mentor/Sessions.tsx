import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { fmtWhen, LEVELS } from "@/lib/format";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, PageHead, Pill, Spinner, toast } from "@/components/ui";
import type { MentorBooking } from "./Dashboard";

const TONE: Record<string, "ok" | "bad" | "info" | "warn"> = { confirmed: "info", completed: "ok", no_show: "bad", cancelled: "bad", declined: "bad", expired: "warn" };
export default function Sessions() {
  const { t } = usePrefs(); const { content } = useJourney();
  const { data, loading, error, refresh } = useApiData(() => api.get<{ bookings: MentorBooking[] }>("/mentor/bookings"));
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No data"} onRetry={refresh} />;
  const list = data.bookings.filter(b => b.status !== "pending");
  async function act(id: number, what: string) { try { await api.post(`/mentor/bookings/${id}/${what}`); refresh(); } catch (e) { toast((e as Error).message); } }
  return (
    <>
      <PageHead eyebrow="Mentor portal" title="Sessions" />
      {!list.length && <div className="card text-muted">{t("No sessions yet.")}</div>}
      {list.map(b => (
        <article key={b.id} className="card flex flex-wrap items-center justify-between gap-3">
          <div><b>{b.studentFirstName}</b> <span className="text-sm text-muted">· {LEVELS[b.level ?? ""] ?? "–"} · {content?.careers.find(c => c.id === b.careerId)?.t ?? "–"}</span>
            <p className="font-mono text-sm">{fmtWhen(b.startsAt)} · {b.minutes} min</p>{b.meetingLink && <a className="text-sm text-brand" href={b.meetingLink} target="_blank" rel="noreferrer">{b.meetingLink}</a>}</div>
          <div className="flex flex-wrap items-center gap-2"><Pill tone={TONE[b.status] ?? "info"}>{t(b.status)}</Pill>
            {b.status === "confirmed" && <><button className="btn-outline btn-sm" onClick={() => act(b.id, "complete")}>{t("Mark as completed")}</button><button className="btn-destructive btn-sm" onClick={() => act(b.id, "no-show")}>{t("Student did not come")}</button><button className="btn-destructive btn-sm" onClick={() => act(b.id, "cancel")}>{t("Cancel")}</button></>}</div>
        </article>
      ))}
    </>
  );
}
