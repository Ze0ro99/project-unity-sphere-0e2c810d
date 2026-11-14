import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("developer studio is routed and clearly marks unavailable capabilities", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../src/pages/DeveloperStudio.tsx", import.meta.url), "utf8");
  assert.match(app, /path="\/developer-studio"/);
  assert.match(page, /DISABLED — APPROVED PIPELINE REQUIRED/);
  assert.match(page, /NOT IMPLEMENTED/);
  assert.match(page, /Mainnet writes, automatic signing/);
});

test("gateway cards do not label simulated trading as live", async () => {
  const source = await readFile(new URL("../src/pages/Gateways.tsx", import.meta.url), "utf8");
  assert.match(source, /Local order and AMM quote simulation; no on-chain orders or swaps/);
  assert.match(source, /Simulated depth and spread; not a live order book/);
  assert.match(source, /no deployed pool reserves or live LP positions/);
  assert.match(source, /READ-ONLY/);
  assert.doesNotMatch(source, /title: "Exchange Terminal", desc: "Spot, limit, market & AMM swaps with live candlesticks"/);
});
