// Language (English / Myanmar) — one at a time, remembered in this browser.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translate, type Language } from "@/lib/i18n";

const KEY = "pathfinder_lang";
type Prefs = { lang: Language; setLang: (l: Language) => void; t: (s: string) => string };
const Ctx = createContext<Prefs | null>(null);
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => { try { return (localStorage.getItem(KEY) as Language) || "en"; } catch { return "en"; } });
  useEffect(() => { try { localStorage.setItem(KEY, lang); } catch { /* ignore */ } document.documentElement.lang = lang; }, [lang]);
  return <Ctx.Provider value={{ lang, setLang, t: s => translate(s, lang) }}>{children}</Ctx.Provider>;
}
export function usePrefs() { const v = useContext(Ctx); if (!v) throw new Error("PrefsProvider missing"); return v; }
