import test from "node:test";
import assert from "node:assert/strict";
import { PIGOLD_ASSETS, PIGOLD_COMPONENTS } from "../src/data/pigold-assets.ts";

test("PiGold catalogue preserves six legacy components and adds OUSD as a seventh test-only component", () => {
  assert.equal(PIGOLD_ASSETS.length, 8);
  assert.equal(PIGOLD_COMPONENTS.length, 7);
  assert.equal(PIGOLD_ASSETS.filter((asset) => asset.relationship === "coordinator").length, 1);
  assert.deepEqual(PIGOLD_COMPONENTS.map((asset) => asset.id).sort(), [
    "ousd", "pibank", "picash", "piexchange", "pigovernance", "pipurple", "piyellow",
  ]);
});

test("each proposed asset has a unique ID, symbol and explicit color", () => {
  assert.equal(new Set(PIGOLD_ASSETS.map((asset) => asset.id)).size, 8);
  assert.equal(new Set(PIGOLD_ASSETS.map((asset) => asset.symbol)).size, 8);
  for (const asset of PIGOLD_ASSETS) {
    assert.match(asset.color, /^#[0-9a-f]{6}$/i);
    assert.match(asset.logoPath, /^\/token-logos\/(blue-314|gold-unmapped|green-picash|orange-3141|ousd-test-placeholder|purple-mined-pi|red-governance|yellow-31140)\.svg$/);
    assert.equal(asset.status, asset.id === "ousd" ? "test-only" : "design");
    assert.ok(asset.legacyMapping.length > 10);
  }
});
