import test from "node:test";
import assert from "node:assert/strict";
import {
  piDecimalToMicros,
  formatMicroPi,
  layerUnitsToMicroPi,
  layerUnitsToPi,
  heartThroatUnitsToPiGcvRatio,
  getLayerConversionStatus,
} from "../../assets/js/pirc207-layer-math.mjs";

test("Pi decimal parser uses exact seven-decimal micro units", () => {
  assert.equal(piDecimalToMicros("1"), 10_000_000n);
  assert.equal(piDecimalToMicros("0.0000001"), 1n);
  assert.equal(formatMicroPi(piDecimalToMicros("12.3456789")), "12.3456789");
});

test("Heart and Throat unit conversion follows the proposal constants", () => {
  assert.equal(layerUnitsToMicroPi("heart", "10000"), 10_000_000n);
  assert.equal(layerUnitsToPi("throat", "1000"), "0.1000000");
});

test("PiGCV is exposed as an exact rational ratio", () => {
  assert.deepEqual(heartThroatUnitsToPiGcvRatio("1000"), {
    numerator: "1000", denominator: "1000", unit: "PiGCV",
  });
});

test("Crown accepts Pi decimal amounts", () => {
  assert.equal(layerUnitsToPi("crown", "2.5"), "2.5000000");
});

test("unspecified layers fail closed rather than inventing a conversion", () => {
  assert.throws(() => layerUnitsToPi("sacral", "100"), /not specified/);
  assert.equal(getLayerConversionStatus("thirdEye"), "UNSPECIFIED");
});

test("invalid precision and negative amounts are rejected", () => {
  assert.throws(() => piDecimalToMicros("0.00000001"), /at most 7/);
  assert.throws(() => layerUnitsToMicroPi("heart", "-1"), /unsigned integer/);
});
