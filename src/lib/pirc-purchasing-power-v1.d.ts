export const POLICY_ID: "pirc-purchasing-power-v1";
export const CAS_PER_WHOLE_UNIT: bigint;
export const REFERENCE_NUMERAIRE: "USD";
export const REFERENCE_SCENARIO: "illustrative-600000-pigold";
export const EXECUTION_ENABLED: false;
export const PURPLE_SUBUNITS_PER_MINED_PI: bigint;
export const PURPLE_PIGOLD_PER_MINED_PI_BASELINE: bigint;
export const PURPLE_PIGOLD_PER_MINED_PI_ESCROW_TIER: bigint;
export type PurchasingPowerLayerKey = "pigold" | "yellow" | "orange" | "pibank" | "picash";
export interface PurchasingPowerLayer {
  readonly policyId: typeof POLICY_ID;
  readonly layerKey: PurchasingPowerLayerKey;
  readonly unitsPerPiGold: string;
  readonly illustrativeUsdMicrosPerWholeUnit: string;
  readonly executionEnabled: false;
}
export function getPurchasingPowerLayer(layerKey: PurchasingPowerLayerKey): PurchasingPowerLayer;
export function layerCasToPiGoldReference(layerKey: PurchasingPowerLayerKey, amountCas: string | bigint): Readonly<{
  policyId: typeof POLICY_ID; layerKey: PurchasingPowerLayerKey; inputCas: string;
  piGoldReferenceCas: string; remainderCas: string; executable: false;
}>;
export function piGoldReferenceToLayerCas(layerKey: PurchasingPowerLayerKey, piGoldCas: string | bigint): Readonly<{
  policyId: typeof POLICY_ID; layerKey: PurchasingPowerLayerKey; piGoldReferenceCas: string;
  layerAmountCas: string; executable: false;
}>;
export function illustrativeReferenceUsdMicros(layerKey: PurchasingPowerLayerKey, amountCas: string | bigint): Readonly<{
  policyId: typeof POLICY_ID; layerKey: PurchasingPowerLayerKey; amountCas: string;
  usdMicros: string; numeraire: "USD"; scenario: typeof REFERENCE_SCENARIO; executable: false;
}>;
export function listPurchasingPowerLayers(): PurchasingPowerLayerKey[];

export function purpleMinedPiToPiGoldReference(
  minedPiSubunits: string | bigint,
  options?: { tier?: "baseline" | "escrow-migrated"; migrationStatus?: string; migrationEvidenceId?: string }
): Readonly<{
  policyId: typeof POLICY_ID; layerKey: "purple"; tier: "baseline" | "escrow-migrated";
  minedPiSubunits: string; piGoldReferenceCas: string; migrationEvidenceId: string | null; executable: false;
}>;
