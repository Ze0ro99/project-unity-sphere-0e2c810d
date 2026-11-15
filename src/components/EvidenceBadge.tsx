import { useI18n } from "@/i18n";
import { evidenceAge, type Evidence } from "@/lib/evidence";

const TONE: Record<Evidence, string> = {
  VERIFIED: "border-green/40 text-green",
  OBSERVED: "border-blue/40 text-blue",
  SIMULATED: "border-orange/40 text-orange",
  UNKNOWN: "border-border text-muted",
};

export default function EvidenceBadge({ level, observedAt, source }: { level: Evidence; observedAt?: number | null; source?: string }) {
  const { t } = useI18n();
  const extra = [source, observedAt ? `${t("evidence.age")} ${evidenceAge(observedAt)}` : ""].filter(Boolean).join(" · ");
  return (
    <span data-evidence={level} title={t(`evidence.${level}.hint`)}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] mono font-semibold tracking-wide ${TONE[level]}`}>
      {t(`evidence.${level}`)}{extra && <span className="font-normal opacity-80">· {extra}</span>}
    </span>
  );
}
