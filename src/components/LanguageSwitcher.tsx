import { Globe } from "lucide-react";
import { LANGS, useI18n } from "@/i18n";
import type { Lang } from "@/i18n/messages";

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted border border-border rounded-md px-2 py-1.5 hover:bg-panel2">
      <Globe size={14} aria-hidden />
      <span className="sr-only">{t("nav.language")}</span>
      <select
        aria-label={t("nav.language")}
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
        className="max-w-[112px] sm:max-w-none bg-transparent outline-none mono text-xs"
      >
        {LANGS.map((language) => (
          <option key={language.code} value={language.code} disabled={!language.complete} className="bg-panel text-text">
            {language.complete ? language.label : `${language.label} — translation incomplete`}
          </option>
        ))}
      </select>
    </label>
  );
}
