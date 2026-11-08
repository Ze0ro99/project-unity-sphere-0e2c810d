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
const RTL = new Set<Lang>(["ar"]);
// Only fully translated locales may be selected. Partial dictionaries stay visible as disabled options.
const SUPPORTED = new Set<string>(["en", "ar", "zh", "id"]);

function safeStoredLanguage(): Lang | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && SUPPORTED.has(saved) ? saved as Lang : null;
  } catch {
    return null;
  }
}

function fromLocale(locale: string | undefined): Lang | null {
  const code = (locale ?? "").toLowerCase().split(/[-_]/)[0];
  return SUPPORTED.has(code) ? code as Lang : null;
}

function detect(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = safeStoredLanguage();
  if (saved) return saved;
  for (const locale of window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language]) {
    const detected = fromLocale(locale);
    if (detected) return detected;
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detect());

  useEffect(() => {
    const apply = (next: Lang) => {
      const dir = RTL.has(next) ? "rtl" : "ltr";
      document.documentElement.lang = next;
      document.documentElement.dir = dir;
      document.documentElement.dataset.locale = next;
      document.body?.setAttribute("dir", dir);
    };
    apply(lang);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = fromLocale(event.newValue ?? undefined);
      if (next) setLangState(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [lang]);

  const value = useMemo<Ctx>(() => {
    const setLang = (next: Lang) => {
      if (!SUPPORTED.has(next)) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Keep the in-memory selection when storage is blocked.
      }
      setLangState(next);
    };
    const dict = messages[lang] ?? messages.en;
    const fallback = messages.en;
    const t = (key: string, vars?: Record<string, string | number>) => {
      let value = dict[key] ?? fallback[key] ?? key;
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          value = value.replace(new RegExp(`\\{\\s*${name}\\s*\\}`, "g"), String(replacement));
        }
      }
      return value;
    };
    return { lang, setLang, t, dir: RTL.has(lang) ? "rtl" : "ltr" };
  }, [lang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): Ctx {
  const context = useContext(I18nCtx);
  if (!context) throw new Error("useI18n outside I18nProvider");
  return context;
}

export const LANGS: { code: Lang; label: string; complete: boolean }[] = [
  { code: "en", label: "English", complete: true },
  { code: "ar", label: "العربية", complete: true },
  { code: "fr", label: "Français", complete: false },
  { code: "es", label: "Español", complete: false },
  { code: "de", label: "Deutsch", complete: false },
  { code: "pt", label: "Português", complete: false },
  { code: "zh", label: "中文", complete: true },
  { code: "id", label: "Bahasa Indonesia", complete: true },
];
