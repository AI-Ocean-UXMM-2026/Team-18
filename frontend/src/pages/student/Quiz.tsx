import { Kip } from "@/components/Kip";
import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useJourney } from "@/lib/journey";
import { usePrefs } from "@/lib/prefs";
import { Spinner } from "@/components/ui";

const LIKERT = [
  { label: "Very like me", value: 5 },
  { label: "Mostly", value: 4 },
  { label: "Somewhat", value: 3 },
  { label: "A little", value: 2 },
  { label: "Not like me", value: 1 },
];
export default function Quiz() {
  const { j, set, content, ready } = useJourney(); const { lang, t } = usePrefs(); const [, go] = useLocation();
  const { isGuest } = useAuth();
  const [index, setIndex] = useState(() => {
    const firstUnanswered = content?.questions.findIndex(question => !Number.isInteger(j.answers[question.id]) || j.answers[question.id] < 1 || j.answers[question.id] > 5) ?? -1;
    return firstUnanswered >= 0 ? firstUnanswered : 0;
  });
  const [showMissing, setShowMissing] = useState(false);
  const [help, setHelp] = useState<Record<number, string>>({});
  if (!ready || !content) return <Spinner />;
  if (!j.level) return <Redirect to="/student" />;
  const qs = content.questions; const q = qs[index];
  const missing = qs.filter(x => !Number.isInteger(j.answers[x.id]) || j.answers[x.id] < 1 || j.answers[x.id] > 5);

  function answer(v: number) {
    setShowMissing(false);
    set(prev => ({ answers: { ...prev.answers, [q.id]: v } }));
    if (index < qs.length - 1) setTimeout(() => setIndex(i => Math.min(i + 1, qs.length - 1)), 220);
  }
  function goNext() {
    if (index < qs.length - 1) {
      setShowMissing(false);
      setIndex(i => i + 1);
      return;
    }
    if (missing.length) {
      setShowMissing(true);
      setIndex(qs.indexOf(missing[0]));
      return;
    }
    set({ quizCompleted: true });
    go("/student/results");
  }
  async function explain() {
    setHelp(h => ({ ...h, [q.id]: t("Thinking…") }));
    try { const { reply } = await api.post<{ reply: string }>("/ai/question", { questionId: q.id, lang }); setHelp(h => ({ ...h, [q.id]: reply })); }
    catch (e) { setHelp(h => ({ ...h, [q.id]: (e as Error).message })); }
  }
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/student" className="text-sm font-semibold text-muted">← {t("Back to dashboard")}</Link><span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{qs.length - missing.length} / {qs.length} {t("Answered")}</span></div>
      <div className="card flex items-center gap-4"><div className="flex-1"><p className="mb-3 text-sm font-semibold">{t("Question")} {index + 1} / {qs.length} · {t(q.area)}</p><div className="h-2 overflow-hidden rounded-full bg-soft"><div className="h-full bg-brand transition-all" style={{ width: `${((qs.length - missing.length) / qs.length) * 100}%` }} /></div></div><Kip size={75} /></div>
      <div className="flex gap-1.5 overflow-x-auto pb-2">{qs.map((x, k) => <button key={x.id} aria-label={`Question ${k + 1}`} onClick={() => setIndex(k)} className={`h-7 w-7 shrink-0 rounded-md border text-xs font-semibold ${j.answers[x.id] ? "border-brand bg-brand text-on-brand" : "border-line bg-card"} ${k === index ? "ring-2 ring-brand ring-offset-2" : ""}`}>{k + 1}</button>)}</div>
      <div className="card quiz-sheet flex flex-col gap-5">
        <span className="self-start rounded-full bg-ai-soft px-3 py-1 text-xs font-semibold text-ai">{t(q.area)}</span><h1 className="min-h-[3.75em] text-xl leading-tight sm:text-2xl">{lang === "my" ? q.my : q.en}</h1>
        <div className="grid gap-3" role="radiogroup">
          {LIKERT.map(({ label, value }) => { const on = j.answers[q.id] === value; return (
            <button key={label} role="radio" aria-checked={on} onClick={() => answer(value)} className={`quiz-option flex min-h-16 items-center justify-start gap-2 rounded-xl border-2 p-3 text-sm font-semibold  ${on ? "border-brand bg-brand-soft" : "border-line bg-card hover:border-brand"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono ${on ? "bg-brand text-on-brand" : "border border-line bg-card"}`}>{value}</span><span className="text-left">{t(label)}</span>
            </button>); })}
        </div>
        <div className="flex flex-col items-start gap-2">
          {isGuest ? <p className="text-sm text-muted">{t("Create an account to use the AI coach and save your progress.")} <Link href="/register" className="font-semibold text-brand">{t("Create an account")}</Link></p> : <button className="btn-ghost btn-sm" onClick={explain}>✦ {t("Not sure what this means? Ask AI")}</button>}
          {help[q.id] && <p className="w-full whitespace-pre-wrap rounded-xl bg-brand-soft p-3 text-sm">{help[q.id]}</p>}
        </div>
      </div>

      {showMissing && missing.length > 0 && <p role="alert" className="text-sm text-bad">{t("Answer every question before finishing the quiz.")}</p>}
      <div className="flex items-center justify-between gap-3">
        <button className="btn-ghost" disabled={index === 0} onClick={() => { setShowMissing(false); setIndex(i => i - 1); }}>{t("Previous")}</button>
        <button className="btn-primary" onClick={goNext}>{t("Next")}</button>
      </div>
    </section>
  );
}
