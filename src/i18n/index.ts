import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import zh from "./locales/zh.json";
import id from "./locales/id.json";

export const LANGS = [
  { code: "en", label: "English", dir: "ltr", flag: "🇬🇧" },
  { code: "ar", label: "العربية", dir: "rtl", flag: "🇸🇦" },
  { code: "zh", label: "中文", dir: "ltr", flag: "🇨🇳" },
  { code: "id", label: "Bahasa Indonesia", dir: "ltr", flag: "🇮🇩" },
] as const;

const SUPPORTED = ["en", "ar", "zh", "id"];

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      zh: { translation: zh },
      id: { translation: id },
    },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: SUPPORTED,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    initImmediate: false,
  });
}

export function getSavedLanguage(): string {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("lang");
  if (saved && SUPPORTED.includes(saved)) return saved;
  const nav = navigator.language?.split("-")[0];
  return nav && SUPPORTED.includes(nav) ? nav : "en";
}

export function setAppLanguage(lng: string) {
  if (!SUPPORTED.includes(lng)) return;
  const meta = LANGS.find((l) => l.code === lng) ?? LANGS[0];
  if (typeof document !== "undefined") {
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
    localStorage.setItem("lang", meta.code);
  }
  if (i18n.language !== lng) i18n.changeLanguage(lng);
}

export default i18n;
