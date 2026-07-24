import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { messages, Lang } from "./messages";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
};

const I18nCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "pirc.lang";
const RTL: Lang[] = ["ar"];

function detect(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && saved in messages) return saved;
  const nav = window.navigator.language.slice(0, 2).toLowerCase();
  if (nav === "ar" || nav === "zh" || nav === "id") return nav as Lang;
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(detect());
  }, []);

  useEffect(() => {
    const dir = RTL.includes(lang) ? "rtl" : "ltr";
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dir);
  }, [lang]);

  const value = useMemo<Ctx>(() => {
    const setLang = (l: Lang) => {
      window.localStorage.setItem(STORAGE_KEY, l);
      setLangState(l);
    };
    const dict = messages[lang] ?? messages.en;
    const fallback = messages.en;
    const t = (key: string, vars?: Record<string, string | number>) => {
      let s = (dict as Record<string, string>)[key] ?? (fallback as Record<string, string>)[key] ?? key;
      if (vars) for (const k of Object.keys(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      return s;
    };
    return { lang, setLang, t, dir: RTL.includes(lang) ? "rtl" : "ltr" };
  }, [lang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n outside I18nProvider");
  return c;
}

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "id", label: "Bahasa" },
];
