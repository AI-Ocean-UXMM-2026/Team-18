import { Kip } from "@/components/Kip";
import { useEffect, useState } from "react";
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
  const [analyzing, setAnalyzing] = useState(false);
  const [index, setIndex] = useState(() => {
    const firstUnanswered = content?.questions.findIndex(question => !Number.isInteger(j.answers[question.id]) || j.answers[question.id] < 1 || j.answers[question.id] > 5) ?? -1;
    return firstUnanswered >= 0 ? firstUnanswered : 0;
  });
  const [showMissing, setShowMissing] = useState(false);
  const [help, setHelp] = useState<Record<number, string>>({});
  useEffect(() => {
    if (!analyzing) return;
    const timer = window.setTimeout(() => go("/student/results"), 2400);
    return () => window.clearTimeout(timer);
  }, [analyzing, go]);
  if (!ready || !content) return <Spinner />;
  if (!j.level) return <Redirect to="/student" />;
  if (analyzing) return (
    <section className="card mx-auto flex min-h-64 w-full max-w-3xl flex-col items-center justify-center gap-4 text-center" role="status" aria-live="polite">
      <span aria-hidden="true" className="motion-safe:animate-spin h-10 w-10 rounded-full border-4 border-brand/20 border-t-brand" />
      <p className="text-lg font-semibold">{t("Analyzing your answers")}…</p>
    </section>
  );
  const qs = content.questions; const q = qs[index];
  const missing = qs.filter(x => !Number.isInteger(j.answers[x.id]) || j.answers[x.id] < 1 || j.answers[x.id] > 5);

  function answer(v: number) {
    setShowMissing(false);
    set(prev => ({ answers: { ...prev.answers, [q.id]: v } }));
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
    setAnalyzing(true);
  }
  async function explain() {
    setHelp(h => ({ ...h, [q.id]: t("Thinking…") }));
    try { const { reply } = await api.post<{ reply: string }>("/ai/question", { questionId: q.id, lang }); setHelp(h => ({ ...h, [q.id]: reply })); }
    catch (e) { setHelp(h => ({ ...h, [q.id]: (e as Error).message })); }
  }
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/student" className="text-sm font-semibold text-muted">← {t("Back to dashboard")}</Link><span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{qs.length - missing.length} / {qs.length} {t("Answered")}</span></div>
      <div className="card flex items-center gap-3 !p-3"><div className="flex-1"><p className="mb-2 text-sm font-semibold">{t("Question")} {index + 1} / {qs.length} · {t(q.area)}</p><div className="h-1.5 overflow-hidden rounded-full bg-soft"><div className="h-full bg-brand transition-all" style={{ width: `${((qs.length - missing.length) / qs.length) * 100}%` }} /></div></div><Kip size={72} mood="studying" /></div>
      <div className="card w-full min-w-0 !p-2 sm:!p-3">
        <div role="group" aria-label={t("Quiz questions")} className="flex gap-1 overflow-x-auto py-0.5">{qs.map((x, k) => <button key={x.id} aria-label={`Question ${k + 1}`} aria-current={k === index ? "step" : undefined} onClick={() => setIndex(k)} className={`h-7 w-7 shrink-0 rounded-md border text-[11px] font-semibold ${j.answers[x.id] ? "border-brand bg-brand text-on-brand" : "border-line bg-card"} ${k === index ? "ring-2 ring-brand ring-offset-1" : ""}`}>{k + 1}</button>)}</div>
      </div>
      <div className="card quiz-sheet flex flex-col gap-3 !p-4 sm:!p-5">
        <span className="self-start rounded-full bg-ai-soft px-3 py-1 text-xs font-semibold text-ai">{t(q.area)}</span><h1 className="text-xl leading-tight sm:text-2xl">{lang === "my" ? q.my : q.en}</h1>
        <div className="grid gap-2" role="radiogroup">
          {LIKERT.map(({ label, value }) => { const on = j.answers[q.id] === value; return (
            <button key={label} role="radio" aria-checked={on} onClick={() => answer(value)} className={`quiz-option flex min-h-12 items-center justify-start gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${on ? "border-brand bg-brand-soft" : "border-line bg-card hover:border-brand"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono ${on ? "bg-brand text-on-brand" : "border border-line bg-card"}`}>{value}</span><span className="text-left">{t(label)}</span>
            </button>); })}
        </div>
        <div className="flex flex-col items-start gap-1">
          {isGuest ? <p className="text-xs leading-5 text-muted">{t("Create an account to use the AI coach and save your progress.")} <Link href="/register" className="font-semibold text-brand">{t("Create an account")}</Link></p> : <button className="btn-ghost btn-sm" onClick={explain}>✦ {t("Not sure what this means? Ask AI")}</button>}
          {help[q.id] && <p className="w-full whitespace-pre-wrap rounded-xl bg-brand-soft p-3 text-sm">{help[q.id]}</p>}
        </div>
      </div>

      {showMissing && missing.length > 0 && <p role="alert" className="text-sm text-bad">{t("Answer every question before finishing the quiz.")}</p>}
      <div className="sticky bottom-2 z-10 flex items-center justify-between gap-3 rounded-xl border border-line bg-card/95 p-2 shadow-md backdrop-blur-sm">
        <button className="btn-outline min-w-0 flex-1 border-brand/20 bg-brand-soft px-2 text-xs text-brand hover:border-brand/40 hover:bg-brand/15 sm:w-48 sm:flex-none sm:px-4 sm:text-sm" disabled={index === 0} onClick={() => { setShowMissing(false); setIndex(i => i - 1); }}>{t("Previous")}</button>
        <button className="btn-primary min-w-0 flex-1 px-2 text-xs sm:w-48 sm:flex-none sm:px-4 sm:text-sm" onClick={goNext}>{index === qs.length - 1 ? t("Finish") : t("Next")}</button>
      </div>
    </section>
  );
}
