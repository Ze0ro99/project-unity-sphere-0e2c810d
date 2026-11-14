import test from "node:test";
import assert from "node:assert/strict";
import { quoteConstantProduct } from "../src/lib/amm-math.ts";

test("quote uses exact 30 bps integer arithmetic and floors output", () => {
  const quote = quoteConstantProduct(10_000, 20_000, 1_000, 30, 0);
  assert.equal(quote.out, 1_813);
  assert.equal(quote.fee, 3);
  assert.equal(quote.priceImpactBps, 909);
});

test("quote rounds fee in the same direction as Soroban integer division", () => {
  const quote = quoteConstantProduct(1, 2, 1, 30, 0);
  assert.equal(quote.fee, 0);
  assert.equal(quote.out, 0); // 0.997 input rounds down to zero at integer precision.
});

test("quote is zero for empty reserves or non-positive input", () => {
  assert.deepEqual(quoteConstantProduct(0, 100, 1, 30), {
    out: 0, priceImpactBps: 0, effPrice: 0, fee: 0,
  });
  assert.equal(quoteConstantProduct(100, 100, 0, 30).out, 0);
});

test("quote rejects non-finite, negative and unsafe quantities", () => {
  assert.throws(() => quoteConstantProduct(-1, 100, 1, 30), RangeError);
  assert.throws(() => quoteConstantProduct(100, 100, Number.NaN, 30), RangeError);
  assert.throws(() => quoteConstantProduct(Number.MAX_SAFE_INTEGER, 100, 1, 30), RangeError);
});

test("quote rejects invalid fee and precision policy", () => {
  assert.throws(() => quoteConstantProduct(100, 100, 1, 10_000), RangeError);
  assert.throws(() => quoteConstantProduct(100, 100, 1, 30, 13), RangeError);
});
