import { useId, useState, type InputHTMLAttributes } from "react";
import { usePrefs } from "@/lib/prefs";

export default function PasswordInput({ id, className = "input", disabled, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { t } = usePrefs();
  return <span className="relative block w-full">
    <input {...props} id={inputId} disabled={disabled} type={visible ? "text" : "password"} className={`${className} w-full pr-12`} />
    <button type="button" disabled={disabled} aria-label={t(visible ? "Hide password" : "Show password")} aria-pressed={visible} aria-controls={inputId} title={t(visible ? "Hide password" : "Show password")} className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-brand focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed" onClick={() => setVisible(value => !value)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {!visible && <path d="m3 3 18 18" />}
      </svg>
    </button>
  </span>;
}
