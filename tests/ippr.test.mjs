import assert from "node:assert/strict";
import { test } from "node:test";
import { ipprFromSpot, IPPR_SUPPLY_MULTIPLIER } from "../src/lib/economics.ts";

test("IPPR scales the observed exchange quote by 10 million", () => {
  assert.equal(IPPR_SUPPLY_MULTIPLIER, 10_000_000);
  assert.equal(ipprFromSpot(0.225), 2_250_000);
  assert.equal(ipprFromSpot(0.085), 850_000);
});

test("IPPR cannot report a made-up value when the market quote is unavailable", () => {
  for (const spot of [NaN, Infinity, -Infinity, 0, -1]) {
    assert.ok(Number.isNaN(ipprFromSpot(spot)));
  }
});