/**
 * Exact integer helpers derived from the repository's PiRC-207 v2 proposal.
 * These are unit conversions only; they do not calculate market price,
 * internal purchasing power, collateral value or redeemable cash value.
 */
export const ALGORITHM_BASE_MICROS = 10_000_000n;
export const MICRO_PER_PI = ALGORITHM_BASE_MICROS;
export const HEART_THROAT_UNITS_PER_PI = 10_000n;
export const MICRO_PER_HEART_THROAT_UNIT = 1_000n;
export const HEART_THROAT_UNITS_PER_PIGCV = 1_000n;

const SUPPORTED_LAYERS = new Set(["heart", "throat", "crown"]);

function unsignedInteger(value, name = "amount") {
  const text = String(value);
  if (!/^(0|[1-9][0-9]*)$/.test(text)) throw new TypeError(`${name} must be an unsigned integer string`);
  return BigInt(text);
}

export function piDecimalToMicros(value) {
  const text = String(value);
  const match = /^(0|[1-9][0-9]*)(?:\\.([0-9]{1,7}))?$/.exec(text);
  if (!match) throw new TypeError("Pi amount must be a non-negative decimal with at most 7 fractional digits");
  const fraction = (match[2] ?? "").padEnd(7, "0");
  return BigInt(match[1]) * MICRO_PER_PI + BigInt(fraction || "0");
}

export function formatMicroPi(value) {
  const micros = unsignedInteger(value, "microPi");
  const whole = micros / MICRO_PER_PI;
  const fraction = (micros % MICRO_PER_PI).toString().padStart(7, "0");
  return `${whole}.${fraction}`;
}

export function layerUnitsToMicroPi(layerKey, amount) {
  if (!SUPPORTED_LAYERS.has(layerKey)) {
    throw new RangeError(`Conversion for layer '${layerKey}' is not specified by the cited PiRC-207 source`);
  }
  if (layerKey === "heart" || layerKey === "throat") {
    return unsignedInteger(amount) * MICRO_PER_HEART_THROAT_UNIT;
  }
  return piDecimalToMicros(amount);
}

export function layerUnitsToPi(layerKey, amount) {
  return formatMicroPi(layerUnitsToMicroPi(layerKey, amount));
}

/**
 * The source states 1,000 Heart/Throat units = 1 PiGCV.
 * Return the exact rational quantity instead of inventing PiGCV decimals.
 */
export function heartThroatUnitsToPiGcvRatio(amount) {
  return {
    numerator: unsignedInteger(amount).toString(),
    denominator: HEART_THROAT_UNITS_PER_PIGCV.toString(),
    unit: "PiGCV",
  };
}

export function getLayerConversionStatus(layerKey) {
  if (layerKey === "heart" || layerKey === "throat") return "SOURCE_DEFINED";
  if (layerKey === "crown") return "SOURCE_DEFINED";
  return "UNSPECIFIED";
}
