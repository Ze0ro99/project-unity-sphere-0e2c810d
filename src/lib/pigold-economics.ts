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

export const PIGOLD_PROPOSED_WEIGHTS_BPS = {
  externalMarketAnchor: 4_000,
  liquidityCoverage: 2_500,
  utilityFulfillment: 1_500,
  economicVelocity: 1_000,
  priceStability: 1_000,
} as const;

export type PiGoldPolicyWeightsBps = {
  externalMarketAnchor: number;
  liquidityCoverage: number;
  utilityFulfillment: number;
  economicVelocity: number;
  priceStability: number;
};

export type ApprovedPiGoldPolicy = {
  version: string;
  approved: boolean;
  weightsBps: PiGoldPolicyWeightsBps;
};

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
  policy: ApprovedPiGoldPolicy;
  nowMs?: number;
};

export type PiGoldEconomicMetrics = {
  modelVersion: string;
  policyVersion: string;
  confidenceFactorBps: number;
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
  if (!input.policy?.approved || !input.policy.version) return null;
  const policyWeights = Object.values(input.policy.weightsBps);
  if (
    policyWeights.length !== 5 ||
    policyWeights.some((weight) => !Number.isInteger(weight) || weight < 0 || weight > 10_000) ||
    policyWeights.reduce((sum, weight) => sum + weight, 0) !== 10_000
  ) return null;
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

  const factorBps = {
    externalMarketAnchor: 10_000,
    liquidityCoverage: Math.floor(liquidityScore * 10_000),
    utilityFulfillment: Math.floor(utilityFulfillment * 10_000),
    economicVelocity: Math.floor(velocityScore * 10_000),
    priceStability: Math.floor(priceStability * 10_000),
  };
  const confidenceFactorBps = Math.floor(
    (
      input.policy.weightsBps.externalMarketAnchor * factorBps.externalMarketAnchor +
      input.policy.weightsBps.liquidityCoverage * factorBps.liquidityCoverage +
      input.policy.weightsBps.utilityFulfillment * factorBps.utilityFulfillment +
      input.policy.weightsBps.economicVelocity * factorBps.economicVelocity +
      input.policy.weightsBps.priceStability * factorBps.priceStability
    ) / 10_000,
  );
  const confidenceFactor = confidenceFactorBps / 10_000;
  const internalPurchasingPowerUsd = input.externalPiUsd * confidenceFactor;
  const externalMarketCapUsd = input.externalPiUsd * input.circulatingPi;
  const internalReferenceValueUsd = internalPurchasingPowerUsd * input.circulatingPi;

  if (![internalPurchasingPowerUsd, externalMarketCapUsd, internalReferenceValueUsd].every(finitePositive)) return null;

  return {
    modelVersion: PIGOLD_MODEL_VERSION,
    policyVersion: input.policy.version,
    confidenceFactorBps,
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
