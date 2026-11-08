import test from "node:test";
import assert from "node:assert/strict";
import { ipprFromSpot, ipprNanoUsdFromSpot, simulate } from "../src/lib/economics.ts";

test("IPPR re-bases from the unrounded PI/USD quote times ten million", () => {
  assert.equal(ipprFromSpot(0.0729555), 729555);
  assert.equal(ipprNanoUsdFromSpot(0.0729555)?.toString(), "729555000000000");
  assert.equal(ipprFromSpot(0.072956), 729560);
});

test("invalid market prices do not produce an IPPR reference", () => {
  assert.equal(ipprNanoUsdFromSpot(0), null);
  assert.equal(ipprNanoUsdFromSpot(Number.NaN), null);
  assert.equal(Number.isNaN(ipprFromSpot(-1)), true);
});

test("scenario simulation accepts the latest market-linked IPPR as its base", () => {
  const outcome = simulate({
    id: "live-index-test",
    name: "Market-linked base",
    qwfGrowth: 0,
    ipprAdjustment: 0,
    oracleVolatility: 0,
    durationEpochs: 1,
  }, "test", 729555);
  assert.equal(outcome.final.ippr, 729555);
});
