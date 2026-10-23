import PasswordInput from "@/components/PasswordInput";
// Super admin: create admin accounts and read the activity log.
import { useState } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { fmtWhen } from "@/lib/format";
import { usePrefs } from "@/lib/prefs";
import { PageHead, TableSkeleton, toast } from "@/components/ui";

type Adm = { id: number; name: string; email: string; adminRole: string; active: boolean };
type Log = { id: number; action: string; target: string | null; actor: string | null; createdAt: string };
export default function Admins() {
  const { t } = usePrefs();
  const admins = useApiData(() => api.get<{ admins: Adm[] }>("/admin/admins"));
  const log = useApiData(() => api.get<{ log: Log[] }>("/admin/audit"));
  const [f, setF] = useState({ name: "", email: "", password: "", adminRole: "ops" });
  async function create(e: React.FormEvent) { e.preventDefault(); try { await api.post("/admin/admins", f); toast(t("Admin created")); setF({ name: "", email: "", password: "", adminRole: "ops" }); admins.refresh(); } catch (err) { toast((err as Error).message); } }
  return (
    <>
      <PageHead eyebrow="Admin portal" title="Admins" />
      <form className="card grid gap-3 md:grid-cols-5 md:items-end" onSubmit={create}>
        <label className="label">{t("Name")}<input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
        <label className="label">{t("Email")}<input className="input" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
        <label className="label">{t("Password")}<PasswordInput className="input" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label>
        <label className="label">{t("Role")}<select className="input" value={f.adminRole} onChange={e => setF({ ...f, adminRole: e.target.value })}><option value="ops">Operations</option><option value="content">Content editor</option><option value="super">Super admin</option></select></label>
        <button className="btn-primary">{t("Create admin")}</button>
      </form>
      {admins.loading ? <TableSkeleton columns={3} /> : <div className="table-wrap"><table><thead><tr><th>{t("Name")}</th><th>{t("Email")}</th><th>{t("Role")}</th></tr></thead><tbody>{admins.data!.admins.map(a => <tr key={a.id}><td>{a.name}</td><td>{a.email}</td><td>{a.adminRole}</td></tr>)}</tbody></table></div>}
      <h2 className="text-lg">{t("Activity log")}</h2>
      {log.loading ? <TableSkeleton columns={4} /> : <div className="table-wrap"><table><thead><tr><th>{t("When")}</th><th>{t("Who")}</th><th>{t("Action")}</th><th>{t("Target")}</th></tr></thead><tbody>{log.data!.log.map(l => <tr key={l.id}><td className="font-mono text-xs">{fmtWhen(l.createdAt)}</td><td>{l.actor ?? "–"}</td><td className="font-mono text-xs">{l.action}</td><td className="font-mono text-xs">{l.target ?? ""}</td></tr>)}</tbody></table></div>}
    </>
  );
}
