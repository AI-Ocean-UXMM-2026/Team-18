// ===========================================================================
//  Pro: pay with a mobile wallet, send amount + transaction ID + screenshot,
//  admin checks the money arrived and approves → Pro turns on.
//  (Adapted from the ChessClash deposit flow.)
// ===========================================================================
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth";
import { fmtKs, fmtWhen } from "@/lib/format";
import { usePrefs } from "@/lib/prefs";
import { ErrorNote, PageHead, Pill, Spinner, toast } from "@/components/ui";

type Account = { provider: string; label: string; accountName: string; accountNumber: string };
type Payment = { id: number; provider: string; accountName: string; accountNumber: string; amount: number; transactionId: string; status: "pending" | "approved" | "rejected" | "disputed"; reason: string | null; disputeUsed: boolean; createdAt: string; proof: string | null };
type ProInfo = { isPro: boolean; aiUsed: number; freeAiLimit: number; price: number; accounts: Account[]; latest: Payment | null };
const MAX = 1024 * 1024;
const readAsDataUrl = (f: File) => new Promise<string>((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => bad(new Error("read")); r.readAsDataURL(f); });

export default function Pro() {
  const { t } = usePrefs(); const { user, refresh: refreshUser } = useAuth();
  const { data, loading, error, refresh } = useApiData(() => api.get<ProInfo>("/pro"));
  const [provider, setProvider] = useState<string | null>(null);
  const [amount, setAmount] = useState(""); const [txn, setTxn] = useState(""); const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ proof: string } | null>(null); // filled form waiting for "Confirm & send"
  useEffect(() => { if (data?.isPro && !user?.isPro) refreshUser(); }, [data?.isPro, user?.isPro, refreshUser]);
  const requestKey = useMemo(() => crypto.randomUUID(), [data?.latest?.id]);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No data"} onRetry={refresh} />;
  const acc = data.accounts.find(a => a.provider === provider);
  const p = data.latest;
  const open = p && (p.status === "pending" || p.status === "disputed");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    if (Number(amount) !== data!.price) return setErr(`${t("Please send exactly")} ${fmtKs(data!.price)}.`);
    if (!/^[A-Za-z0-9-]{6,30}$/.test(txn.trim())) return setErr(t("Enter the transaction ID from your payment receipt (6–30 letters or numbers)."));
    if (!file) return setErr(t("Add your payment screenshot."));
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setErr(t("The screenshot must be a PNG, JPG or WEBP image."));
    if (file.size > MAX) return setErr(t("The screenshot is larger than 1 MB. Crop it or take a smaller screenshot."));
    try { setDraft({ proof: await readAsDataUrl(file) }); window.scrollTo({ top: 0 }); }
    catch { setErr(t("Could not read the image. Please try another screenshot.")); }
  }
  async function confirmSend() {
    if (!draft) return; setBusy(true);
    try {
      await api.post("/pro/payments", { requestKey, provider, amount: Number(amount), transactionId: txn.trim(), proof: draft.proof });
      setDraft(null); toast(t("Sent. We will check your payment soon")); refresh();
    } catch (e2) { setDraft(null); setErr((e2 as Error).message); } finally { setBusy(false); }
  }
  async function dispute() { try { await api.post(`/pro/payments/${p!.id}/dispute`); toast(t("Re-review requested")); refresh(); } catch (e2) { toast((e2 as Error).message); } }

  if (data.isPro) return (
    <section className="card mx-auto flex max-w-lg flex-col items-center gap-3 text-center border-ok">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-ok-soft text-2xl font-bold text-ok">✓</div>
      <h1 className="text-2xl">{t("You are Pro")}</h1><p className="text-muted">{t("Payment approved. All Pro features are unlocked.")}</p>
      <Link href="/student/plan" className="btn-primary" onClick={() => refreshUser()}>{t("Get my PDF report")}</Link>
    </section>
  );
  return (
    <>
      <PageHead back="/student/plan" eyebrow="PathFinder Pro" title="Upgrade to Pro" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card"><b>{t("Free")}</b><ul className="mt-2 list-disc pl-5 text-sm"><li>{t("Career quiz & top 3 careers")}</li><li>{t("Majors, university explorer & compare")}</li><li>{t("AI questions")}: {data.freeAiLimit} ({t("used")} {data.aiUsed})</li></ul></div>
        <div className="card border-brand"><b>Pro · <span className="font-mono">{fmtKs(data.price)}</span> {t("one time")}</b><ul className="mt-2 list-disc pl-5 text-sm"><li>{t("Full PDF report")}</li><li>{t("Unlimited AI career coach and university advisor")}</li><li>{t("1-hour sessions with professional mentors")}</li><li>{t("Pro badge on your account")}</li></ul></div>
      </div>
      {open ? (
        <section className="card flex flex-col gap-3">
          <Pill tone={p!.status === "disputed" ? "warn" : "info"}>{t(p!.status === "disputed" ? "Re-review requested" : "Payment waiting for admin check")}</Pill>
          <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]"><dt className="font-semibold text-muted">{t("Paid to")}</dt><dd>{p!.accountName} · <span className="font-mono">{p!.accountNumber}</span></dd>
            <dt className="font-semibold text-muted">{t("Amount")}</dt><dd className="font-mono">{fmtKs(p!.amount)}</dd><dt className="font-semibold text-muted">{t("Transaction ID")}</dt><dd className="font-mono">{p!.transactionId}</dd>
            <dt className="font-semibold text-muted">{t("Sent")}</dt><dd>{fmtWhen(p!.createdAt)}</dd></dl>
          {p!.proof && <img src={p!.proof} alt={t("Your payment screenshot")} className="max-w-[180px] rounded-lg border border-line" />}
          <p className="text-sm text-muted">{t("We check that the money arrived in our account, usually within 1 hour (9:00–21:00). Pro turns on automatically after approval.")}</p>
        </section>
      ) : draft && acc ? (
        <section className="card flex flex-col gap-3">
          <h2 className="text-lg">{t("Confirm your payment")}</h2>
          <p className="text-sm text-muted">{t("Check the details. You cannot change them after sending.")}</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]"><dt className="font-semibold text-muted">{t("Paid to")}</dt><dd>{acc.label} · {acc.accountName} · <span className="font-mono">{acc.accountNumber}</span></dd>
            <dt className="font-semibold text-muted">{t("Amount")}</dt><dd className="font-mono">{fmtKs(Number(amount))}</dd><dt className="font-semibold text-muted">{t("Transaction ID")}</dt><dd className="font-mono">{txn.trim()}</dd></dl>
          <img src={draft.proof} alt={t("Your payment screenshot")} className="max-w-[180px] rounded-lg border border-line" />
          <div className="flex flex-wrap justify-end gap-3"><button className="btn-ghost" disabled={busy} onClick={() => setDraft(null)}>{t("Edit")}</button><button className="btn-primary" disabled={busy} onClick={confirmSend}>{t("Confirm & send")}</button></div>
        </section>
      ) : (
        <>
          {p?.status === "rejected" && <section className="card flex flex-col gap-2 border-bad"><Pill tone="bad">{t("Payment rejected")}</Pill><p><b>{t("Reason")}:</b> {p.reason}</p>
            <div className="flex flex-wrap items-center gap-2">{!p.disputeUsed && p.proof && <button className="btn-outline btn-sm" onClick={dispute}>{t("I did pay. Ask for a re-review")}</button>}<span className="text-sm text-muted">{t("Or send a new payment below.")}</span></div></section>}
          <section className="card flex flex-col gap-3">
            <h2 className="text-lg">1. {t("Choose how you pay")}</h2>
            <div className="flex flex-wrap gap-2">{data.accounts.map(a => <button key={a.provider} className={`choice flex-1 items-center ${provider === a.provider ? "choice-on" : ""}`} onClick={() => setProvider(a.provider)}><b>{a.label}</b></button>)}</div>
            {acc && <>
              <h2 className="text-lg">2. {t("Send")} {fmtKs(data.price)} {t("to this account")}</h2>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl bg-soft p-4">
                <div><span className="text-xs text-muted">{acc.label} · {t("Account name")}</span><p className="font-bold">{acc.accountName}</p></div>
                <div><span className="text-xs text-muted">{t("Account number")}</span><p className="font-mono font-bold">{acc.accountNumber}</p></div>
                <button className="btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(acc.accountNumber.replace(/\s/g, "")).then(() => toast(t("Number copied")), () => toast(t("Could not copy. Please copy the number manually.")))}>{t("Copy number")}</button>
              </div>
              <h2 className="text-lg">3. {t("Send us the payment details")}</h2>
              <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="label">{t("Amount you sent (Ks)")}<input className="input" type="number" inputMode="numeric" value={amount} placeholder={String(data.price)} onChange={e => setAmount(e.target.value)} /></label>
                  <label className="label">{t("Transaction ID")}<input className="input font-mono" maxLength={30} value={txn} onChange={e => setTxn(e.target.value)} placeholder="01004563782" /></label>
                </div>
                <label className="label">{t("Payment screenshot (image, max 1 MB)")}<input className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
                <p className="text-xs text-muted">{t("A screenshot alone is not proof. We check that the money arrived in our account before turning on Pro. Screenshots are deleted 10 days after the decision.")}</p>
                {err && <p className="text-sm font-semibold text-bad">{err}</p>}
                <button className="btn-primary self-start" disabled={busy}>{t("Send for checking")}</button>
              </form>
            </>}
            {!data.accounts.length && <p className="text-sm text-muted">{t("Payments are not open yet. Please try again later.")}</p>}
          </section>
        </>
      )}
    </>
  );
}
