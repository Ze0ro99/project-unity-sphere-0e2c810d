/**
 * PiGold dynamic purchasing-power and liquidity model.
 *
 * All inputs must be independently measured and timestamped. The function
 * returns null when the market quote is untrusted/stale or required economic
 * evidence is missing. It never fabricates reserves, supply, turnover or utility.
 *
 * The weights below are an explicitly provisional policy proposal, not an
 * official Pi Network rule or a redemption guarantee.
 */
export const PIGOLD_MODEL_VERSION = "pigr-0.1-proposal";

export const PIGOLD_WEIGHTS = {
  externalMarketAnchor: 0.4,
  liquidityCoverage: 0.25,
  utilityFulfillment: 0.15,
  economicVelocity: 0.1,
  priceStability: 0.1,
} as const;

export type VerifiedPoolSnapshot = {
  poolId: string;
  reserveAccountingId: string;
  reserveValueUsd: number;
  liabilitiesUsd: number;
  turnover24hUsd: number;
  fulfilledUtilityValue24hUsd: number;
  targetUtilityValue24hUsd: number;
};

export type PiGoldEconomicInput = {
  externalPiUsd: number;
  quoteTimestampMs: number;
  quoteTrusted: boolean;
  quoteSources: number;
  maxQuoteAgeMs: number;
  maxDeviationBps: number;
  deviationBps: number;
  circulatingPi: number;
  targetVelocity24h: number;
  pools: VerifiedPoolSnapshot[];
  nowMs?: number;
};

export type PiGoldEconomicMetrics = {
  modelVersion: string;
  externalPiUsd: number;
  internalPurchasingPowerUsd: number;
  externalMarketCapUsd: number;
  internalReferenceValueUsd: number;
  uniqueLiquidityUsd: number;
  verifiedLiabilitiesUsd: number;
  liquidityCoverage: number;
  turnover24hUsd: number;
  economicVelocity24h: number;
  utilityFulfillment: number;
  priceStability: number;
  confidenceFactor: number;
  poolCount: number;
};

const finitePositive = (value: number) => Number.isFinite(value) && value > 0;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function computePiGoldMetrics(input: PiGoldEconomicInput): PiGoldEconomicMetrics | null {
  const now = input.nowMs ?? Date.now();
  if (!input.quoteTrusted || input.quoteSources < 3) return null;
  if (!finitePositive(input.externalPiUsd) || !finitePositive(input.circulatingPi)) return null;
  if (!Number.isFinite(input.quoteTimestampMs) || input.quoteTimestampMs <= 0) return null;
  if (!Number.isFinite(now) || now < input.quoteTimestampMs || now - input.quoteTimestampMs > input.maxQuoteAgeMs) return null;
  if (!Number.isFinite(input.deviationBps) || input.deviationBps < 0 || !finitePositive(input.maxDeviationBps)) return null;
  if (input.deviationBps > input.maxDeviationBps) return null;
  if (!finitePositive(input.targetVelocity24h) || input.pools.length === 0) return null;

  const accountingIds = new Set<string>();
  for (const pool of input.pools) {
    if (!pool.poolId || !pool.reserveAccountingId || accountingIds.has(pool.reserveAccountingId)) return null;
    accountingIds.add(pool.reserveAccountingId);
    const values = [
      pool.reserveValueUsd,
      pool.liabilitiesUsd,
      pool.turnover24hUsd,
      pool.fulfilledUtilityValue24hUsd,
      pool.targetUtilityValue24hUsd,
    ];
    if (values.some((value) => !Number.isFinite(value) || value < 0)) return null;
    if (pool.targetUtilityValue24hUsd === 0) return null;
  }

  const uniqueLiquidityUsd = input.pools.reduce((sum, pool) => sum + pool.reserveValueUsd, 0);
  const verifiedLiabilitiesUsd = input.pools.reduce((sum, pool) => sum + pool.liabilitiesUsd, 0);
  const turnover24hUsd = input.pools.reduce((sum, pool) => sum + pool.turnover24hUsd, 0);
  const fulfilled = input.pools.reduce((sum, pool) => sum + pool.fulfilledUtilityValue24hUsd, 0);
  const utilityTarget = input.pools.reduce((sum, pool) => sum + pool.targetUtilityValue24hUsd, 0);

  if (!finitePositive(uniqueLiquidityUsd) || !finitePositive(verifiedLiabilitiesUsd)) return null;

  const liquidityCoverage = uniqueLiquidityUsd / verifiedLiabilitiesUsd;
  const economicVelocity24h = turnover24hUsd / (input.circulatingPi * input.externalPiUsd);
  const utilityFulfillment = clamp01(fulfilled / utilityTarget);
  const priceStability = clamp01(1 - input.deviationBps / input.maxDeviationBps);
  const liquidityScore = clamp01(liquidityCoverage);
  const velocityScore = clamp01(economicVelocity24h / input.targetVelocity24h);

  const confidenceFactor =
    PIGOLD_WEIGHTS.externalMarketAnchor +
    PIGOLD_WEIGHTS.liquidityCoverage * liquidityScore +
    PIGOLD_WEIGHTS.utilityFulfillment * utilityFulfillment +
    PIGOLD_WEIGHTS.economicVelocity * velocityScore +
    PIGOLD_WEIGHTS.priceStability * priceStability;

  const internalPurchasingPowerUsd = input.externalPiUsd * confidenceFactor;
  const externalMarketCapUsd = input.externalPiUsd * input.circulatingPi;
  const internalReferenceValueUsd = internalPurchasingPowerUsd * input.circulatingPi;

  if (![internalPurchasingPowerUsd, externalMarketCapUsd, internalReferenceValueUsd].every(finitePositive)) return null;

  return {
    modelVersion: PIGOLD_MODEL_VERSION,
    externalPiUsd: input.externalPiUsd,
    internalPurchasingPowerUsd,
    externalMarketCapUsd,
    internalReferenceValueUsd,
    uniqueLiquidityUsd,
    verifiedLiabilitiesUsd,
    liquidityCoverage,
    turnover24hUsd,
    economicVelocity24h,
    utilityFulfillment,
    priceStability,
    confidenceFactor,
    poolCount: input.pools.length,
  };
}
