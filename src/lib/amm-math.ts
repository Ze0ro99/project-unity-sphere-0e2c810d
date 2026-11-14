/**
 * Exact integer constant-product quote math shared with the Soroban PiDEX AMM.
 * Inputs/outputs are display-unit numbers quantized to the configured asset
 * precision; all fee and reserve arithmetic after quantization uses BigInt.
 */
export type AmmQuote = {
  out: number;
  priceImpactBps: number;
  effPrice: number;
  fee: number;
};

const BPS = 10_000n;

function toAtomic(value: number, scale: bigint): bigint {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("AMM quantities must be finite and non-negative");
  }
  const scaled = value * Number(scale);
  if (!Number.isSafeInteger(Math.round(scaled))) {
    throw new RangeError("AMM quantity exceeds safe input precision");
  }
  return BigInt(Math.round(scaled));
}

export function quoteConstantProduct(
  reserveIn: number,
  reserveOut: number,
  amountIn: number,
  feeBps: number,
  decimals = 7,
): AmmQuote {
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps >= 10_000) {
    throw new RangeError("feeBps must be an integer in [0, 9999]");
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 12) {
    throw new RangeError("decimals must be an integer in [0, 12]");
  }
  const scale = 10n ** BigInt(decimals);
  const zero = { out: 0, priceImpactBps: 0, effPrice: 0, fee: 0 };
  if (amountIn < 0 || reserveIn < 0 || reserveOut < 0) {
    throw new RangeError("AMM quantities must be non-negative");
  }
  if (amountIn === 0 || reserveIn === 0 || reserveOut === 0) return zero;

  const reserveInAtomic = toAtomic(reserveIn, scale);
  const reserveOutAtomic = toAtomic(reserveOut, scale);
  const amountInAtomic = toAtomic(amountIn, scale);
  if (reserveInAtomic <= 0n || reserveOutAtomic <= 0n || amountInAtomic <= 0n) return zero;

  const feeRate = BigInt(feeBps);
  const amountInAfterFee = (amountInAtomic * (BPS - feeRate)) / BPS;
  if (amountInAfterFee <= 0n) return zero;

  const denominator = reserveInAtomic + amountInAfterFee;
  const amountOutAtomic = (reserveOutAtomic * amountInAfterFee) / denominator;
  if (amountOutAtomic <= 0n) return zero;

  const feeAtomic = amountInAtomic - amountInAfterFee;
  const impactNumerator = (amountInAtomic * reserveOutAtomic) - (amountOutAtomic * reserveInAtomic);
  const impactDenominator = amountInAtomic * reserveOutAtomic;
  const impactBps = impactNumerator > 0n
    ? Number((impactNumerator * BPS) / impactDenominator)
    : 0;

  const out = Number(amountOutAtomic) / Number(scale);
  const normalizedInput = Number(amountInAtomic) / Number(scale);
  return {
    out,
    priceImpactBps: impactBps,
    effPrice: out / normalizedInput,
    fee: Number(feeAtomic) / Number(scale),
  };
}
