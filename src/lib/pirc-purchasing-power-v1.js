/**
 * Typed application entry point for the additive purchasing-power policy.
 * All arithmetic remains in the shared, exact BigInt implementation.
 */
export {
  POLICY_ID,
  CAS_PER_WHOLE_UNIT,
  REFERENCE_NUMERAIRE,
  REFERENCE_SCENARIO,
  EXECUTION_ENABLED,
  PURPLE_SUBUNITS_PER_MINED_PI,
  PURPLE_PIGOLD_PER_MINED_PI_BASELINE,
  PURPLE_PIGOLD_PER_MINED_PI_ESCROW_TIER,
  purpleMinedPiToPiGoldReference,
  getPurchasingPowerLayer,
  layerCasToPiGoldReference,
  piGoldReferenceToLayerCas,
  illustrativeReferenceUsdMicros,
  listPurchasingPowerLayers,
} from "../../assets/js/pirc-purchasing-power-v1.mjs";
