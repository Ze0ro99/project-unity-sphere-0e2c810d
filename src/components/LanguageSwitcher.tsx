import { Globe } from "lucide-react";
import { LANGS, useI18n } from "@/i18n";
import type { Lang } from "@/i18n/messages";

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="hidden sm:flex items-center gap-1.5 text-xs text-muted border border-border rounded-md px-2 py-1.5 hover:bg-panel2">
      <Globe size={14} aria-hidden />
      <span className="sr-only">{t("nav.language")}</span>
      <select
        aria-label={t("nav.language")}
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="bg-transparent outline-none mono text-xs"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code} className="bg-panel text-text">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
