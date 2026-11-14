import test from "node:test";
import assert from "node:assert/strict";
import { PIGOLD_ASSETS, PIGOLD_COMPONENTS } from "../src/data/pigold-assets.ts";

test("PiGold catalogue has one coordinator and six independent component assets", () => {
  assert.equal(PIGOLD_ASSETS.length, 7);
  assert.equal(PIGOLD_COMPONENTS.length, 6);
  assert.equal(PIGOLD_ASSETS.filter((asset) => asset.relationship === "coordinator").length, 1);
  assert.deepEqual(PIGOLD_COMPONENTS.map((asset) => asset.id).sort(), [
    "picash", "pibank", "piexchange", "pigovernance", "pipurple", "piyellow",
  ]);
});

test("each proposed asset has a unique ID, symbol and explicit color", () => {
  assert.equal(new Set(PIGOLD_ASSETS.map((asset) => asset.id)).size, 7);
  assert.equal(new Set(PIGOLD_ASSETS.map((asset) => asset.symbol)).size, 7);
  for (const asset of PIGOLD_ASSETS) {
    assert.match(asset.color, /^#[0-9a-f]{6}$/i);
    assert.equal(asset.status, "design");
  }
});
