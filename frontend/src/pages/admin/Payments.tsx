// Check screenshot + amount + transaction ID in the payment app, then approve (Pro on) or reject with a reason.
import { useState } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { fmtKs, fmtWhen } from "@/lib/format";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, Note, PageHead, Pill, Spinner, Tabs, toast } from "@/components/ui";

type Pay = { id: number; status: string; providerLabel: string; accountName: string; accountNumber: string; amount: number; transactionId: string; proof: string | null; reason: string | null; disputeUsed: boolean; createdAt: string; decidedAt: string | null; studentName: string; studentEmail: string };
export default function Payments() {
  const { t } = usePrefs(); const [tab, setTab] = useState<"open" | "decided">("open");
  const { data, loading, error, refresh } = useApiData(() => api.get<{ price: number; payments: Pay[] }>(`/admin/payments?status=${tab}`), [tab]);
  const [checked, setChecked] = useState<Record<number, boolean>>({}); const [reasons, setReasons] = useState<Record<number, string>>({});
  const [zoom, setZoom] = useState<string | null>(null);
  async function approve(id: number) {
    if (!checked[id]) return toast(t("Tick the box after checking the money arrived"));
    try { await api.post(`/admin/payments/${id}/approve`, { checked: true }); toast(t("Approved. Pro is now on for this student")); refresh(); } catch (e) { toast((e as Error).message); }
  }
  async function reject(id: number) {
    if (!reasons[id]?.trim()) return toast(t("Write a reason before rejecting"));
    try { await api.post(`/admin/payments/${id}/reject`, { reason: reasons[id] }); toast(t("Payment rejected")); refresh(); } catch (e) { toast((e as Error).message); }
  }
  return (
    <>
      <PageHead eyebrow="Admin portal" title="Payments" />
      <Note>{t("Check the money arrived in the CareerNet account in the payment app (amount + transaction ID) before approving. A screenshot alone is not proof.")}</Note>
      <Tabs tabs={[["open", "To check"], ["decided", "Decided"]]} value={tab} onChange={setTab} />
      {loading ? <Spinner /> : error ? <ErrorNote message={error} onRetry={refresh} /> : (
        <>
          {!data!.payments.length && <div className="card text-muted">{t("Nothing here.")}</div>}
          {data!.payments.map(p => (
            <article key={p.id} className="card flex flex-wrap items-start gap-4">
              <button className="grid h-40 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-soft text-xs text-muted" onClick={() => p.proof && setZoom(p.proof)}>{p.proof ? <img src={p.proof} alt={`Payment screenshot from ${p.studentName}`} className="w-full" /> : t("Screenshot deleted")}</button>
              <div className="flex min-w-[240px] flex-1 flex-col gap-1 text-sm">
                <div className="flex flex-wrap justify-between gap-2"><b>{p.studentName}</b><Pill tone={p.status === "approved" ? "ok" : p.status === "rejected" ? "bad" : p.status === "disputed" ? "warn" : "info"}>{t(p.status === "disputed" ? "Re-review asked" : p.status)}</Pill></div>
                <span className="text-xs text-muted">{p.studentEmail}</span>
                <p>CareerNet Pro · <b className="font-mono">{fmtKs(p.amount)}</b> {p.amount !== data!.price && <Pill tone="warn">{t("Amount does not match")}</Pill>}</p>
                <p>{p.providerLabel} → {p.accountName} <span className="font-mono">{p.accountNumber}</span></p>
                <p>{t("Transaction ID")} <b className="font-mono">{p.transactionId}</b> · <span className="text-muted">{fmtWhen(p.createdAt)}</span></p>
                {p.reason && <p><b>{t("Reason")}:</b> {p.reason}</p>}
                {(p.status === "pending" || p.status === "disputed") && (
                  <div className="mt-1 flex flex-col gap-2">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!checked[p.id]} onChange={e => setChecked({ ...checked, [p.id]: e.target.checked })} />{t("I checked the money arrived in our account")}</label>
                    <div className="flex flex-wrap gap-2"><button className="btn-primary btn-sm" onClick={() => approve(p.id)}>{t("Approve · turn on Pro")}</button>
                      <input className="input flex-1 py-1.5 text-sm" maxLength={300} placeholder={t("Reason to reject (required)")} value={reasons[p.id] ?? ""} onChange={e => setReasons({ ...reasons, [p.id]: e.target.value })} />
                      <button className="btn btn-sm border-2 border-bad text-bad" onClick={() => reject(p.id)}>{t("Reject")}</button></div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </>
      )}
      {zoom && <button className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setZoom(null)} aria-label="Close"><img src={zoom} alt="Payment screenshot" className="max-h-full max-w-full rounded-lg" /></button>}
    </>
  );
}
