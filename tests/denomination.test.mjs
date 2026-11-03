import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STROOPS_PER_PI,
  assertStroopPrecision,
  formatStroopsAsPi,
  parsePiToStroops,
} from "../src/lib/denomination.ts";

test("parses decimal Pi values into exact seven-decimal stroops", () => {
  assert.equal(parsePiToStroops("0"), 0n);
  assert.equal(parsePiToStroops("1"), STROOPS_PER_PI);
  assert.equal(parsePiToStroops("1.23"), 12_300_000n);
  assert.equal(parsePiToStroops("0.0000001"), 1n);
  assert.equal(parsePiToStroops("1.0000001"), 10_000_001n);
});

test("formats stroops without floating-point rounding", () => {
  assert.equal(formatStroopsAsPi(0n), "0");
  assert.equal(formatStroopsAsPi(10_000_000n), "1");
  assert.equal(formatStroopsAsPi(10_000_001n), "1.0000001");
  assert.equal(formatStroopsAsPi(12_300_000n), "1.23");
  assert.equal(formatStroopsAsPi(-1n), "-0.0000001");
});

test("parse and format round-trip exact atomic values", () => {
  for (const amount of ["0", "0.0000001", "0.1", "1", "1.0000001", "123456.7890123"]) {
    assert.equal(formatStroopsAsPi(parsePiToStroops(amount)), amount);
  }
});

test("rejects unsupported precision and ambiguous numeric syntax", () => {
  for (const amount of ["", "-1", "+1", "01", "1.", "1.00000000", "1e-7", "NaN", "Infinity"]) {
    assert.throws(() => parsePiToStroops(amount), Error, amount);
  }
});

test("requires bigint for atomic-unit precision assertions", () => {
  assert.equal(assertStroopPrecision(7n), 7n);
  assert.throws(() => assertStroopPrecision(7), /bigint/);
});
