import { useState } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth";
import { LEVELS } from "@/lib/format";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { PageHead, Pill, TableSkeleton, toast } from "@/components/ui";

type St = { id: number; name: string; email: string; isPro: boolean; active: boolean; level: string | null; careerId: string | null; bookings: number };
export default function Students() {
  const { t } = usePrefs(); const { content } = useJourney(); const { user } = useAuth();
  const [q, setQ] = useState(""); const [search, setSearch] = useState("");
  const { data, loading, refresh } = useApiData(() => api.get<{ students: St[] }>(`/admin/students?q=${encodeURIComponent(search)}`), [search]);
  const [sure, setSure] = useState<number | null>(null);
  async function toggle(s: St) { try { await api.post(`/admin/students/${s.id}/active`, { active: !s.active }); refresh(); } catch (e) { toast((e as Error).message); } }
  async function del(s: St) { if (sure !== s.id) { setSure(s.id); return; } try { await api.del(`/admin/students/${s.id}`); toast(t("Student data deleted")); setSure(null); refresh(); } catch (e) { toast((e as Error).message); } }
  return (
    <>
      <PageHead eyebrow="Admin portal" title="Students" />
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); setSearch(q); }}><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={t("Search by name or email")} /><button className="btn-primary">{t("Search")}</button></form>
      {loading ? <TableSkeleton columns={6} /> : <div className="table-wrap"><table>
        <thead><tr><th>{t("Student")}</th><th>{t("Level")}</th><th>{t("Career")}</th><th>Pro</th><th>{t("Bookings")}</th><th /></tr></thead>
        <tbody>{data!.students.map(s => <tr key={s.id}><td><b>{s.name}</b><br /><span className="text-xs text-muted">{s.email}</span></td><td>{LEVELS[s.level ?? ""] ?? "–"}</td><td>{content?.careers.find(c => c.id === s.careerId)?.t ?? "–"}</td>
          <td>{s.isPro ? <Pill tone="ok">Pro</Pill> : "–"}</td><td className="font-mono">{s.bookings}</td>
          <td className="flex flex-wrap gap-2"><button className={s.active ? "btn-destructive btn-sm" : "btn-outline btn-sm"} onClick={() => toggle(s)}>{t(s.active ? "Switch off" : "Switch on")}</button>
            {user?.adminRole === "super" && <button className="btn-destructive btn-sm" onClick={() => del(s)}>{t(sure === s.id ? "Tap again to delete" : "Delete data")}</button>}</td></tr>)}</tbody>
      </table></div>}
    </>
  );
}
