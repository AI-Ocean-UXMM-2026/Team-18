// Super admin: receiving accounts students pay to; switch providers on/off.
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { usePrefs } from "@/lib/prefs";
import { PageHead, Spinner, toast } from "@/components/ui";

type Acc = { provider: string; label: string; enabled: boolean; accountName: string; accountNumber: string };
export default function PaymentAccounts() {
  const { t } = usePrefs();
  const { data, loading, refresh } = useApiData(() => api.get<{ accounts: Acc[] }>("/admin/payment-accounts"));
  const [rows, setRows] = useState<Acc[]>([]);
  useEffect(() => { if (data) setRows(data.accounts); }, [data]);
  if (loading) return <Spinner />;
  const up = (i: number, patch: Partial<Acc>) => setRows(r => r.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  async function save(a: Acc) { try { await api.put(`/admin/payment-accounts/${a.provider}`, { enabled: a.enabled, accountName: a.accountName, accountNumber: a.accountNumber }); toast(t("Saved")); refresh(); } catch (e) { toast((e as Error).message); } }
  return (
    <>
      <PageHead eyebrow="Admin portal" title="Payment accounts">{t("Students see only switched-on providers. Payments already sent keep the account they paid to.")}</PageHead>
      <div className="table-wrap"><table>
        <thead><tr><th>{t("Provider")}</th><th>{t("Shown to students")}</th><th>{t("Account name")}</th><th>{t("Account number")}</th><th /></tr></thead>
        <tbody>{rows.map((a, i) => <tr key={a.provider}><td><b>{a.label}</b></td>
          <td><label className="flex items-center gap-2"><input type="checkbox" checked={a.enabled} onChange={e => up(i, { enabled: e.target.checked })} />{t(a.enabled ? "On" : "Off")}</label></td>
          <td><input className="input py-1.5" value={a.accountName} onChange={e => up(i, { accountName: e.target.value })} /></td>
          <td><input className="input py-1.5 font-mono" value={a.accountNumber} onChange={e => up(i, { accountNumber: e.target.value })} /></td>
          <td><button className="btn-primary btn-sm" onClick={() => save(a)}>{t("Save")}</button></td></tr>)}</tbody>
      </table></div>
    </>
  );
}
