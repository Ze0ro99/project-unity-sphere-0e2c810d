import { test } from "node:test";
import assert from "node:assert/strict";
import { observeProtocol, upgradeState, TRACKED_UPGRADES, PROTOCOL_REFRESH_MS } from "../src/lib/protocol.ts";
const now = Date.parse("2026-11-09T03:00:00Z");
const ledger = (v, sequence = 100) => ({ sequence, protocol_version: v, closed_at: new Date(now - 5000).toISOString() });

for (const target of [28, 29, 30]) {
  test(`v${target} activates in observations only after a closed ledger uses it`, () => {
    assert.equal(upgradeState(observeProtocol({ core_supported_protocol_version: target }, [ledger(target - 1)], now), target), "pending");
    assert.equal(upgradeState(observeProtocol(null, [ledger(target)], now), target), "observed");
  });
}
test("supported version alone cannot activate a protocol", () => {
  assert.equal(observeProtocol({ core_supported_protocol_version: 30 }, [], now).active, null);
});
test("newest ledger wins, and later versions remain observable", () => {
  assert.equal(observeProtocol(null, [ledger(28, 101), ledger(30, 103), ledger(29, 102)], now).active, 30);
  assert.equal(observeProtocol(null, [ledger(31)], now).active, 31);
});
test("stale, future, and invalid evidence cannot activate an upgrade", () => {
  for (const closed_at of [new Date(now - 60001).toISOString(), new Date(now + 1).toISOString(), "invalid"]) {
    assert.equal(upgradeState(observeProtocol(null, [{ ...ledger(30), closed_at }], now), 30), "unknown");
  }
  assert.equal(observeProtocol(null, [ledger(NaN)], now).state, "unknown");
});
test("tracked upgrades and polling cadence are explicit", () => {
  assert.deepEqual(TRACKED_UPGRADES, [28, 29, 30]);
  assert.equal(PROTOCOL_REFRESH_MS, 10000);
});