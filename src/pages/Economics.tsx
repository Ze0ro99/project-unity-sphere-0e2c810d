import { useEffect, useMemo, useState } from "react";
import { LineChart, Download, Activity, AlertTriangle, Gauge } from "lucide-react";
import {
  DEFAULT_SCENARIOS,
  simulate,
  downloadCSV,
  simulationSnapshot,
  ipprFromSpot,
  BASE_IPPR,
  type SimulationScenario,
  type ScenarioOutcome,
} from "@/lib/economics";
import { useMarketIndex } from "@/lib/market-index";


const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();
  const [scenarios] = useState<SimulationScenario[]>(DEFAULT_SCENARIOS);
  const [selected, setSelected] = useState(DEFAULT_SCENARIOS[0].id);
  const [horizon, setHorizon] = useState(365);
  const [tick, setTick] = useState(0);

  const market = useMarketIndex();
  const spot = market.index?.price ?? NaN;
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const liveOk = market.index?.trusted === true
    && (market.index?.sources ?? 0) >= 3
    && Number.isFinite(spot) && spot > 0;
  const ipprLive = liveOk ? ipprFromSpot(spot) : NaN;
  const scenarioBaseIppr = liveOk ? ipprLive : BASE_IPPR;
  const outcomes = useMemo(
    () => scenarios.map((s) => simulate({ ...s, durationEpochs: horizon }, "market-rebased", scenarioBaseIppr)),
    [scenarios, horizon, scenarioBaseIppr],
  );
  const active = outcomes.find((o) => o.scenario.id === selected) ?? outcomes[0];
  const simulation = useMemo(() => simulationSnapshot(tick), [tick]);
  const phiSimulation = liveOk && simulation.qwf > 0
    ? (simulation.velocity * ipprLive) / simulation.qwf
    : NaN;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-panel/60 p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-green flex items-center justify-center text-black">
            <LineChart size={20} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("nav.economics")}</h1>
            <p className="text-sm text-muted">
              {t("economics.formulaDescription")}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] mono text-muted">
          <span className={liveOk ? "text-green" : "text-red"}>
            ● π/USDT index {liveOk ? `${spot.toFixed(6)} USDT` : "unavailable"}
          </span>
          <span>{market.index?.sources ?? 0}/{market.index?.totalSources ?? 0} venues</span>
          <span>deviation {(market.index?.deviationBps ?? 0).toFixed(1)} bps</span>
          <span>24h {market.index?.changePct != null ? `${market.index.changePct.toFixed(2)}%` : "—"}</span>
          <span>synced {market.ts ? new Date(market.ts).toLocaleTimeString() : "—"}</span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: t("economics.liveIppr"), value: liveOk ? `${fmt(ipprLive, 2)}` : "UNAVAILABLE — ORACLE GATE" },
          { label: t("economics.simulationQwf"), value: fmt(simulation.qwf) },
          { label: t("economics.simulationVelocity"), value: simulation.velocity.toFixed(4) },
          { label: t("economics.simulationPhi"), value: Number.isFinite(phiSimulation) ? phiSimulation.toFixed(6) : "—" },
          { label: t("economics.qwfPending"), value: "—" },
          { label: t("economics.velocityPending"), value: "—" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-panel/60 p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted">{m.label}</div>
            <div className="mono text-lg mt-1">{m.value}</div>
          </div>
        ))}
      </section>


      <p className="text-[11px] text-muted">{t("economics.liveFeedNote")}</p>

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
            <div className="text-[11px] uppercase tracking-wider text-muted mb-1">Modeled Φ reflexive constraint</div>
            <Spark outcome={active} field="phi" color="#e0b23c" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">IPPR model index</div>
              <Spark outcome={active} field="ippr" color="#3ec98c" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">Modeled collateral proxy</div>
              <Spark outcome={active} field="collateralRatio" color="#4d8ff5" />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-panel/60 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-muted">
            <tr className="border-b border-border">
              {["Scenario", "Final modeled Φ", "Final model index", "Min modeled collateral", "Max model drawdown", "Breaker epochs", "Verdict"].map((h) => (
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
                  <td className="px-4 py-2">{fmt(o.final.ippr)}</td>
                  <td className="px-4 py-2">{(o.minCollateral * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">{(o.maxDrawdown * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2">{o.breakerEpochs}</td>
                  <td className={`px-4 py-2 ${safe ? "text-green" : "text-red"}`}>
                    {safe ? "MODEL THRESHOLD MET" : "MODEL THRESHOLD NOT MET"}
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
          SIMULATION ONLY — not a live monetary policy, minting controller, reserve ratio, solvency certificate, or price guarantee.
          Projections are deterministic (seeded PRNG) so exported CSVs reproduce the charts exactly. A 15% deviation
          from the 7-epoch velocity median sets the simulation circuit breaker and zeroes the modeled emission rate.
          These are model outputs only: no actual minting, collateral, solvency, reserves, or settlement are controlled or verified here.
        </p>
      </section>
    </div>
  );
}
