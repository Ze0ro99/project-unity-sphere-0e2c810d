import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { classifyEvidence } from "../src/lib/evidence.ts";

const now = 1_800_000_000_000;
test("local and model data are always SIMULATED", () => {
  assert.equal(classifyEvidence({ source: "local", ok: true, observedAt: now, independentProof: true, now }), "SIMULATED");
  assert.equal(classifyEvidence({ source: "model", ok: true, observedAt: now, now }), "SIMULATED");
});
test("VERIFIED requires fresh independent proof", () => {
  assert.equal(classifyEvidence({ source: "network", ok: true, observedAt: now, now }), "OBSERVED");
  assert.equal(classifyEvidence({ source: "network", ok: true, observedAt: now, independentProof: true, now }), "VERIFIED");
  assert.equal(classifyEvidence({ source: "network", ok: true, observedAt: now - 600_000, independentProof: true, now }), "UNKNOWN");
});
test("RPC failure, NOT_FOUND and missing timestamps are UNKNOWN", () => {
  assert.equal(classifyEvidence({ source: "network", ok: false, observedAt: now, now }), "UNKNOWN");
  assert.equal(classifyEvidence({ source: "network", ok: true, notFound: true, observedAt: now, now }), "UNKNOWN");
  assert.equal(classifyEvidence({ source: "feed", ok: true, observedAt: null, now }), "UNKNOWN");
});
test("Testnet treats NOT_FOUND and errors as unknown, not failed or deployed", async () => {
  const s = await readFile(new URL("../src/pages/Testnet.tsx", import.meta.url), "utf8");
  assert.match(s, /let status: Status = "unknown"/);
  assert.match(s, /CONTRACT_INSTANCE_NOT_FOUND"\) \{\s*status = "unknown"/);
  assert.match(s, /api\.testnet\.minepi\.com|HORIZON_TESTNET/);
  assert.match(s, /Expected protocol \(tracked\)/);
  assert.doesNotMatch(s, /horizon-testnet\.stellar\.org|soroban-testnet\.stellar\.org/);
  assert.doesNotMatch(s, /status: netOk \? "ok" : "fail"/);
  assert.match(s, /checkedAt: Date\.now\(\)/);
});
test("exchange and PiGold screens make no live trade, ACTIVE or liquidity claims", async () => {
  const dex = await readFile(new URL("../src/pages/PiDEX.tsx", import.meta.url), "utf8");
  const gold = await readFile(new URL("../src/pages/PiGold.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(dex, /"Live Trades"/);
  assert.doesNotMatch(dex, /Settlement Pi Mainnet/);
  assert.match(dex, /Simulated Trades/);
  assert.match(dex, /AMM quote \(simulated, not a swap\)/);
  for (const s of [dex, gold]) { assert.doesNotMatch(s, /\bACTIVE\b/); assert.doesNotMatch(s, /live liquidity|liquidity active/i); }
  assert.match(gold, /level="UNKNOWN" source="no contract readback"/);
});
test("Oracle labels computed purchasing power as SIMULATED", async () => {
  const s = await readFile(new URL("../src/pages/Oracle.tsx", import.meta.url), "utf8");
  assert.match(s, /level=\{pp \? "SIMULATED" : "UNKNOWN"\}/);
  assert.match(s, /idx\.sources < 3/);
});
