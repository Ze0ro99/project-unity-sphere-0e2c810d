import assert from "node:assert/strict";
import { test } from "node:test";
import {
  IPPR_SUPPLY_MULTIPLIER,
  ipprFromSpot,
  isFreshMarketIndex,
  reflexiveConstraint,
} from "../src/lib/economics.ts";

test("rebases IPPR from the unrounded PI/quote-asset market tick", () => {
  assert.equal(IPPR_SUPPLY_MULTIPLIER, 10_000_000);
  assert.equal(ipprFromSpot(0.0729555), 729_555);
  assert.equal(ipprFromSpot(0.072956), 729_560);
  assert.ok(Number.isNaN(ipprFromSpot(0)));
  assert.ok(Number.isNaN(ipprFromSpot(Number.NaN)));
});

test("rejects missing, future, and stale market timestamps", () => {
  const now = 1_800_000_000_000;
  assert.equal(isFreshMarketIndex(now - 30_000, now), true);
  assert.equal(isFreshMarketIndex(now - 30_001, now), false);
  assert.equal(isFreshMarketIndex(now + 1, now), false);
  assert.equal(isFreshMarketIndex(0, now), false);
  assert.equal(isFreshMarketIndex(Number.NaN, now), false);
});

test("computes PiRC-101 Phi only from valid same-domain inputs", () => {
  const expected = (0.5115 * 729_555) / 10_072_123;
  assert.equal(reflexiveConstraint(0.5115, 729_555, 10_072_123), expected);
  assert.ok(Number.isNaN(reflexiveConstraint(0, 729_555, 10_072_123)));
  assert.ok(Number.isNaN(reflexiveConstraint(0.5115, 729_555, 0)));
  assert.ok(Number.isNaN(reflexiveConstraint(Number.NaN, 729_555, 10_072_123)));
});
