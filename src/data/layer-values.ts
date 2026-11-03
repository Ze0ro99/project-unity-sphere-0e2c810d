/**
 * PiRC-207 proposal display values.
 *
 * This file intentionally contains no contract IDs and does not replace
 * src/data/layers.ts, which holds repository-derived registry identifiers.
 * The Gold/Indigo discrepancy remains unresolved; do not infer an alias.
 * These proposal constants are not USD prices or redemption guarantees.
 */
export type ProposalLayerValue = {
  order: number;
  chakra: string;
  color: string;
  hex: string;
  role: string;
  face: number;
  faceLabel: string;
};

export const PIRC_207_LAYERS: readonly ProposalLayerValue[] = [
  { order: 1, chakra: "Root", color: "Red", hex: "#f85149", role: "Governance", face: 1, faceLabel: "GOV" },
  { order: 2, chakra: "Sacral", color: "Orange", hex: "#ff8c42", role: "Mid-tier utility", face: 3141, faceLabel: "3141" },
  { order: 3, chakra: "Solar Plexus", color: "Yellow", hex: "#f0d95b", role: "High-tier utility", face: 31140, faceLabel: "31140" },
  { order: 4, chakra: "Heart", color: "Green", hex: "#3fb950", role: "PiCash / daily utility", face: 3.14, faceLabel: "3.14" },
  { order: 5, chakra: "Throat", color: "Blue", hex: "#58a6ff", role: "Banking / institutional", face: 314, faceLabel: "314" },
  { order: 6, chakra: "Third Eye", color: "Indigo", hex: "#6e59d9", role: "Premium reserve proposal", face: 314159, faceLabel: "314159" },
  { order: 7, chakra: "Crown", color: "Purple", hex: "#a970ff", role: "Mined Pi and fractions", face: 1, faceLabel: "1 mined Pi" },
] as const;
