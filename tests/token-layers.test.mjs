import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { test } from "node:test";

async function loadTokenLayers() {
  const source = await readFile(new URL("../assets/js/token_layers.js", import.meta.url), "utf8");
  const window = {};
  const document = { addEventListener() {}, querySelector() { return null; } };
  vm.runInNewContext(source, { window, document, console });
  return window.tokenLayers;
}

test("layer metadata exposes the documented per-layer Pi ratios", async () => {
  const { TOKEN_LAYERS } = await loadTokenLayers();
  assert.equal(TOKEN_LAYERS.root.subunit.pi, 1);
  assert.equal(TOKEN_LAYERS.sacral.subunit.pi, 1);
  assert.equal(TOKEN_LAYERS.solar.subunit.pi, 1);
  assert.equal(TOKEN_LAYERS.heart.subunit.pi, 10_000);
  assert.equal(TOKEN_LAYERS.throat.subunit.pi, 10_000);
  assert.equal(TOKEN_LAYERS.thirdEye.subunit.pi, 1);
  assert.equal(TOKEN_LAYERS.crown.subunit.micro, 10_000_000);
});

test("heart and throat proposal ratios are internally consistent", async () => {
  const { TOKEN_LAYERS, calculateToPi, calculateToPiGCV, calculateToMicros } = await loadTokenLayers();
  for (const layer of ["heart", "throat"]) {
    assert.equal(calculateToPi(10_000, layer), "1.00000000");
    assert.equal(calculateToPiGCV(1_000, layer), "1.00000000");
    assert.equal(calculateToMicros(1, layer), "1000");
    assert.equal(TOKEN_LAYERS[layer].subunit.pi / TOKEN_LAYERS[layer].subunit.pigcv, 10);
  }
});

test("unsupported layer conversions remain explicitly unsupported", async () => {
  const { calculateToPiGCV, calculateToMicros } = await loadTokenLayers();
  assert.equal(calculateToPiGCV(1, "root"), "N/A (fixed layer)");
  assert.equal(calculateToMicros(1, "root"), "Layer-specific");
  assert.equal(calculateToMicros(1, "thirdEye"), "Layer-specific");
});

test("native Pi atomic scale remains 10 million per Pi", async () => {
  const { TOKEN_LAYERS, calculateToMicros } = await loadTokenLayers();
  assert.equal(TOKEN_LAYERS.crown.subunit.micro, 10_000_000);
  assert.equal(calculateToMicros(1, "crown"), "10000000");
});
