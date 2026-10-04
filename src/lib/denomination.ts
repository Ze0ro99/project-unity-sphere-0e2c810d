/**
 * PiRC denomination engine
 * -----------------------------------------------------------------------------
 * Application-layer accounting only. This does not rewrite Pi mainnet balances
 * and it is not an official Pi Core Team price.
 *
 * Protocol fact: Pi (Stellar) native amounts use 7 decimal places.
 *   1 mined Pi = 10_000_000 stroops = 10_000_000 micro-Pi
 *
 * Market rule requested for this app:
 *   the unit listed on external venues is treated as 1 micro-Pi
 *   purchasing power of 1 mined Pi = live venue spot * 10_000_000
 *   the product moves with the spot; 2_248_000 is a fallback, not a peg
 */

export const MICRO_PER_MINED = 10_000_000n;
export const MICRO_PER_MINED_N = 10_000_000;

/** PiRC-207 face constants. CEX parity is micro, not these face numbers. */
export const LAYER_FACE = {
  red: 1,
  orange: 3141,
  yellow: 31140,
  green: 3.14,
  blue: 314,
  indigo: 314159,
  purple: 1,
} as const;

export const HEART_THROAT = {
  unitsPerGcv: 1_000,
  unitsPerMined: 10_000,
  microPerUnit: 1_000,
} as const;

export type UnitKind = "mined" | "micro" | "layer";

export type Quote = {
  spotMicroUsd: number;
  trusted: boolean;
  sources: number;
  asOf: number;
};

export function isPositive(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

/** Integer stroop/micro conversion. Prefer this over float for ledger rows. */
export function minedToMicro(mined: bigint): bigint {
  if (mined < 0n) throw new Error("mined amount must be >= 0");
  return mined * MICRO_PER_MINED;
}

export function microToMined(micro: bigint): { whole: bigint; remainder: bigint } {
  if (micro < 0n) throw new Error("micro amount must be >= 0");
  return { whole: micro / MICRO_PER_MINED, remainder: micro % MICRO_PER_MINED };
}

export function minedFloatToMicro(mined: number): number {
  if (!Number.isFinite(mined)) return NaN;
  return mined * MICRO_PER_MINED_N;
}

export function microFloatToMined(micro: number): number {
  if (!Number.isFinite(micro)) return NaN;
  return micro / MICRO_PER_MINED_N;
}

/**
 * Live internal purchasing power of 1 mined Pi, in USD reference units.
 * Falls back only when no venue spot is available.
 */
export function purchasingPowerUsd(spotMicroUsd: number, fallback = 2_248_000): number {
  return isPositive(spotMicroUsd) ? spotMicroUsd * MICRO_PER_MINED_N : fallback;
}

/** External indicator: venue price of 1 listed micro-Pi. */
export function externalMicroUsd(q: Quote): number {
  return q.spotMicroUsd;
}

/** Internal indicator: reference value of 1 mined Pi. */
export function internalMinedUsd(q: Quote, fallback = 2_248_000): number {
  return purchasingPowerUsd(q.spotMicroUsd, fallback);
}

/**
 * Classify a Horizon native amount.
 * Horizon `amount` for native Pi is already in mined Pi (7 decimals).
 * Exchange fills in this app are micro units.
 */
export function classifyAmount(amount: number, source: "horizon-native" | "exchange-fill") {
  if (source === "horizon-native") {
    const mined = amount;
    return {
      kind: "mined" as const,
      mined,
      micro: minedFloatToMicro(mined),
      label: "mined Pi",
    };
  }
  const micro = amount;
  return {
    kind: "micro" as const,
    mined: microFloatToMined(micro),
    micro,
    label: "exchange micro-Pi",
  };
}

/** PiRC-207 Heart/Throat: 10_000 units = 1 mined Pi, 1 unit = 1_000 micro. */
export function heartThroatToMined(units: number): number {
  return units / HEART_THROAT.unitsPerMined;
}

export function heartThroatToMicro(units: number): number {
  return units * HEART_THROAT.microPerUnit;
}

/**
 * Layer display value in mined-Pi reference, using the documented face constant
 * as a unit size, then priced from the live micro spot.
 * Purple/Crown is the mined unit itself.
 */
export function layerValueUsd(face: number, spotMicroUsd: number): number {
  if (!isPositive(spotMicroUsd) || !Number.isFinite(face)) return NaN;
  return face * spotMicroUsd * MICRO_PER_MINED_N;
}
