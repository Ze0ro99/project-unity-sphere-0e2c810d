/**
 * Additive PiRC purchasing-power reference policy.
 *
 * This module deliberately does not modify pirc207-layer-math.mjs.
 * It provides versioned internal reference ratios and exact CAS arithmetic.
 * USD figures are illustrative policy inputs, NOT market prices, collateral,
 * redemption promises, or executable swap quotes.
 */
export const POLICY_ID = "pirc-purchasing-power-v1";
export const CAS_PER_WHOLE_UNIT = 10_000_000n;
export const REFERENCE_NUMERAIRE = "USD";
export const REFERENCE_SCENARIO = "illustrative-600000-pigold";
export const EXECUTION_ENABLED = false;

const LAYERS = Object.freeze({
  pigold: Object.freeze({
    unitsPerPiGold: 1n,
    illustrativeUsdMicrosPerWholeUnit: 600_000_000_000n,
  }),
  yellow: Object.freeze({
    unitsPerPiGold: 10n,
    illustrativeUsdMicrosPerWholeUnit: 60_000_000_000n,
  }),
  orange: Object.freeze({
    unitsPerPiGold: 100n,
    illustrativeUsdMicrosPerWholeUnit: 6_000_000_000n,
  }),
  pibank: Object.freeze({
    unitsPerPiGold: 1_000n,
    illustrativeUsdMicrosPerWholeUnit: 600_000_000n,
  }),
  picash: Object.freeze({
    unitsPerPiGold: 10_000n,
    illustrativeUsdMicrosPerWholeUnit: 60_000_000n,
  }),
});

function unsignedBigInt(value, name) {
  if (typeof value === "bigint") {
    if (value < 0n) throw new RangeError(`${name} must be unsigned`);
    return value;
  }
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new TypeError(`${name} must be an unsigned integer string or bigint`);
  }
  return BigInt(value);
}

function layerConfig(layerKey) {
  const config = LAYERS[layerKey];
  if (!config) throw new RangeError(`Unsupported purchasing-power layer: ${layerKey}`);
  return config;
}

/** Return a defensive, JSON-safe view of a layer's policy parameters. */
export function getPurchasingPowerLayer(layerKey) {
  const config = layerConfig(layerKey);
  return Object.freeze({
    policyId: POLICY_ID,
    layerKey,
    unitsPerPiGold: config.unitsPerPiGold.toString(),
    illustrativeUsdMicrosPerWholeUnit: config.illustrativeUsdMicrosPerWholeUnit.toString(),
    executionEnabled: EXECUTION_ENABLED,
  });
}

/**
 * Convert a layer amount in CAS into a PiGold reference amount in CAS.
 * Any unrepresentable remainder is returned explicitly and never discarded.
 * This is reference arithmetic only; it does not execute a swap or transfer.
 */
export function layerCasToPiGoldReference(layerKey, amountCas) {
  const amount = unsignedBigInt(amountCas, "amountCas");
  const { unitsPerPiGold } = layerConfig(layerKey);
  const outputCas = amount / unitsPerPiGold;
  const remainderCas = amount % unitsPerPiGold;
  return Object.freeze({
    policyId: POLICY_ID,
    layerKey,
    inputCas: amount.toString(),
    piGoldReferenceCas: outputCas.toString(),
    remainderCas: remainderCas.toString(),
    executable: false,
  });
}

/** Convert PiGold reference CAS to a layer CAS amount with checked integer inputs. */
export function piGoldReferenceToLayerCas(layerKey, piGoldCas) {
  const amount = unsignedBigInt(piGoldCas, "piGoldCas");
  const { unitsPerPiGold } = layerConfig(layerKey);
  return Object.freeze({
    policyId: POLICY_ID,
    layerKey,
    piGoldReferenceCas: amount.toString(),
    layerAmountCas: (amount * unitsPerPiGold).toString(),
    executable: false,
  });
}

/**
 * Calculate an illustrative USD-micro reference value for an amount in CAS.
 * This output is a display/accounting reference only, never a market quote.
 */
export function illustrativeReferenceUsdMicros(layerKey, amountCas) {
  const amount = unsignedBigInt(amountCas, "amountCas");
  const { illustrativeUsdMicrosPerWholeUnit } = layerConfig(layerKey);
  const value = (amount * illustrativeUsdMicrosPerWholeUnit) / CAS_PER_WHOLE_UNIT;
  return Object.freeze({
    policyId: POLICY_ID,
    layerKey,
    amountCas: amount.toString(),
    usdMicros: value.toString(),
    numeraire: REFERENCE_NUMERAIRE,
    scenario: REFERENCE_SCENARIO,
    executable: false,
  });
}

export function listPurchasingPowerLayers() {
  return Object.keys(LAYERS);
}
