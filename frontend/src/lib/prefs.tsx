// Language and color theme preferences, remembered in this browser.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translate, type Language } from "@/lib/i18n";

const KEY = "careernet_lang";
const THEME_KEY = "careernet_theme";
export type ColorTheme = "light" | "dark";
type Prefs = { lang: Language; setLang: (l: Language) => void; theme: ColorTheme; setTheme: (theme: ColorTheme) => void; t: (s: string) => string };
const Ctx = createContext<Prefs | null>(null);
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => { try { return (localStorage.getItem(KEY) as Language) || "en"; } catch { return "en"; } });
  const [theme, setTheme] = useState<ColorTheme>(() => { try { return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; } });
  useEffect(() => { try { localStorage.setItem(KEY, lang); } catch { /* ignore */ } document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#101a2d" : "#f7f9fc");
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);
  return <Ctx.Provider value={{ lang, setLang, theme, setTheme, t: s => translate(s, lang) }}>{children}</Ctx.Provider>;
}
export function usePrefs() { const v = useContext(Ctx); if (!v) throw new Error("PrefsProvider missing"); return v; }
