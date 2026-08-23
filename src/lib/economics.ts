/**
 * PiRC Economic Simulation Engine
 * Merged from branch: feat/economic-dashboard
 *   (apps/backend/routes/simulator.ts + apps/frontend/src/components/EconomicSimulator.tsx)
 *
 * The upstream branch depended on an Express backend and `soroban-client`, neither of
 * which exist in this client-side sovereign portal. The reflexive economics are ported
 * verbatim and made deterministic so exports match projections byte-for-byte.
 *
 *   Reflexive constraint     Φ = (L_n · IPPR) / QWF
 *   Collateral ratio         C = clamp(Φ, 0.5, 1.0)
 *   Minting rate             m = Φ ≥ 1 ? m₀ : m₀ · Φ
 */

export const BASE_QWF = 10_000_000; // Quantified Work Force baseline
export const BASE_IPPR = 2_248_000; // Internal Purchasing Power Reserve (USD)
export const BASE_MINTING_RATE = 0.02;
export const BASE_VELOCITY = 0.5;

export type SimulationScenario = {
  id: string;
  name: string;
  qwfGrowth: number;
  ipprAdjustment: number;
  oracleVolatility: number;
  durationEpochs: number;
};

export type MetricSnapshot = {
  epoch: number;
  qwf: number;
  ippr: number;
  velocity: number;
  phi: number;
  collateralRatio: number;
  mintingRate: number;
  breaker: boolean;
};

export type ScenarioOutcome = {
  scenario: SimulationScenario;
  series: MetricSnapshot[];
  final: MetricSnapshot;
  minCollateral: number;
  maxDrawdown: number;
  breakerEpochs: number;
  ci95: [number, number];
};

export const DEFAULT_SCENARIOS: SimulationScenario[] = [
  { id: "s1", name: "Bull Market (+15%)", qwfGrowth: 0.15, ipprAdjustment: 0.2, oracleVolatility: 0.08, durationEpochs: 365 },
  { id: "s2", name: "Bear Market (−10%)", qwfGrowth: -0.1, ipprAdjustment: -0.15, oracleVolatility: 0.25, durationEpochs: 365 },
  { id: "s3", name: "Black Swan (−50%)", qwfGrowth: -0.5, ipprAdjustment: -0.4, oracleVolatility: 0.75, durationEpochs: 365 },
  { id: "s4", name: "Steady State", qwfGrowth: 0.03, ipprAdjustment: 0.03, oracleVolatility: 0.04, durationEpochs: 365 },
];

/** Deterministic mulberry32 PRNG — reproducible projections & exports. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PiRC-208 circuit breaker: 15% deviation from the rolling median halts minting. */
export const VOLATILITY_THRESHOLD = 0.15;

export function simulate(scenario: SimulationScenario, seedSuffix = ""): ScenarioOutcome {
  const rand = rng(hash(scenario.id + seedSuffix));
  const series: MetricSnapshot[] = [];
  const n = Math.max(1, Math.round(scenario.durationEpochs));

  let qwf = BASE_QWF;
  let ippr = BASE_IPPR;
  let peak = 0;
  let maxDrawdown = 0;
  let minCollateral = 1;
  let breakerEpochs = 0;
  const window: number[] = [];

  for (let epoch = 0; epoch < n; epoch++) {
    qwf *= 1 + scenario.qwfGrowth / n;
    ippr *= 1 + scenario.ipprAdjustment / n;

    const cyclical = Math.sin(epoch / 50) * scenario.oracleVolatility;
    const shock = (rand() - 0.5) * 2 * scenario.oracleVolatility * 0.5;
    const velocity = Math.max(0.05, BASE_VELOCITY + cyclical * 0.5 + shock);

    const phi = (velocity * ippr) / qwf;
    const collateralRatio = Math.min(1, Math.max(0.5, phi));
    const mintingRate = phi >= 1 ? BASE_MINTING_RATE : Math.max(0, BASE_MINTING_RATE * phi);

    window.push(velocity);
    if (window.length > 7) window.shift();
    const sorted = [...window].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const deviation = median > 0 ? Math.abs(velocity - median) / median : 0;
    const breaker = deviation > VOLATILITY_THRESHOLD;
    if (breaker) breakerEpochs++;

    peak = Math.max(peak, ippr);
    maxDrawdown = Math.max(maxDrawdown, peak > 0 ? (peak - ippr) / peak : 0);
    minCollateral = Math.min(minCollateral, collateralRatio);

    series.push({
      epoch,
      qwf: Math.round(qwf),
      ippr: Math.round(ippr),
      velocity: +velocity.toFixed(4),
      phi: +phi.toFixed(4),
      collateralRatio: +collateralRatio.toFixed(4),
      mintingRate: +mintingRate.toFixed(4),
      breaker,
    });
  }

  const phis = series.map((s) => s.phi);
  const mean = phis.reduce((a, b) => a + b, 0) / phis.length;
  const sd = Math.sqrt(phis.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, phis.length - 1));
  const ci95: [number, number] = [+(mean - 1.96 * sd).toFixed(4), +(mean + 1.96 * sd).toFixed(4)];

  return {
    scenario,
    series,
    final: series[series.length - 1],
    minCollateral: +minCollateral.toFixed(4),
    maxDrawdown: +maxDrawdown.toFixed(4),
    breakerEpochs,
    ci95,
  };
}

export function toCSV(outcome: ScenarioOutcome): string {
  const head = "epoch,qwf,ippr_usd,network_velocity,phi,collateral_ratio,minting_rate,circuit_breaker";
  const rows = outcome.series.map((s) =>
    [s.epoch, s.qwf, s.ippr, s.velocity, s.phi, s.collateralRatio, s.mintingRate, s.breaker ? 1 : 0].join(","),
  );
  return [head, ...rows].join("\n");
}

export function downloadCSV(outcome: ScenarioOutcome) {
  const blob = new Blob([toCSV(outcome)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pirc-simulation-${outcome.scenario.id}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Live metrics equivalent of GET /api/simulator/metrics/live (no backend required). */
export function liveSnapshot(tick: number): MetricSnapshot {
  const s = simulate({ ...DEFAULT_SCENARIOS[3], durationEpochs: 96 }, `live-${Math.floor(tick / 96)}`);
  return s.series[tick % 96];
}
