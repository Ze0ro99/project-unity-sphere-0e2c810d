/**
 * Infrastructure modules merged from:
 *   - feat/infrastructure-caching-cdn  (edge cache + CDN policy layer)
 *   - warehouse build modules          (finalize_pirc_warehouse*.sh, test_all_contracts.sh)
 *
 * The upstream shell/Redis implementations are server-side; this port keeps the exact
 * policy semantics (TTL tiers, stale-while-revalidate, hit/miss accounting) in a
 * browser-safe layer that every live page can share.
 */

export type CacheTier = "edge" | "regional" | "origin";

export type CachePolicy = {
  key: string;
  ttlMs: number;
  swrMs: number;
  tier: CacheTier;
};

export const CDN_POLICIES: CachePolicy[] = [
  { key: "ledgers", ttlMs: 5_000, swrMs: 15_000, tier: "edge" },
  { key: "orderbook", ttlMs: 1_000, swrMs: 4_000, tier: "edge" },
  { key: "candles", ttlMs: 10_000, swrMs: 60_000, tier: "regional" },
  { key: "layers", ttlMs: 60_000, swrMs: 300_000, tier: "regional" },
  { key: "repository", ttlMs: 120_000, swrMs: 600_000, tier: "origin" },
  { key: "standards", ttlMs: 600_000, swrMs: 3_600_000, tier: "origin" },
];

type Entry<T> = { value: T; at: number; policy: CachePolicy };

const store = new Map<string, Entry<unknown>>();

const stats = {
  hits: 0,
  misses: 0,
  stale: 0,
  revalidations: 0,
  errors: 0,
  bytes: 0,
  byKey: new Map<string, { hits: number; misses: number; lastMs: number }>(),
};

export type CacheStats = {
  hits: number;
  misses: number;
  stale: number;
  revalidations: number;
  errors: number;
  bytes: number;
  hitRatio: number;
  entries: { key: string; tier: CacheTier; ageMs: number; hits: number; misses: number; lastMs: number }[];
};

function policyFor(key: string): CachePolicy {
  return (
    CDN_POLICIES.find((p) => key.startsWith(p.key)) ?? { key, ttlMs: 30_000, swrMs: 120_000, tier: "regional" }
  );
}

function bump(key: string, field: "hits" | "misses", ms = 0) {
  const rec = stats.byKey.get(key) ?? { hits: 0, misses: 0, lastMs: 0 };
  rec[field] += 1;
  if (ms) rec.lastMs = ms;
  stats.byKey.set(key, rec);
}

/** Cached fetcher with stale-while-revalidate, matching the CDN edge config. */
export async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const policy = policyFor(key);
  const hit = store.get(key) as Entry<T> | undefined;
  const now = Date.now();

  if (hit && now - hit.at < policy.ttlMs) {
    stats.hits++;
    bump(key, "hits");
    return hit.value;
  }

  if (hit && now - hit.at < policy.ttlMs + policy.swrMs) {
    stats.hits++;
    stats.stale++;
    bump(key, "hits");
    void loader()
      .then((fresh) => {
        stats.revalidations++;
        store.set(key, { value: fresh, at: Date.now(), policy });
      })
      .catch(() => {
        stats.errors++;
      });
    return hit.value;
  }

  stats.misses++;
  const t0 = performance.now();
  try {
    const value = await loader();
    const ms = performance.now() - t0;
    bump(key, "misses", Math.round(ms));
    stats.bytes += approxBytes(value);
    store.set(key, { value, at: Date.now(), policy });
    return value;
  } catch (e) {
    stats.errors++;
    bump(key, "misses", Math.round(performance.now() - t0));
    if (hit) return hit.value; // serve last-known-good rather than fail the page
    throw e;
  }
}

function approxBytes(v: unknown): number {
  try {
    return JSON.stringify(v)?.length ?? 0;
  } catch {
    return 0;
  }
}

export function cacheStats(): CacheStats {
  const total = stats.hits + stats.misses;
  return {
    hits: stats.hits,
    misses: stats.misses,
    stale: stats.stale,
    revalidations: stats.revalidations,
    errors: stats.errors,
    bytes: stats.bytes,
    hitRatio: total ? stats.hits / total : 0,
    entries: [...store.entries()].map(([key, e]) => {
      const rec = stats.byKey.get(key) ?? { hits: 0, misses: 0, lastMs: 0 };
      return { key, tier: e.policy.tier, ageMs: Date.now() - e.at, hits: rec.hits, misses: rec.misses, lastMs: rec.lastMs };
    }),
  };
}

export function purgeCache(key?: string) {
  if (key) store.delete(key);
  else store.clear();
}

/* ────────────────────────── Warehouse build modules ────────────────────────── */

export type WarehouseModule = {
  id: string;
  path: string;
  lang: "rust" | "solidity" | "python" | "shell";
  standard: string;
  runner: string;
  status: "built" | "example" | "planned";
};

/** Mirrors finalize_pirc_warehouse.sh — one runnable example per contract. */
export const WAREHOUSE: WarehouseModule[] = [
  { id: "pidex_amm", path: "contracts/pidex_amm/src/lib.rs", lang: "rust", standard: "PiRC-215/227", runner: "soroban contract invoke --id $ID --fn swap", status: "built" },
  { id: "bn254_verifier", path: "contracts/bn254_verifier/src/lib.rs", lang: "rust", standard: "PiRC-800", runner: "cargo test --features bn254", status: "built" },
  { id: "multi_sig_governance", path: "contracts/multi_sig_governance/lib.rs", lang: "rust", standard: "PiRC-207", runner: "soroban contract invoke --id $ID --fn propose", status: "example" },
  { id: "circuit_breaker", path: "contracts/circuit_breaker/lib.rs", lang: "rust", standard: "PiRC-208", runner: "soroban contract invoke --id $ID --fn trip", status: "example" },
  { id: "cross_chain_bridge", path: "contracts/cross_chain_bridge/lib.rs", lang: "rust", standard: "PiRC-210", runner: "soroban contract invoke --id $ID --fn lock", status: "example" },
  { id: "risk_analytics", path: "simulator/risk_engine.py", lang: "python", standard: "PiRC-211", runner: "python simulator/risk_engine.py --var 0.99", status: "built" },
  { id: "aml_kyc_gateway", path: "api/merchant_spec.json", lang: "python", standard: "PiRC-211.5", runner: "python api/main.py --screen", status: "built" },
  { id: "autonomous_agent", path: "contracts/PiRC212Governance.sol", lang: "solidity", standard: "PiRC-212", runner: "npx hardhat run scripts/test_PiRC212Governance.js", status: "built" },
  { id: "justice_engine", path: "contracts/PiRC228JusticeEngine.sol", lang: "solidity", standard: "PiRC-228", runner: "npx hardhat run scripts/test_PiRC228JusticeEngine.js", status: "built" },
  { id: "registry_v3", path: "contracts/PiRC260RegistryV3.sol", lang: "solidity", standard: "PiRC-260", runner: "npx hardhat run scripts/test_PiRC260RegistryV3.js", status: "built" },
  { id: "anomaly_detector", path: "simulator/anomaly_detector.py", lang: "python", standard: "PiRC-208", runner: "python simulator/anomaly_detector.py --backtest", status: "built" },
  { id: "warehouse_master", path: "test_all_contracts.sh", lang: "shell", standard: "CI", runner: "./test_all_contracts.sh", status: "built" },
];

/** Merge ledger — which upstream branches are folded into this portal. */
export type MergedBranch = {
  branch: string;
  module: string;
  target: string;
  note: string;
  state: "merged" | "reconciled";
};

export const MERGE_LEDGER: MergedBranch[] = [
  { branch: "feat/economic-dashboard", module: "Economic Simulator", target: "/economics", state: "reconciled", note: "Express + soroban-client backend replaced by a deterministic client engine (src/lib/economics.ts)." },
  { branch: "feat/pirc-207-matrix", module: "7-Layer Registry / multisig", target: "/layers · /governance", state: "merged", note: "Already contained in main; layer registry and m-of-n keeper set live." },
  { branch: "feat/pirc-208-anomaly-detection", module: "Anomaly & circuit breaker", target: "/sovereign#anomaly", state: "merged", note: "Robust-z detector plus 15% deviation breaker ported into the economic core." },
  { branch: "feat/pirc-210-crosschain-bridge", module: "Cross-chain bridge", target: "/bridge", state: "merged", note: "Lock-and-mint corridors with emergency pause." },
  { branch: "feat/pirc-211-risk-analytics", module: "Risk analytics", target: "/sovereign#risk", state: "merged", note: "VaR, expected shortfall, drawdown and depth scoring." },
  { branch: "feat/pirc-211.5-compliance-amlkyc", module: "AML/KYC gateway", target: "/compliance", state: "merged", note: "Screening scores plus MiCAR alignment matrix." },
  { branch: "feat/pirc-212-autonomous-agent", module: "Autonomous keeper", target: "/sovereign#agent", state: "merged", note: "Policy loop emitting halt / throttle / seed actions." },
  { branch: "feat/infrastructure-caching-cdn", module: "Edge cache & CDN", target: "/infrastructure", state: "reconciled", note: "Redis/edge config re-expressed as a shared SWR cache with live telemetry." },
  { branch: "warehouse build modules", module: "Contract warehouse", target: "/infrastructure#warehouse", state: "reconciled", note: "finalize_pirc_warehouse.sh runners indexed as a typed build matrix." },
];
