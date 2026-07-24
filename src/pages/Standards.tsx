import { Shield, CheckCircle2, FileCode2, Scale, Lock, Activity, Gauge, Layers } from "lucide-react";
import { useI18n } from "@/i18n";

type Status = "enforced" | "wired" | "documented" | "shipped";

const STANDARDS: { id: string; icon: any; status: Status }[] = [
  { id: "PiRC-101", icon: Scale, status: "enforced" },
  { id: "PiRC-207", icon: Layers, status: "enforced" },
  { id: "PiRC-215", icon: Activity, status: "enforced" },
  { id: "PiRC-227", icon: Gauge, status: "enforced" },
  { id: "PiRC-251", icon: Shield, status: "enforced" },
  { id: "PiRC-260", icon: FileCode2, status: "documented" },
  { id: "PiRC-800", icon: Lock, status: "shipped" },
];

const PROTOCOLS: { v: string; state: "supported" | "forward-compatible" }[] = [
  { v: "v21", state: "supported" },
  { v: "v22", state: "supported" },
  { v: "v23", state: "supported" },
  { v: "v25", state: "forward-compatible" },
  { v: "v26", state: "forward-compatible" },
  { v: "v27", state: "forward-compatible" },
  { v: "v28", state: "forward-compatible" },
];

const CHECK_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

function statusToneKey(s: Status) {
  return s === "enforced"
    ? "bg-emerald-500/10 text-emerald-400"
    : s === "wired"
    ? "bg-sky-500/10 text-sky-400"
    : s === "shipped"
    ? "bg-emerald-500/10 text-emerald-400"
    : "bg-amber-500/10 text-amber-400";
}

export default function Standards() {
  const { t, lang } = useI18n();
  return (
    <div className="space-y-6" key={lang}>
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t("standards.title")}</h1>
          <p className="text-sm text-muted mt-1">{t("standards.subtitle")}</p>
        </div>
        <a
          href="https://github.com/Ze0ro99/PiRC/blob/main/contracts/pidex_amm/DEPLOY.md"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 rounded-md border border-border text-sm hover:bg-panel2 mono"
        >
          {t("standards.deployLink")}
        </a>
      </header>

      <section className="grid md:grid-cols-2 gap-3">
        {STANDARDS.map((s) => (
          <div key={s.id} className="p-4 rounded-lg border border-border bg-panel/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-panel2 flex items-center justify-center">
                <s.icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="mono text-xs text-muted">{s.id}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${statusToneKey(s.status)}`}>
                    {t(`common.status.${s.status}`)}
                  </span>
                </div>
                <div className="font-medium">{t(`std.${s.id}.title`)}</div>
              </div>
            </div>
            <p className="text-sm text-muted mt-2">{t(`std.${s.id}.desc`)}</p>
          </div>
        ))}
      </section>

      <section className="p-4 rounded-lg border border-border bg-panel/60">
        <h2 className="font-semibold mb-3">{t("standards.protocolMatrix")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-xs mono">
          {PROTOCOLS.map((p) => (
            <div key={p.v} className="p-2 rounded border border-border bg-panel2/40">
              <div className="text-base font-bold">{p.v}</div>
              <div className={`text-[10px] uppercase ${p.state === "supported" ? "text-emerald-400" : "text-sky-400"}`}>
                {t(p.state === "supported" ? "common.status.supported" : "common.status.forward")}
              </div>
              <div className="text-muted mt-1">{t(`proto.${p.v}`)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="p-4 rounded-lg border border-border bg-panel/60">
        <h2 className="font-semibold mb-3">{t("standards.checklist")}</h2>
        <ul className="grid md:grid-cols-2 gap-2 text-sm">
          {CHECK_IDS.map((i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <span>{t(`check.${i}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="p-4 rounded-lg border border-border bg-panel/60">
        <h2 className="font-semibold mb-2">{t("standards.regulatory")}</h2>
        <p className="text-sm text-muted">{t("standards.regulatoryBody")}</p>
      </section>
    </div>
  );
}
