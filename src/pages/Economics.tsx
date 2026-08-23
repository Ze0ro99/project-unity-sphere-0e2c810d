import { useEffect, useMemo, useState } from "react";
import { LineChart, Download, Activity, AlertTriangle, Gauge } from "lucide-react";
import {
  DEFAULT_SCENARIOS,
  simulate,
  downloadCSV,
  liveSnapshot,
  type SimulationScenario,
  type ScenarioOutcome,
} from "@/lib/economics";

const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function Spark({ outcome, field, color }: { outcome: ScenarioOutcome; field: "phi" | "ippr" | "collateralRatio"; color: string }) {
  const pts = outcome.series.map((s) => s[field] as number);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const w = 800;
  const h = 160;
  const d = pts
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * w},${h - ((v - min) / span) * (h - 12) - 6}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" preserveAspectRatio="none" role="img" aria-label={`${field} projection`}>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function Economics() {
  const [scenarios] = useState<SimulationScenario[]>(DEFAULT_SCENARIOS);
  const [selected, setSelected] = useState(DEFAULT_SCENARIOS[0].id);
  const [horizon, setHorizon] = useState(365);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const outcomes = useMemo(
    () => scenarios.map((s) => simulate({ ...s, durationEpochs: horizon })),
    [scenarios, horizon],
  );
  const active = outcomes.find((o) => o.scenario.id === selected) ?? outcomes[0];
  const live = useMemo(() => liveSnapshot(tick), [tick]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-panel/60 p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-green flex items-center justify-center text-black">
            <LineChart size={20} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Economic Simulation Dashboard</h1>
            <p className="text-sm text-muted">
              Merged from <span className="mono">feat/economic-dashboard</span> — reflexive constraint Φ = (Lₙ · IPPR) / QWF,
              scenario modelling and CSV export.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "QWF", value: fmt(live.qwf) },
          { label: "IPPR (USD)", value: `$${fmt(live.ippr)}` },
          { label: "Network velocity", value: live.velocity.toFixed(4) },
          { label: "Φ reflexive", value: live.phi.toFixed(4) },
          { label: "Collateral ratio", value: `${(live.collateralRatio * 100).toFixed(1)}%` },
          { label: "Minting rate", value: `${(live.mintingRate * 100).toFixed(2)}%` },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-panel/60 p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted">{m.label}</div>
            <div className="mono text-lg mt-1">{m.value}</div>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="rounded-xl border border-border bg-panel/60 p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Gauge size={15} className="text-gold" /> Scenario selection</h2>
          {scenarios.map((s) => {
            const o = outcomes.find((x) => x.scenario.id === s.id)!;
            const on = s.id === selected;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`w-full text-left rounded-lg border p-3 transition ${on ? "border-gold bg-panel2" : "border-border hover:bg-panel2/60"}`}
              >
                <div className="flex items-center justify-between text-sm font-semibold">
                  {s.name}
                  <span className={`mono text-xs ${o.final.phi >= 1 ? "text-green" : "text-red"}`}>Φ {o.final.phi.toFixed(3)}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted mono">
                  QWF {(s.qwfGrowth * 100).toFixed(0)}% · IPPR {(s.ipprAdjustment * 100).toFixed(0)}% · σ {(s.oracleVolatility * 100).toFixed(0)}%
                </div>
              </button>
            );
          })}
          <label className="block text-xs text-muted pt-1">
            Horizon · {horizon} epochs
            <input type="range" min={30} max={1095} step={5} value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))} className="mt-2 w-full accent-gold" />
          </label>
          <button
            onClick={() => downloadCSV(active)}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-border bg-panel2 hover:bg-panel px-3 py-2 text-sm"
          >
            <Download size={14} /> Export CSV
          </button>
        </section>

        <section className="lg:col-span-2 rounded-xl border border-border bg-panel/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Activity size={15} className="text-green" /> {active.scenario.name} projection</h2>
            <span className="text-[11px] mono text-muted">95% CI Φ [{active.ci95[0]}, {active.ci95[1]}]</span>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted mb-1">Φ reflexive constraint</div>
            <Spark outcome={active} field="phi" color="#e0b23c" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">IPPR (USD)</div>
              <Spark outcome={active} field="ippr" color="#3ec98c" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">Collateral ratio</div>
              <Spark outcome={active} field="collateralRatio" color="#4d8ff5" />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-panel/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-muted">
            <tr className="border-b border-border">
              {["Scenario", "Final Φ", "Final IPPR", "Min collateral", "Max drawdown", "Breaker epochs", "Verdict"].map((h) => (
                <th key={h} className="text-left font-medium px-4 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="mono text-xs">
            {outcomes.map((o) => {
              const safe = o.minCollateral >= 0.8 && o.final.phi >= 0.9;
              return (
                <tr key={o.scenario.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2 whitespace-nowrap">{o.scenario.name}</td>
                  <td className="px-4 py-2">{o.final.phi.toFixed(4)}</td>
                  <td className="px-4 py-2">${fmt(o.final.ippr)}</td>
                  <td className="px-4 py-2">{(o.minCollateral * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">{(o.maxDrawdown * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">{o.breakerEpochs}</td>
                  <td className={`px-4 py-2 ${safe ? "text-green" : "text-red"}`}>
                    {safe ? "SOLVENT" : "MITIGATION REQUIRED"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-border bg-panel/60 p-4 text-xs text-muted flex gap-2">
        <AlertTriangle size={14} className="text-yellow shrink-0 mt-0.5" />
        <p>
          Projections are deterministic (seeded PRNG) so exported CSVs reproduce the charts exactly. PiRC-208 marks an epoch as
          breached when velocity deviates more than 15% from its 7-epoch median; minting is throttled proportionally to Φ below parity.
        </p>
      </section>
    </div>
  );
}
