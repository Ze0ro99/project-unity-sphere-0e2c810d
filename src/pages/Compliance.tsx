import { useMemo, useState } from "react";
import { ScanFace, FileCheck2, AlertOctagon, Globe } from "lucide-react";
import { assessAml, num } from "@/lib/sovereign";

const JURISDICTIONS = [
  { code: "EU", label: "European Union (MiCAR)", sanctioned: false },
  { code: "GB", label: "United Kingdom (FCA)", sanctioned: false },
  { code: "AE", label: "United Arab Emirates (VARA)", sanctioned: false },
  { code: "SG", label: "Singapore (MAS)", sanctioned: false },
  { code: "XX", label: "Restricted / sanctioned", sanctioned: true },
];

const MICAR = [
  { article: "Art. 59 — Authorisation as CASP", status: "in-progress", note: "Dossier prepared, notified body engaged" },
  { article: "Art. 67 — Prudential safeguards", status: "met", note: "Φ ≥ 1.618 reserve solvency enforced on-chain" },
  { article: "Art. 68 — Operation of a trading platform", status: "met", note: "Order book rules, breakers and fee schedule published" },
  { article: "Art. 70 — Custody & segregation", status: "met", note: "Layer treasury vaults segregated per PiRC-207" },
  { article: "Art. 76 — Market abuse detection", status: "met", note: "PiRC-208 anomaly detector on every market" },
  { article: "Art. 88 — Inside information disclosure", status: "in-progress", note: "Governance disclosure feed wired to L6 Red" },
];

export default function Compliance() {
  const [notional, setNotional] = useState(1500);
  const [ageDays, setAgeDays] = useState(12);
  const [crossChain, setCrossChain] = useState(true);
  const [shielded, setShielded] = useState(false);
  const [jur, setJur] = useState("EU");
  const [velocity, setVelocity] = useState(8);

  const jurisdiction = JURISDICTIONS.find((j) => j.code === jur)!;
  const result = useMemo(
    () => assessAml({
      notionalPi: notional,
      counterpartyAgeDays: ageDays,
      crossChain,
      shielded,
      sanctionedJurisdiction: jurisdiction.sanctioned,
      velocity24h: velocity,
    }),
    [notional, ageDays, crossChain, shielded, jurisdiction, velocity],
  );

  const bandTone =
    result.band === "low" ? "text-green" : result.band === "medium" ? "text-yellow" : "text-red";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-panel/60 p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-green to-blue flex items-center justify-center text-black">
            <ScanFace size={20} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Compliance Gateway</h1>
            <p className="text-sm text-muted">
              PiRC-211.5 AML/KYC scoring applied to every order, bridge leg and payment, with EU MiCAR alignment tracking.
            </p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-panel/60 p-4 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2"><AlertOctagon size={15} className="text-gold" /> Transaction screening</h2>

          <label className="block text-xs text-muted">
            Notional · {num(notional)} π
            <input type="range" min={1} max={10000} step={1} value={notional}
              onChange={(e) => setNotional(Number(e.target.value))} className="mt-2 w-full accent-gold" />
          </label>
          <label className="block text-xs text-muted">
            Counterparty age · {ageDays} days
            <input type="range" min={0} max={365} value={ageDays}
              onChange={(e) => setAgeDays(Number(e.target.value))} className="mt-2 w-full accent-gold" />
          </label>
          <label className="block text-xs text-muted">
            24h velocity · {velocity} transfers
            <input type="range" min={0} max={80} value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))} className="mt-2 w-full accent-gold" />
          </label>
          <label className="block text-xs text-muted">
            Jurisdiction
            <select value={jur} onChange={(e) => setJur(e.target.value)}
              className="mt-1 w-full bg-panel2 border border-border rounded-md px-2 py-2 text-sm text-text">
              {JURISDICTIONS.map((j) => <option key={j.code} value={j.code}>{j.label}</option>)}
            </select>
          </label>
          <div className="flex gap-4 text-xs">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={crossChain} onChange={(e) => setCrossChain(e.target.checked)} className="accent-gold" />
              Cross-chain leg
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={shielded} onChange={(e) => setShielded(e.target.checked)} className="accent-gold" />
              Shielded (ZK) order
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-panel/60 p-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><FileCheck2 size={15} className="text-gold" /> Assessment</h2>
          <div className="flex items-end gap-4 mb-3">
            <div>
              <div className="text-[11px] uppercase text-muted">Risk score</div>
              <div className={`text-3xl font-bold mono ${bandTone}`}>{result.score}</div>
            </div>
            <div className="pb-1">
              <div className={`text-sm font-semibold uppercase mono ${bandTone}`}>{result.band}</div>
              <div className="text-[11px] text-muted">{result.requiresEdd ? "Enhanced due diligence required" : "Standard due diligence"}</div>
            </div>
          </div>
          <div className="h-2 rounded-full bg-panel2 overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-green via-yellow to-red" style={{ width: `${result.score}%` }} />
          </div>

          <ul className="text-xs space-y-1.5">
            {result.signals.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${s.hit ? "bg-red" : "bg-green"}`} />
                <span className={s.hit ? "text-text" : "text-muted"}>{s.label}</span>
                <span className="ml-auto mono text-muted">+{s.weight}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 pt-3 border-t border-border/60 text-xs text-muted">{result.micarArticle}</p>
          <div className={`mt-2 text-xs mono font-semibold ${result.band === "prohibited" ? "text-red" : "text-green"}`}>
            {result.band === "prohibited" ? "SETTLEMENT BLOCKED" : "SETTLEMENT PERMITTED"}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-panel/60 overflow-hidden">
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-panel2/40">
          <Globe size={15} className="text-gold" />
          <h2 className="text-sm font-semibold">EU MiCAR alignment</h2>
        </header>
        <table className="w-full text-xs">
          <tbody>
            {MICAR.map((m) => (
              <tr key={m.article} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2.5 mono">{m.article}</td>
                <td className="px-4 py-2.5 text-muted">{m.note}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`mono text-[10px] uppercase px-2 py-0.5 rounded ${
                    m.status === "met" ? "bg-green/15 text-green" : "bg-orange/15 text-orange"
                  }`}>{m.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
