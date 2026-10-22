import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { Spinner } from "@/components/ui";

const LIKERT = ["Not like me", "A little", "Somewhat", "Mostly", "Very like me"];
export default function Quiz() {
  const { j, set, content, ready } = useJourney(); const { lang, t } = usePrefs(); const [, go] = useLocation();
  const { isGuest } = useAuth();
  const [index, setIndex] = useState(() => Math.max(0, Math.min(19, Object.keys(j.answers).length)));
  const [showMissing, setShowMissing] = useState(false);
  const [help, setHelp] = useState<Record<number, string>>({});
  if (!ready || !content) return <Spinner />;
  if (!j.level) return <Redirect to="/student" />;
  const qs = content.questions; const q = qs[index];
  const missing = qs.filter(x => !j.answers[x.id]);

  function answer(v: number) {
    set(prev => ({ answers: { ...prev.answers, [q.id]: v } }));
    if (index < qs.length - 1) setTimeout(() => setIndex(i => Math.min(i + 1, qs.length - 1)), 220);
  }
  async function explain() {
    setHelp(h => ({ ...h, [q.id]: t("Thinking…") }));
    try { const { reply } = await api.post<{ reply: string }>("/ai/question", { questionId: q.id, lang }); setHelp(h => ({ ...h, [q.id]: reply })); }
    catch (e) { setHelp(h => ({ ...h, [q.id]: (e as Error).message })); }
  }
  if (showMissing && missing.length) return (
    <section className="card mx-auto flex w-full max-w-2xl flex-col gap-3 border-bad">
      <h1 className="text-xl">{missing.length} {t("question(s) still need an answer")}</h1>
      <ol className="list-decimal pl-5">{missing.map(m => <li key={m.id}><button className="text-left text-brand" onClick={() => { setIndex(qs.indexOf(m)); setShowMissing(false); }}>{lang === "my" ? m.my : m.en}</button></li>)}</ol>
      <button className="btn-primary self-end" onClick={() => { setIndex(qs.indexOf(missing[0])); setShowMissing(false); }}>{t("Review & complete")}</button>
    </section>
  );
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex justify-between text-sm"><span className="eyebrow">{t(q.area)}</span><span className="font-mono">{index + 1} / {qs.length}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-soft"><div className="h-full bg-brand transition-all" style={{ width: `${((index + 1) / qs.length) * 100}%` }} /></div>
      <div className="card flex flex-col gap-4">
        <h1 className="text-xl sm:text-2xl">{lang === "my" ? q.my : q.en}</h1>
        <div className="grid gap-2 sm:grid-cols-5" role="radiogroup">
          {LIKERT.map((label, k) => { const on = j.answers[q.id] === k + 1; return (
            <button key={label} role="radio" aria-checked={on} onClick={() => answer(k + 1)} className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold sm:flex-col ${on ? "border-brand bg-brand-soft" : "border-transparent bg-soft hover:border-brand"}`}>
              <span className={`grid h-7 w-7 place-items-center rounded-full font-mono ${on ? "bg-brand text-white" : "border border-line bg-card"}`}>{k + 1}</span>{t(label)}
            </button>); })}
        </div>
        <div className="flex flex-col items-start gap-2">
          {isGuest ? <p className="text-sm text-muted">{t("Create an account to use the AI coach and save your progress.")} <Link href="/register" className="font-semibold text-brand">{t("Create an account")}</Link></p> : <button className="btn-ghost btn-sm" onClick={explain}>✦ {t("Not sure what this means? Ask AI")}</button>}
          {help[q.id] && <p className="w-full whitespace-pre-wrap rounded-xl bg-brand-soft p-3 text-sm">{help[q.id]}</p>}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">{qs.map((x, k) => <button key={x.id} aria-label={`Question ${k + 1}`} onClick={() => setIndex(k)} className={`h-3.5 w-3.5 rounded-full border ${j.answers[x.id] ? "border-brand bg-brand" : "border-line bg-card"} ${k === index ? "ring-2 ring-brand ring-offset-2" : ""}`} />)}</div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-ghost" disabled={index === 0} onClick={() => setIndex(i => i - 1)}>{t("Previous")}</button>
        <span className="mr-auto text-sm text-muted">{qs.length - missing.length} / {qs.length}</span>
        {index < qs.length - 1 && <button className="btn-ghost" onClick={() => setIndex(i => i + 1)}>{t("Skip / Next")}</button>}
        <button className="btn-primary" onClick={() => (missing.length ? setShowMissing(true) : go("/student/results"))}>{t("Finish quiz")}</button>
      </div>
    </section>
  );
}
