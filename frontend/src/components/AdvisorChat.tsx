// Chat box for /ai/career and /ai/advisor. Replies only in the chosen language.
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { api, ApiError, type ChatMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";

type Props = { title: string; subtitle: string; endpoint: string; payload: Record<string, unknown>; suggestions: string[] };
export function AdvisorChat({ title, subtitle, endpoint, payload, suggestions }: Props) {
  const { lang, t } = usePrefs();
  const { refresh, isGuest } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [needPro, setNeedPro] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.scrollTo(0, box.current.scrollHeight); }, [messages, busy]);

  if (isGuest) return (
    <section className="card ai-surface flex flex-col gap-3">
      <h2 className="ai-heading text-lg">✦ {t(title)}</h2>
      <p className="text-sm text-muted">{t("Create an account to use the AI coach and save your progress.")}</p>
      <Link href="/register" className="btn-primary btn-sm self-start">{t("Create an account")}</Link>
    </section>
  );

  async function ask(text: string) {
    text = text.trim(); if (!text || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const { reply } = await api.post<{ reply: string }>(endpoint, { ...payload, lang, messages: next });
      setMessages([...next, { role: "assistant", content: reply }]); refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) setNeedPro(true);
      setMessages([...next, { role: "assistant", content: e instanceof Error ? e.message : t("Sorry, something went wrong. Please try again.") }]);
    } finally { setBusy(false); }
  }
  return (
    <section className="card ai-surface flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2"><h2 className="ai-heading text-lg">✦ {t(title)}</h2>{messages.length > 0 && <button className="ai-heading text-xs font-semibold" onClick={() => setMessages([])}>{t("Clear")}</button>}</div>
      <p className="text-sm text-muted">{t(subtitle)}</p>
      {(messages.length > 0 || busy) && (
        <div ref={box} className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {messages.map((m, i) => <div key={i} className={`max-w-[88%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "self-end bg-brand text-white" : "ai-soft self-start"}`}>{m.content}</div>)}
          {busy && <div className="ai-soft self-start rounded-xl px-3 py-2 text-sm text-muted">{t("Thinking…")}</div>}
        </div>
      )}
      {needPro && <Link href="/student/pro" className="btn-primary btn-sm self-start">{t("Go Pro")}</Link>}
      {messages.length === 0 && <div className="flex flex-wrap gap-2">{suggestions.map(s => <button key={s} className="btn-outline btn-sm" onClick={() => ask(t(s))}>{t(s)}</button>)}</div>}
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); ask(input); }}>
        <input className="input" value={input} onChange={e => setInput(e.target.value)} placeholder={t("Type your question")} />
        <button className="btn-primary" disabled={busy}>{t("Ask")}</button>
      </form>
    </section>
  );
}
