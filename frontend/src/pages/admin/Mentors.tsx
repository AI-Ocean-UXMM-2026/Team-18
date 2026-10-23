import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, PageHead, Pill, Spinner, toast } from "@/components/ui";

type M = { id: number; name: string; email: string; title: string; years: number; fields: number[]; languages: string; status: string; sessions: number; noShows: number; futureSlots: number };
export default function Mentors() {
  const { t } = usePrefs(); const { content } = useJourney();
  const { data, loading, error, refresh } = useApiData(() => api.get<{ mentors: M[] }>("/admin/mentors"));
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No data"} onRetry={refresh} />;
  async function setStatus(id: number, status: string) { try { await api.post(`/admin/mentors/${id}/status`, { status }); toast(t("Saved")); refresh(); } catch (e) { toast((e as Error).message); } }
  const apps = data.mentors.filter(m => m.status === "pending"); const rest = data.mentors.filter(m => m.status !== "pending");
  return (
    <>
      <PageHead eyebrow="Admin portal" title="Mentors" />
      {apps.length > 0 && <section className="flex flex-col gap-2"><h2 className="text-lg">{t("New applications")}</h2>
        {apps.map(m => <article key={m.id} className="card flex flex-wrap items-center justify-between gap-3"><div><b>{m.name}</b> <span className="text-xs text-muted">{m.email}</span><p className="text-sm">{m.title} · {m.years} {t("years")} · {m.fields.map(f => content?.fields[f]).join(", ")}</p></div>
          <div className="flex gap-2"><button className="btn-primary btn-sm" onClick={() => setStatus(m.id, "active")}>{t("Approve")}</button><button className="btn-destructive btn-sm" onClick={() => setStatus(m.id, "rejected")}>{t("Reject")}</button></div></article>)}
      </section>}
      <div className="table-wrap"><table>
        <thead><tr><th>{t("Mentor")}</th><th>{t("Field")}</th><th>{t("Free times")}</th><th>{t("Sessions")}</th><th>{t("No-shows")}</th><th>{t("Status")}</th><th /></tr></thead>
        <tbody>{rest.map(m => <tr key={m.id}><td><b>{m.name}</b><br /><span className="text-xs text-muted">{m.title}</span></td><td className="text-xs">{m.fields.map(f => content?.fields[f]).join(", ")}</td>
          <td className="font-mono">{m.futureSlots}</td><td className="font-mono">{m.sessions}</td><td className="font-mono">{m.noShows}</td>
          <td><Pill tone={m.status === "active" ? "ok" : "bad"}>{t(m.status)}</Pill></td>
          <td>{m.status === "active" ? <button className="btn-destructive btn-sm" onClick={() => setStatus(m.id, "suspended")}>{t("Suspend")}</button> : <button className="btn-outline btn-sm" onClick={() => setStatus(m.id, "active")}>{t("Activate")}</button>}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}
