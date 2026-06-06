import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
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

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
        zh: { translation: zh },
        id: { translation: id },
      },
      fallbackLng: "en",
      supportedLngs: ["en", "ar", "zh", "id"],
      interpolation: { escapeValue: false },
      detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
    });
}

if (typeof document !== "undefined") {
  const apply = (lng: string) => {
    const meta = LANGS.find((l) => l.code === lng) ?? LANGS[0];
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
  };
  apply(i18n.language || "en");
  i18n.on("languageChanged", apply);
}

export default i18n;
