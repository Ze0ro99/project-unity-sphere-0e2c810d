import test from "node:test";
import assert from "node:assert/strict";
import { computePiGoldMetrics, PIGOLD_PROPOSED_WEIGHTS_BPS } from "../src/lib/pigold-economics.ts";

const healthy = {
  externalPiUsd: 0.5,
  quoteTimestampMs: 1_000_000,
  quoteTrusted: true,
  quoteSources: 4,
  maxQuoteAgeMs: 30_000,
  maxDeviationBps: 300,
  deviationBps: 30,
  circulatingPi: 10_000_000,
  targetVelocity24h: 0.1,
  policy: { version: "pigold-test-v1", approved: true, weightsBps: PIGOLD_PROPOSED_WEIGHTS_BPS },
  pools: [{
    poolId: "pool-a",
    reserveAccountingId: "reserve-a",
    reserveValueUsd: 2_000_000,
    liabilitiesUsd: 1_500_000,
    turnover24hUsd: 500_000,
    fulfilledUtilityValue24hUsd: 100_000,
    targetUtilityValue24hUsd: 120_000,
  }],
  nowMs: 1_010_000,
};

test("computes a market-anchored internal purchasing-power index from verified inputs", () => {
  const metrics = computePiGoldMetrics(healthy);
  assert.ok(metrics);
  assert.equal(metrics.externalPiUsd, 0.5);
  assert.equal(metrics.uniqueLiquidityUsd, 2_000_000);
  assert.equal(metrics.poolCount, 1);
  assert.ok(metrics.internalPurchasingPowerUsd > 0);
  assert.ok(metrics.internalPurchasingPowerUsd <= metrics.externalPiUsd);
});

test("fails closed when the external quote is stale or untrusted", () => {
  assert.equal(computePiGoldMetrics({ ...healthy, nowMs: 1_100_000 }), null);
  assert.equal(computePiGoldMetrics({ ...healthy, quoteTrusted: false }), null);
  assert.equal(computePiGoldMetrics({ ...healthy, quoteSources: 2 }), null);
});

test("rejects duplicated reserve accounting IDs to prevent double counting", () => {
  const duplicate = { ...healthy.pools[0], poolId: "pool-b" };
  assert.equal(computePiGoldMetrics({ ...healthy, pools: [...healthy.pools, duplicate] }), null);
});

test("rejects incomplete or inconsistent reserve evidence", () => {
  assert.equal(computePiGoldMetrics({ ...healthy, pools: [] }), null);
  assert.equal(computePiGoldMetrics({ ...healthy, pools: [{ ...healthy.pools[0], reserveValueUsd: -1 }] }), null);
  assert.equal(computePiGoldMetrics({ ...healthy, deviationBps: 500 }), null);
});

test("requires an explicitly approved, versioned policy with integer basis-point weights", () => {
  assert.equal(computePiGoldMetrics({ ...healthy, policy: { ...healthy.policy, approved: false } }), null);
  assert.equal(computePiGoldMetrics({ ...healthy, policy: { ...healthy.policy, version: "" } }), null);
  assert.equal(computePiGoldMetrics({
    ...healthy,
    policy: { ...healthy.policy, weightsBps: { ...PIGOLD_PROPOSED_WEIGHTS_BPS, priceStability: 999 } },
  }), null);
  assert.equal(computePiGoldMetrics({
    ...healthy,
    policy: { ...healthy.policy, weightsBps: { ...PIGOLD_PROPOSED_WEIGHTS_BPS, priceStability: 1000.5 } },
  }), null);
});
