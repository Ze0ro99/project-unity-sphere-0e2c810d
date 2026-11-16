import test from "node:test";
import assert from "node:assert/strict";
import {
  POLICY_ID,
  CAS_PER_WHOLE_UNIT,
  EXECUTION_ENABLED,
  getPurchasingPowerLayer,
  layerCasToPiGoldReference,
  piGoldReferenceToLayerCas,
  illustrativeReferenceUsdMicros,
  listPurchasingPowerLayers,
} from "../../assets/js/pirc-purchasing-power-v1.mjs";

test("new purchasing-power policy is additive and non-executable", () => {
  assert.equal(POLICY_ID, "pirc-purchasing-power-v1");
  assert.equal(EXECUTION_ENABLED, false);
  assert.equal(CAS_PER_WHOLE_UNIT, 10_000_000n);
  assert.deepEqual(listPurchasingPowerLayers(), ["pigold", "yellow", "orange", "pibank", "picash"]);
});

test("reference ladder uses the 10/100/1000/10000 ratios", () => {
  assert.equal(getPurchasingPowerLayer("yellow").unitsPerPiGold, "10");
  assert.equal(getPurchasingPowerLayer("orange").unitsPerPiGold, "100");
  assert.equal(getPurchasingPowerLayer("pibank").unitsPerPiGold, "1000");
  assert.equal(getPurchasingPowerLayer("picash").unitsPerPiGold, "10000");
});

test("exact CAS conversions preserve all remainders", () => {
  assert.deepEqual(layerCasToPiGoldReference("yellow", "100000000"), {
    policyId: POLICY_ID, layerKey: "yellow", inputCas: "100000000",
    piGoldReferenceCas: "10000000", remainderCas: "0", executable: false,
  });
  assert.equal(layerCasToPiGoldReference("orange", "100000001").remainderCas, "1");
  assert.equal(layerCasToPiGoldReference("picash", "99999999999").remainderCas, "9999");
});

test("inverse conversion is exact integer arithmetic", () => {
  assert.equal(piGoldReferenceToLayerCas("pibank", "10000000").layerAmountCas, "10000000000");
  assert.equal(piGoldReferenceToLayerCas("picash", "10000000").layerAmountCas, "100000000000");
});

test("illustrative values match the USD 600000 PiGold scenario", () => {
  assert.equal(illustrativeReferenceUsdMicros("pigold", "10000000").usdMicros, "600000000000");
  assert.equal(illustrativeReferenceUsdMicros("yellow", "10000000").usdMicros, "60000000000");
  assert.equal(illustrativeReferenceUsdMicros("orange", "10000000").usdMicros, "6000000000");
  assert.equal(illustrativeReferenceUsdMicros("pibank", "10000000").usdMicros, "600000000");
  assert.equal(illustrativeReferenceUsdMicros("picash", "10000000").usdMicros, "60000000");
});

test("unknown layers and negative or malformed amounts fail closed", () => {
  assert.throws(() => layerCasToPiGoldReference("indigo", "100"), /Unsupported/);
  assert.throws(() => layerCasToPiGoldReference("yellow", "-1"), /unsigned/);
  assert.throws(() => layerCasToPiGoldReference("yellow", "1.5"), /unsigned integer/);
});
