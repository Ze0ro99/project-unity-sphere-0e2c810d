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
  getPurchasingPowerLayer,
  layerCasToPiGoldReference,
  piGoldReferenceToLayerCas,
  illustrativeReferenceUsdMicros,
  listPurchasingPowerLayers,
} from "../../assets/js/pirc-purchasing-power-v1.mjs";
