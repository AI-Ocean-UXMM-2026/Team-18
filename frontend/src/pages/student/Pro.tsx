// ===========================================================================
//  Pro: pay with a mobile wallet, send amount + screenshot,
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
type Payment = { id: number; provider: string; accountName: string; accountNumber: string; amount: number; status: "pending" | "approved" | "rejected" | "disputed"; reason: string | null; disputeUsed: boolean; createdAt: string; proof: string | null };
type ProInfo = { isPro: boolean; proExpiresAt: string | null; aiUsed: number; freeAiLimit: number; price: number; accounts: Account[]; latest: Payment | null };
const MAX = 1024 * 1024;
const readAsDataUrl = (f: File) => new Promise<string>((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => bad(new Error("read")); r.readAsDataURL(f); });

export default function Pro() {
  const { t } = usePrefs(); const { user, refresh: refreshUser } = useAuth();
  const { data, loading, error, refresh } = useApiData(() => api.get<ProInfo>("/pro"));
  const [provider, setProvider] = useState<string | null>(null);
  const [amount, setAmount] = useState("5000"); const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ proof: string } | null>(null); // filled form waiting for "Confirm & send"
  const paymentSectionId = "pro-payment-methods";
  useEffect(() => { if (data && data.isPro !== user?.isPro) refreshUser(); }, [data?.isPro, user?.isPro, refreshUser]);
  const requestKey = useMemo(() => crypto.randomUUID(), [data?.latest?.id]);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote message={error ?? "No data"} onRetry={refresh} />;
  const acc = data.accounts.find(a => a.provider === provider);
  const p = data.latest;
  const open = p && (p.status === "pending" || p.status === "disputed");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    if (Number(amount) !== data!.price) return setErr(`${t("Please send exactly")} ${fmtKs(data!.price)}.`);
    if (!file) return setErr(t("Add your payment screenshot."));
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setErr(t("The screenshot must be a PNG, JPG or WEBP image."));
    if (file.size > MAX) return setErr(t("The screenshot is larger than 1 MB. Crop it or take a smaller screenshot."));
    try { setDraft({ proof: await readAsDataUrl(file) }); window.scrollTo({ top: 0 }); }
    catch { setErr(t("Could not read the image. Please try another screenshot.")); }
  }
  async function confirmSend() {
    if (!draft) return; setBusy(true);
    try {
      await api.post("/pro/payments", { requestKey, provider, amount: Number(amount), proof: draft.proof });
      setDraft(null); toast(t("Sent. We will check your payment soon")); refresh();
    } catch (e2) { setDraft(null); setErr((e2 as Error).message); } finally { setBusy(false); }
  }
  async function dispute() { try { await api.post(`/pro/payments/${p!.id}/dispute`); toast(t("Re-review requested")); refresh(); } catch (e2) { toast((e2 as Error).message); } }

  if (data.isPro && (!data.proExpiresAt || Date.parse(data.proExpiresAt) > Date.now())) return (
    <section className="card mx-auto flex max-w-lg flex-col items-center gap-3 text-center border-ok">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-ok-soft text-2xl font-bold text-ok">✓</div>
      <h1 className="text-2xl">{t("You are Pro")}</h1><p className="text-muted">{t("Payment approved. All Pro features are unlocked.")}</p>
      {data.proExpiresAt && <p className="text-sm text-muted">{t("Pro expires")}: <span className="font-mono">{fmtWhen(data.proExpiresAt)}</span></p>}
      <Link href="/student/plan" className="btn-primary" onClick={() => refreshUser()}>{t("Get my PDF report")}</Link>
    </section>
  );
  return (
    <>
      <PageHead back="/student/plan" eyebrow="CareerNest Pro" title="Upgrade to Pro" />
      <section className="relative mx-auto mb-6 w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-ai/30 bg-card shadow-2xl shadow-brand/10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-br from-ai-soft via-brand-soft to-transparent opacity-80" />
        <Link href="/student/plan" className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-line bg-card/80 text-xl text-muted transition hover:bg-soft hover:text-ink" aria-label={t("Close")}>×</Link>
        <div className="relative flex flex-col items-center px-5 pb-6 pt-9 text-center sm:px-10 sm:pt-11">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-ai/25 bg-ai-soft text-2xl text-ai shadow-sm" aria-hidden="true">✧</div>
          <Pill tone="info">CareerNest Pro</Pill>
          <h2 className="mt-4 max-w-2xl text-balance text-2xl font-extrabold leading-tight sm:text-3xl">{t("Unlock your full career potential with Pro")}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">{t("Get more support for your next step with CareerNest Pro.")}</p>

          <ul className="mt-7 w-full space-y-4 rounded-2xl border border-line bg-card/90 p-4 text-left sm:p-6">
            {[
              ["Full PDF report", "Your career results and plan in a downloadable report."],
              ["Unlimited AI career coach and university advisor", "Get career and university guidance from Kip."],
              ["1-hour sessions with professional mentors", "Access professional mentor sessions."],
              ["Pro badge on your account", "Show your active Pro membership on your account."],
            ].map(([title, detail]) => <li key={title} className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok-soft text-sm font-bold text-ok" aria-hidden="true">✓</span>
              <div><b className="text-sm sm:text-base">{t(title)}</b><p className="mt-0.5 text-sm leading-5 text-muted">{t(detail)}</p></div>
            </li>)}
          </ul>

          <div className="mt-5 w-full rounded-2xl bg-gradient-to-r from-brand-deep to-brand p-5 text-left text-white shadow-lg sm:p-6">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">{t("CareerNest Pro plan")}</div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1"><strong className="text-3xl font-extrabold sm:text-4xl">{fmtKs(data.price)}</strong><span className="text-sm text-white/80">{t("for one month")}</span></div>
            <p className="mt-1 text-sm text-white/75">{t("One month of Pro access. Payment is reviewed before Pro is activated.")}</p>
          </div>
          <a href={`#${paymentSectionId}`} className="btn-primary mt-5 w-full justify-center bg-gradient-to-r from-ai to-brand py-3 text-base shadow-md hover:brightness-105 sm:w-auto sm:min-w-80">{t("Choose a payment method")} <span aria-hidden="true">→</span></a>
        </div>
      </section>
      {open ? (
        <section id={paymentSectionId} className="card flex scroll-mt-6 flex-col gap-3">
          <Pill tone={p!.status === "disputed" ? "warn" : "info"}>{t(p!.status === "disputed" ? "Re-review requested" : "Payment waiting for admin check")}</Pill>
          <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]"><dt className="font-semibold text-muted">{t("Paid to")}</dt><dd>{p!.accountName} · <span className="font-mono">{p!.accountNumber}</span></dd>
            <dt className="font-semibold text-muted">{t("Amount")}</dt><dd className="font-mono">{fmtKs(p!.amount)}</dd>
            <dt className="font-semibold text-muted">{t("Sent")}</dt><dd>{fmtWhen(p!.createdAt)}</dd></dl>
          {p!.proof && <img src={p!.proof} alt={t("Your payment screenshot")} className="max-w-[180px] rounded-lg border border-line" />}
          <p className="text-sm text-muted">{t("We check that the money arrived in our account, usually within 1 hour (9:00–21:00). Pro turns on automatically after approval.")}</p>
        </section>
      ) : draft && acc ? (
        <section id={paymentSectionId} className="card flex scroll-mt-6 flex-col gap-3">
          <h2 className="text-lg">{t("Confirm your payment")}</h2>
          <p className="text-sm text-muted">{t("Check the details. You cannot change them after sending.")}</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]"><dt className="font-semibold text-muted">{t("Paid to")}</dt><dd>{acc.label} · {acc.accountName} · <span className="font-mono">{acc.accountNumber}</span></dd>
            <dt className="font-semibold text-muted">{t("Amount")}</dt><dd className="font-mono">{fmtKs(Number(amount))}</dd></dl>
          <img src={draft.proof} alt={t("Your payment screenshot")} className="max-w-[180px] rounded-lg border border-line" />
          <div className="flex flex-wrap justify-end gap-3"><button className="btn-ghost" disabled={busy} onClick={() => setDraft(null)}>{t("Edit")}</button><button className="btn-primary" disabled={busy} onClick={confirmSend}>{t("Confirm & send")}</button></div>
        </section>
      ) : (
        <>
          {p?.status === "rejected" && <section className="card flex flex-col gap-2 border-bad"><Pill tone="bad">{t("Payment rejected")}</Pill><p><b>{t("Reason")}:</b> {p.reason}</p>
            <div className="flex flex-wrap items-center gap-2">{!p.disputeUsed && p.proof && <button className="btn-outline btn-sm" onClick={dispute}>{t("I did pay. Ask for a re-review")}</button>}<span className="text-sm text-muted">{t("Or send a new payment below.")}</span></div></section>}
          <section id={paymentSectionId} className="card flex scroll-mt-6 flex-col gap-3">
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
                <label className="label">{t("Amount you sent (Ks)")}<input className="input" type="number" inputMode="numeric" min={0} max={100_000_000} step={5000} value={amount} placeholder="5000"
                  onKeyDown={e => { if (["-", "+", "e", "E", ".", ","].includes(e.key)) e.preventDefault(); }}
                  onChange={e => { const value = e.target.value; setAmount(value === "" ? "" : String(Math.min(100_000_000, Math.max(0, Math.trunc(Number(value) || 0))))); }}
                  onBlur={() => { if (amount !== "") setAmount(String(Math.ceil(Number(amount) / 5000) * 5000)); }} /></label>
                <label className="label">{t("Payment screenshot (image, max 1 MB)")}<input className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
                <p className="text-xs text-muted">{t("A screenshot alone is not proof. We check that the money arrived in our account before turning on Pro. Screenshots are deleted 10 days after the decision.")}</p>
                {err && <p className="text-sm font-semibold text-bad">{err}</p>}
                <button className="btn-primary self-start" disabled={busy}>{t("Send for checking")}</button>
              </form>
            </>}
            {!data.accounts.length && <div className="rounded-xl border border-warn bg-warn-soft p-4 text-sm">
              <b>{t("Pro purchases are not set up yet.")}</b>
              <p className="mt-1">{t("An admin needs to add and enable a payment account before students can send a Pro payment. Please contact the CareerNest team.")}</p>
            </div>}
          </section>
        </>
      )}
    </>
  );
}
