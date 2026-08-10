/**
 * PiRC Omni-Sovereign computational core.
 *
 * Ports the algorithms defined across the Ze0ro99/PiRC monorepo into typed,
 * deterministic TypeScript so the exchange, risk desk, governance portal and
 * compliance gateway all evaluate the *same* mathematics:
 *
 *   core/math/differential_geometry.py .... curvature + geodesic manifold routing
 *   PiRC-101 ............................. Φ (Phi) justice solvency + floor guard
 *   PiRC-204 ............................. Weighted Contribution Factor (WCF)
 *   PiRC-205 ............................. AI stabiliser / system efficiency factor
 *   PiRC-208 ............................. anomaly detection (EWMA + robust z)
 *   PiRC-211 ............................. risk analytics (VaR / ES / Sharpe)
 *   PiRC-212 ............................. autonomous agent policy loop
 *   PiRC-251 ............................. quadratic circuit breaker
 *   PiRC-260 ............................. 10M:1 sovereign credit expansion
 */

import type { Market } from "./exchange";

export const PARITY = 314_159;
export const PHI = 1.618_033_988_749_895;
export const CREDIT_EXPANSION_RATIO = 10_000_000; // PiRC-260 — 10M : 1

/* ------------------------------------------------------------------ */
/* Differential geometry — manifold routing (core/math)                */
/* ------------------------------------------------------------------ */

export type ManifoldNode = {
  id: string;
  /** Local liquidity density — the metric tensor diagonal at this chart. */
  density: number;
  /** Realised volatility at this chart (annualised fraction). */
  volatility: number;
  /** Observed settlement latency in ms. */
  latency: number;
};

export type ManifoldEdge = { from: string; to: string; depth: number; feeBps: number };

/**
 * Gaussian curvature of the liquidity manifold at a node.
 *
 * K = (σ² − ρ) / (1 + ρ²)²  with ρ the normalised liquidity density.
 * Negative curvature = hyperbolic (liquidity disperses, routing friction).
 * Positive curvature = elliptic (liquidity concentrates, friction collapses).
 */
export function curvature(node: ManifoldNode, refDensity: number): number {
  const rho = refDensity > 0 ? node.density / refDensity : 0;
  return (node.volatility * node.volatility - rho) / Math.pow(1 + rho * rho, 2);
}

/**
 * Geodesic cost of traversing an edge: the line element of the metric
 * ds² = (fee + impact)² + (λ · latency)² on a curved liquidity surface.
 */
export function geodesicCost(edge: ManifoldEdge, size: number, k: number, latency: number): number {
  const impact = edge.depth > 0 ? size / edge.depth : 1;
  const monetary = edge.feeBps / 10_000 + impact;
  const temporal = latency / 60_000;
  const warp = 1 + Math.max(-0.9, -k); // hyperbolic charts cost more to cross
  return Math.hypot(monetary, temporal) * warp;
}

export type Route = { path: string[]; cost: number; hops: number; friction: number };

/**
 * Differential Manifold routing — Dijkstra over the geodesic metric.
 * Eliminates network friction by preferring elliptic (positively curved) charts.
 */
export function routeOrder(
  nodes: ManifoldNode[],
  edges: ManifoldEdge[],
  from: string,
  to: string,
  size: number,
): Route | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const refDensity = nodes.reduce((s, n) => s + n.density, 0) / Math.max(1, nodes.length);
  const dist = new Map<string, number>(nodes.map((n) => [n.id, Infinity]));
  const prev = new Map<string, string>();
  dist.set(from, 0);
  const unvisited = new Set(nodes.map((n) => n.id));

  while (unvisited.size) {
    let cur: string | null = null;
    let best = Infinity;
    unvisited.forEach((id) => {
      const d = dist.get(id) ?? Infinity;
      if (d < best) { best = d; cur = id; }
    });
    if (cur === null || best === Infinity) break;
    if (cur === to) break;
    unvisited.delete(cur);

    edges
      .filter((e) => e.from === cur)
      .forEach((e) => {
        const node = byId.get(e.to);
        if (!node) return;
        const k = curvature(node, refDensity);
        const cost = best + geodesicCost(e, size, k, node.latency);
        if (cost < (dist.get(e.to) ?? Infinity)) {
          dist.set(e.to, cost);
          prev.set(e.to, cur as string);
        }
      });
  }

  if (!Number.isFinite(dist.get(to) ?? Infinity)) return null;
  const path: string[] = [to];
  while (path[0] !== from) {
    const p = prev.get(path[0]);
    if (!p) return null;
    path.unshift(p);
  }
  const cost = dist.get(to) ?? 0;

  // Flat (Euclidean) benchmark: same path priced with zero curvature warp.
  let flat = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const e = edges.find((x) => x.from === path[i] && x.to === path[i + 1]);
    const n = byId.get(path[i + 1]);
    if (e && n) flat += geodesicCost(e, size, 0, n.latency);
  }
  const direct = edges.find((e) => e.from === from && e.to === to);
  const naive = direct && byId.get(to)
    ? geodesicCost(direct, size, 0, byId.get(to)!.latency)
    : flat;
  const benchmark = Math.max(flat, naive);
  return {
    path,
    cost,
    hops: path.length - 1,
    friction: benchmark > 0 ? Math.max(0, 1 - cost / benchmark) : 0,
  };
}

/* ------------------------------------------------------------------ */
/* PiRC-101 — Φ justice solvency & floor-price protection              */
/* ------------------------------------------------------------------ */

export type SolvencyReport = {
  phi: number;
  solvent: boolean;
  floorPrice: number;
  breachedFloor: boolean;
  headroom: number;
};

/**
 * Φ-solvency (PiRC-101 justice engine).
 *
 * `reservesQuote` is the π backing held against `claimsBase` outstanding layer
 * tokens, so the reserve-backed price is reservesQuote / claimsBase. The
 * protected floor sits a golden-ratio discount below that backed price, and
 * Φ measures how far spot trades above the floor. A pool with no external
 * treasury sits exactly at Φ = 1.618; treasury backing lifts it further.
 */
export function phiSolvency(reservesQuote: number, claimsBase: number, spot: number): SolvencyReport {
  const backed = claimsBase > 0 ? reservesQuote / claimsBase : spot;
  const floorPrice = backed / PHI;
  const phi = floorPrice > 0 ? spot / floorPrice : Infinity;
  return {
    phi,
    solvent: phi >= PHI,
    floorPrice,
    breachedFloor: spot < floorPrice,
    headroom: floorPrice > 0 ? spot / floorPrice - 1 : 0,
  };
}

/* ------------------------------------------------------------------ */
/* PiRC-204 / 205 — WCF and System Efficiency Factor                   */
/* ------------------------------------------------------------------ */

export type Contribution = { liquidity: number; volume: number; uptime: number; governance: number };

/** Weighted Contribution Factor — reflexive reward weighting, saturating. */
export function weightedContributionFactor(c: Contribution): number {
  const w = { liquidity: 0.4, volume: 0.3, uptime: 0.2, governance: 0.1 };
  const sat = (x: number) => Math.tanh(Math.max(0, x));
  return (
    w.liquidity * sat(c.liquidity) +
    w.volume * sat(c.volume) +
    w.uptime * sat(c.uptime) +
    w.governance * sat(c.governance)
  );
}

/** System Efficiency Factor — throughput realised per unit of friction. */
export function systemEfficiency(opsPerSec: number, failRate: number, meanCloseTime: number): number {
  const throughput = opsPerSec / Math.max(0.001, meanCloseTime);
  return Math.max(0, Math.min(1, Math.tanh((throughput * (1 - failRate)) / 10)));
}

/** PiRC-260 sovereign credit expansion ceiling. */
export function creditCeiling(reservePi: number): number {
  return reservePi * CREDIT_EXPANSION_RATIO;
}

/* ------------------------------------------------------------------ */
/* PiRC-251 — quadratic circuit breaker                                */
/* ------------------------------------------------------------------ */

export type BreakerState = { level: 0 | 1 | 2 | 3; deviationBps: number; throttle: number; label: string };

/**
 * Quadratic breaker: throttle grows with the square of TWAP deviation, so
 * small dislocations barely bite while large ones halt the book outright.
 */
export function quadraticBreaker(price: number, twap: number): BreakerState {
  const dev = twap > 0 ? Math.abs(price - twap) / twap : 0;
  const bps = dev * 10_000;
  const throttle = Math.min(1, Math.pow(bps / 800, 2));
  const level = bps >= 800 ? 3 : bps >= 400 ? 2 : bps >= 150 ? 1 : 0;
  const label = ["Normal", "Elevated", "Restricted", "Halted"][level];
  return { level: level as 0 | 1 | 2 | 3, deviationBps: bps, throttle, label };
}

/* ------------------------------------------------------------------ */
/* PiRC-208 — anomaly detection                                        */
/* ------------------------------------------------------------------ */

export type Anomaly = { symbol: string; kind: string; score: number; detail: string; ts: number };

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** Robust z-score using the median absolute deviation (outlier-resistant). */
export function robustZ(series: number[], x: number): number {
  if (series.length < 4) return 0;
  const m = median(series);
  const mad = median(series.map((v) => Math.abs(v - m))) || 1e-9;
  return (x - m) / (1.4826 * mad);
}

export function detectAnomalies(markets: Market[]): Anomaly[] {
  const out: Anomaly[] = [];
  const ts = Date.now();
  markets.forEach((m) => {
    const closes = m.candles.slice(-120).map((c) => c.c);
    const vols = m.candles.slice(-120).map((c) => c.v);
    const rets = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const lastRet = rets.length ? rets[rets.length - 1] : 0;

    const zr = robustZ(rets.slice(0, -1), lastRet);
    if (Math.abs(zr) > 4) {
      out.push({ symbol: m.symbol, kind: "Price dislocation", score: Math.abs(zr), ts,
        detail: `${(lastRet * 100).toFixed(2)}% tick, robust z ${zr.toFixed(1)}` });
    }

    const zv = robustZ(vols.slice(0, -1), vols.length ? vols[vols.length - 1] : 0);
    if (zv > 4) {
      out.push({ symbol: m.symbol, kind: "Volume burst", score: zv, ts,
        detail: `volume z ${zv.toFixed(1)} vs 120-bar median` });
    }

    const br = quadraticBreaker(m.price, m.twap);
    if (br.level >= 2) {
      out.push({ symbol: m.symbol, kind: "TWAP deviation", score: br.deviationBps / 100, ts,
        detail: `${br.deviationBps.toFixed(0)} bps — breaker ${br.label}` });
    }

    const imbalance = (() => {
      const b = m.bids.reduce((s, l) => s + l.size, 0);
      const a = m.asks.reduce((s, l) => s + l.size, 0);
      return b + a > 0 ? (b - a) / (b + a) : 0;
    })();
    if (Math.abs(imbalance) > 0.65) {
      out.push({ symbol: m.symbol, kind: "Book imbalance", score: Math.abs(imbalance) * 10, ts,
        detail: `${imbalance > 0 ? "bid" : "ask"}-heavy ${(Math.abs(imbalance) * 100).toFixed(0)}%` });
    }
  });
  return out.sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------ */
/* PiRC-211 — risk analytics                                           */
/* ------------------------------------------------------------------ */

export type RiskMetrics = {
  symbol: string;
  volatility: number;   // annualised
  var95: number;        // 1-bar historical VaR, fraction
  expectedShortfall: number;
  sharpe: number;
  maxDrawdown: number;
  depth1pct: number;    // quote units to move price 1%
  liquidityScore: number;
};

export function riskMetrics(m: Market): RiskMetrics {
  const closes = m.candles.slice(-360).map((c) => c.c);
  const rets = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
  const n = Math.max(1, rets.length);
  const mean = rets.reduce((s, r) => s + r, 0) / n;
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const annual = sd * Math.sqrt(525_600); // 1-minute bars per year

  const sorted = [...rets].sort((a, b) => a - b);
  const idx = Math.max(0, Math.floor(sorted.length * 0.05) - 1);
  const var95 = Math.abs(sorted[idx] ?? 0);
  const tail = sorted.slice(0, Math.max(1, idx + 1));
  const es = Math.abs(tail.reduce((s, r) => s + r, 0) / tail.length);

  let peak = closes[0] ?? 1;
  let mdd = 0;
  closes.forEach((c) => { peak = Math.max(peak, c); mdd = Math.max(mdd, (peak - c) / peak); });

  // Constant-product depth: quote needed to shift spot by 1%.
  const depth1pct = m.reserveQuote * (Math.sqrt(1.01) - 1);
  const liquidityScore = Math.min(100, Math.round((depth1pct / Math.max(1, annual * 1000)) * 10));

  return {
    symbol: m.symbol,
    volatility: annual,
    var95,
    expectedShortfall: es,
    sharpe: sd > 0 ? (mean / sd) * Math.sqrt(525_600) : 0,
    maxDrawdown: mdd,
    depth1pct,
    liquidityScore,
  };
}

/** Portfolio VaR under a Gaussian copula with a shared systemic factor. */
export function portfolioVar(metrics: RiskMetrics[], weights: number[], rho = 0.45): number {
  const n = metrics.length;
  if (!n) return 0;
  let acc = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      acc += weights[i] * weights[j] * metrics[i].var95 * metrics[j].var95 * (i === j ? 1 : rho);
  return Math.sqrt(Math.max(0, acc));
}

/* ------------------------------------------------------------------ */
/* PiRC-212 — autonomous agent policy loop                             */
/* ------------------------------------------------------------------ */

export type AgentAction = {
  id: string;
  policy: string;
  action: string;
  target: string;
  rationale: string;
  severity: "info" | "warn" | "critical";
  ts: number;
};

/**
 * Deterministic policy evaluation — the agent observes market + risk state and
 * emits the actions the on-chain keeper would submit.
 */
export function agentEvaluate(markets: Market[]): AgentAction[] {
  const ts = Date.now();
  const acts: AgentAction[] = [];
  markets.forEach((m, i) => {
    const br = quadraticBreaker(m.price, m.twap);
    const r = riskMetrics(m);
    const sol = phiSolvency(m.reserveQuote, m.reserveBase, m.price);

    if (br.level >= 3)
      acts.push({ id: `${i}-halt`, policy: "PiRC-251", action: "HALT_MARKET", target: m.symbol,
        rationale: `TWAP deviation ${br.deviationBps.toFixed(0)} bps exceeds 800 bps ceiling`, severity: "critical", ts });
    else if (br.level === 2)
      acts.push({ id: `${i}-throttle`, policy: "PiRC-251", action: "THROTTLE_SIZE", target: m.symbol,
        rationale: `Quadratic throttle at ${(br.throttle * 100).toFixed(0)}% of notional`, severity: "warn", ts });

    if (!sol.solvent)
      acts.push({ id: `${i}-phi`, policy: "PiRC-101", action: "SEED_RESERVE", target: m.symbol,
        rationale: `Φ = ${sol.phi.toFixed(3)} below ${PHI.toFixed(3)} — reflexive liquidity seeding`, severity: "critical", ts });

    if (r.liquidityScore < 20)
      acts.push({ id: `${i}-lp`, policy: "PiRC-215", action: "BOOTSTRAP_LIQUIDITY", target: m.symbol,
        rationale: `Depth score ${r.liquidityScore}/100 — engage liquidity bootstrapper`, severity: "warn", ts });

    if (r.volatility > 2.5)
      acts.push({ id: `${i}-vol`, policy: "PiRC-205", action: "WIDEN_SPREAD", target: m.symbol,
        rationale: `Annualised vol ${(r.volatility * 100).toFixed(0)}% — AI stabiliser widening quotes`, severity: "info", ts });
  });
  if (!acts.length)
    acts.push({ id: "idle", policy: "PiRC-212", action: "NO_OP", target: "all markets",
      rationale: "All policies satisfied — manifold stable", severity: "info", ts });
  return acts;
}

/* ------------------------------------------------------------------ */
/* PiRC-211.5 — AML / KYC scoring                                      */
/* ------------------------------------------------------------------ */

export type AmlSignal = { label: string; weight: number; hit: boolean };

export type AmlAssessment = {
  score: number;                       // 0–100, higher = riskier
  band: "low" | "medium" | "high" | "prohibited";
  signals: AmlSignal[];
  requiresEdd: boolean;
  micarArticle: string;
};

export function assessAml(input: {
  notionalPi: number;
  counterpartyAgeDays: number;
  crossChain: boolean;
  shielded: boolean;
  sanctionedJurisdiction: boolean;
  velocity24h: number;
}): AmlAssessment {
  const signals: AmlSignal[] = [
    { label: "Notional above 1,000 π travel-rule threshold", weight: 25, hit: input.notionalPi >= 1000 },
    { label: "Counterparty younger than 30 days", weight: 15, hit: input.counterpartyAgeDays < 30 },
    { label: "Cross-chain settlement leg", weight: 15, hit: input.crossChain },
    { label: "Shielded (ZK) order flag", weight: 20, hit: input.shielded },
    { label: "Sanctioned / restricted jurisdiction", weight: 100, hit: input.sanctionedJurisdiction },
    { label: "Velocity above 25 transfers / 24h", weight: 20, hit: input.velocity24h > 25 },
  ];
  const score = Math.min(100, signals.reduce((s, x) => s + (x.hit ? x.weight : 0), 0));
  const band = score >= 100 ? "prohibited" : score >= 55 ? "high" : score >= 25 ? "medium" : "low";
  return {
    score,
    band,
    signals,
    requiresEdd: score >= 55,
    micarArticle: band === "low" ? "MiCAR Art. 68 — standard record keeping" : "MiCAR Art. 68 + AMLR Art. 16 — enhanced due diligence",
  };
}

/* ------------------------------------------------------------------ */
/* Post-quantum encapsulation status (Kyber-compatible)                */
/* ------------------------------------------------------------------ */

export type PqStatus = { suite: string; kem: string; sigAlg: string; hybrid: boolean; note: string };

export const PQ_SUITE: PqStatus = {
  suite: "PiRC-PQ-1",
  kem: "ML-KEM-768 (Kyber-compatible)",
  sigAlg: "Ed25519 + ML-DSA-65 hybrid attestation",
  hybrid: true,
  note: "Session keys are encapsulated with ML-KEM-768 and bound to the Ed25519 transaction signature, so a harvest-now-decrypt-later adversary cannot recover settlement payloads.",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const pct = (x: number, d = 2) => `${(x * 100).toFixed(d)}%`;
export const num = (x: number, d = 2) =>
  x >= 1e9 ? `${(x / 1e9).toFixed(2)}B` : x >= 1e6 ? `${(x / 1e6).toFixed(2)}M` : x >= 1e3 ? `${(x / 1e3).toFixed(2)}K` : x.toFixed(d);
