// Mentors add the 1-hour times they are free. Students can only book these.
import { useState } from "react";
import { api, type Slot } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { fmtWhen } from "@/lib/format";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, PageHead, Pill, Spinner, toast } from "@/components/ui";

export default function Availability() {
  const { t } = usePrefs();
  const { data, loading, error, refresh } = useApiData(() => api.get<{ slots: (Slot & { bookingStatus: string | null })[] }>("/mentor/slots"));
  const [date, setDate] = useState(""); const [time, setTime] = useState("10:00");
  async function add() {
    if (!date) return toast(t("Choose a date"));
    try { await api.post("/mentor/slots", { startsAt: new Date(`${date}T${time}:00+06:30`).toISOString() }); toast(t("Time added")); refresh(); } catch (e) { toast((e as Error).message); }
  }
  async function remove(id: number) { try { await api.del(`/mentor/slots/${id}`); refresh(); } catch (e) { toast((e as Error).message); } }
  return (
    <>
      <PageHead eyebrow="Mentor portal" title="Availability">{t("Add the 1-hour times you are free (Myanmar time). You cannot delete a time a student has booked.")}</PageHead>
      <section className="card flex flex-wrap items-end gap-3">
        <label className="label">{t("Date")}<input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <label className="label">{t("Start time")}<input className="input" type="time" step={1800} value={time} onChange={e => setTime(e.target.value)} /></label>
        <button className="btn-primary" onClick={add}>{t("Add free time")}</button>
      </section>
      {loading ? <Spinner /> : error ? <ErrorNote message={error} onRetry={refresh} /> : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data!.slots.map(s => <div key={s.id} className="card flex items-center justify-between gap-2 py-3"><span className="font-mono text-sm">{fmtWhen(s.startsAt)}</span>
            {s.bookingStatus ? <Pill tone={s.bookingStatus === "confirmed" ? "ok" : "info"}>{t(s.bookingStatus === "confirmed" ? "Booked" : "Requested")}</Pill> : <button className="text-xs font-semibold text-bad" onClick={() => remove(s.id)}>{t("Remove")}</button>}</div>)}
          {!data!.slots.length && <p className="text-muted">{t("No free times yet.")}</p>}
        </div>
      )}
    </>
  );
}
