import { Link } from "wouter";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth";
import { fmtKs, LEVELS } from "@/lib/format";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { adminCan } from "@/components/AppShell";
import { ErrorNote, Note, PageHead, Spinner } from "@/components/ui";

type Stats = { students: number; quizzesCompleted: number; proMembers: number; paymentsToCheck: number; mentorApplications: number; mentorSessions: number; revenueThisMonth: number; careers: { careerId: string; n: number }[]; levels: { level: string; n: number }[] };
const ROLE_NAME = { super: "Super admin", ops: "Operations admin", content: "Content editor" };
export default function Overview() {
  const { user } = useAuth(); const { t } = usePrefs(); const { content } = useJourney();
  const { data, loading, error, refresh } = useApiData(() => api.get<Stats>("/admin/stats"));
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No data"} onRetry={refresh} />;
  const total = data.levels.reduce((s, l) => s + l.n, 0) || 1;
  return (
    <>
      <PageHead eyebrow={`Admin portal · ${ROLE_NAME[user!.adminRole!]}`} title="Dashboard" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Students", data.students], ["Quizzes completed", data.quizzesCompleted], ["Pro members", data.proMembers], ["Revenue this month", fmtKs(data.revenueThisMonth)], ["Mentor sessions", data.mentorSessions], ["Payments to check", data.paymentsToCheck], ["Mentor applications", data.mentorApplications]].map(([l, v]) => <div key={l} className="tile"><b>{v}</b><span>{t(String(l))}</span></div>)}
      </div>
      {(data.paymentsToCheck > 0 && adminCan(user?.adminRole, "/admin/payments")) && <Note>{data.paymentsToCheck} {t("payment(s) to check.")} <Link href="/admin/payments" className="font-semibold text-brand">{t("Open payments")}</Link></Note>}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card"><h2 className="mb-2 text-lg">{t("Most chosen careers")}</h2>{data.careers.length ? <ol className="list-decimal pl-5">{data.careers.map(c => <li key={c.careerId}>{content?.careers.find(x => x.id === c.careerId)?.t ?? c.careerId} · <span className="font-mono">{c.n}</span></li>)}</ol> : <p className="text-muted">{t("No data yet.")}</p>}</section>
        <section className="card"><h2 className="mb-2 text-lg">{t("Students by level")}</h2>{data.levels.map(l => <div key={l.level} className="grid grid-cols-[110px_1fr_3rem] items-center gap-2 text-sm"><span>{LEVELS[l.level] ?? l.level}</span><div className="h-2 overflow-hidden rounded-full bg-soft"><div className="h-full bg-brand" style={{ width: `${(l.n / total) * 100}%` }} /></div><span className="text-right font-mono">{l.n}</span></div>)}</section>
      </div>
    </>
  );
}
