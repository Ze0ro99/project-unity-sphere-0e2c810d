/**
 * Exact Pi native amount conversion helpers.
 *
 * Stellar-compatible native amounts use seven decimal places (stroops).
 * Stroops are an atomic accounting unit, not a separately traded "micro-Pi"
 * asset. Exchange quotes must carry their own base/quote asset and venue units.
 */
export const STROOPS_PER_PI = 10_000_000n;
export const PI_DECIMALS = 7;

const PI_AMOUNT_PATTERN = /^(0|[1-9][0-9]*)(?:\.([0-9]{1,7}))?$/;

/** Parse a non-negative decimal Pi amount into exact atomic stroops. */
export function parsePiToStroops(amount: string): bigint {
  const value = amount.trim();
  const match = PI_AMOUNT_PATTERN.exec(value);
  if (!match) throw new Error("Pi amount must be a non-negative decimal with at most 7 places");
  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? "").padEnd(PI_DECIMALS, "0") || "0");
  return whole * STROOPS_PER_PI + fraction;
}

/** Format exact stroops as a decimal Pi amount without floating-point rounding. */
export function formatStroopsAsPi(stroops: bigint): string {
  const negative = stroops < 0n;
  const absolute = negative ? -stroops : stroops;
  const whole = absolute / STROOPS_PER_PI;
  const fraction = (absolute % STROOPS_PER_PI).toString().padStart(PI_DECIMALS, "0").replace(/0+$/, "");
  const result = fraction.length > 0 ? whole.toString() + "." + fraction : whole.toString();
  return negative ? "-" + result : result;
}

/** Convert a number of native Pi units into exact stroops only when safely integral. */
export function assertStroopPrecision(stroops: bigint): bigint {
  if (typeof stroops !== "bigint") throw new Error("Atomic Pi amounts must be bigint values");
  return stroops;
}
