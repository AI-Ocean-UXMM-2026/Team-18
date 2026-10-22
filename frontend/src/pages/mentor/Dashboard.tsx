import { Link } from "wouter";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth";
import { fmtWhen, LEVELS } from "@/lib/format";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, Note, PageHead, Spinner } from "@/components/ui";

export type MentorBooking = { id: number; status: string; question: string | null; meetingLink: string | null; startsAt: string; minutes: number; studentFirstName: string; level: string | null; careerId: string | null; majors: string[] | null };
type Overview = { pending: number; upcoming: number; completed: number; freeSlots: number; next: MentorBooking[] };

export default function Dashboard() {
  const { user } = useAuth(); const { t } = usePrefs(); const { content } = useJourney();
  const { data, loading, error, refresh } = useApiData(() => api.get<Overview>("/mentor/overview"));
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No data"} onRetry={refresh} />;
  const careerName = (id: string | null) => content?.careers.find(c => c.id === id)?.t ?? "–";
  return (
    <>
      <PageHead eyebrow="Mentor portal" title={user?.name ?? ""} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["New requests", data.pending], ["Upcoming sessions", data.upcoming], ["Completed", data.completed], ["Free times", data.freeSlots]].map(([l, v]) => <div key={l} className="tile"><b>{v}</b><span>{t(String(l))}</span></div>)}</div>
      {data.pending > 0 && <Note>{t("You have new requests. Please reply within 24 hours.")} <Link href="/mentor/requests" className="font-semibold text-brand">{t("Open requests")}</Link></Note>}
      {data.freeSlots === 0 && <Note>{t("You have no free times. Students cannot book you.")} <Link href="/mentor/availability" className="font-semibold text-brand">{t("Add times")}</Link></Note>}
      <section className="card"><h2 className="mb-2 text-lg">{t("Next sessions")}</h2>
        {data.next.length ? <ul className="divide-y divide-line">{data.next.map(b => <li key={b.id} className="flex flex-wrap justify-between gap-2 py-2"><span><b>{b.studentFirstName}</b> · {LEVELS[b.level ?? ""] ?? "–"} · {careerName(b.careerId)}</span><span className="font-mono text-sm">{fmtWhen(b.startsAt)}</span></li>)}</ul> : <p className="text-muted">{t("No confirmed sessions yet.")}</p>}
      </section>
    </>
  );
}
