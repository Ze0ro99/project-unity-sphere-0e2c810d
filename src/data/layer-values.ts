/**
 * PiRC-207 v2 face values.
 * Addresses stay in src/data/layers.ts. Names there do not match this document
 * (Gold/Root Registry vs chakra order). Do not overwrite contract ids from this file.
 *
 * Source: PiRC-207-Token-Layer-Color-System-and-Calculation-Mechanism.md
 * Crown: 10_000_000 micro = 1 mined Pi
 * Heart and Throat: 1_000 units = 1 PiGCV, 10_000 units = 1 Pi, 1 unit = 1_000 micro
 */

export type LayerFace = {
  order: number;
  chakra: string;
  color: string;
  hex: string;
  role: string;
  face: number;
  faceLabel: string;
  microPerMined: number;
};

export const PIRC_207_LAYERS: LayerFace[] = [
  { order: 1, chakra: "Root", color: "Red", hex: "#f85149", role: "Governance", face: 1, faceLabel: "governance unit", microPerMined: 10_000_000 },
  { order: 2, chakra: "Sacral", color: "Orange", hex: "#ff8c42", role: "3141 Orange", face: 3141, faceLabel: "3141", microPerMined: 10_000_000 },
  { order: 3, chakra: "Solar Plexus", color: "Yellow", hex: "#f0d95b", role: "31,140 Yellow", face: 31140, faceLabel: "31140", microPerMined: 10_000_000 },
  { order: 4, chakra: "Heart", color: "Green", hex: "#3fb950", role: "3.14 PiCash", face: 3.14, faceLabel: "3.14 PiCash", microPerMined: 10_000_000 },
  { order: 5, chakra: "Throat", color: "Blue", hex: "#58a6ff", role: "314 banks", face: 314, faceLabel: "314", microPerMined: 10_000_000 },
  { order: 6, chakra: "Third Eye", color: "Indigo", hex: "#6e59d9", role: "314,159 Indigo", face: 314159, faceLabel: "314159", microPerMined: 10_000_000 },
  { order: 7, chakra: "Crown", color: "Purple", hex: "#a970ff", role: "Mined Pi", face: 1, faceLabel: "1 mined = 10,000,000 micro", microPerMined: 10_000_000 },
];
