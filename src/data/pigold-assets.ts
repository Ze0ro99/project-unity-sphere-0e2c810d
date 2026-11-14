/**
 * PiGold ecosystem asset catalogue.
 *
 * This is the user-facing economic taxonomy, not a deployment registry.
 * Contract identifiers and logos remain unverified until independent evidence
 * and approved artwork are supplied. PiGold coordinates accounting and routing;
 * it does not custody or merge constituent pool reserves.
 */
export type PiGoldAsset = {
  id: "pigold" | "pibank" | "picash" | "piexchange" | "pigovernance" | "pipurple" | "piyellow";
  name: string;
  symbol: string;
  color: string;
  logoPath: string;
  role: string;
  legacyMapping: string;
  relationship: "coordinator" | "component";
  status: "design";
  description: string;
};

export const PIGOLD_ASSETS: readonly PiGoldAsset[] = [
  {
    id: "pigold",
    name: "PiGold",
    symbol: "πG",
    color: "#d8b56d",
    logoPath: "/token-logos/gold-unmapped.svg",
    role: "Ecosystem coordinator",
    legacyMapping: "PiGold is a proposed coordination/meta layer, not one of the legacy PiRC-207 chakra layers.",
    relationship: "coordinator",
    status: "design",
    description: "Coordinates independent liquidity pools, economic accounting, routing policy and system-wide reporting.",
  },
  {
    id: "pibank",
    name: "PiBank",
    symbol: "πB",
    color: "#4c9de8",
    logoPath: "/token-logos/blue-314.svg",
    role: "Banking and institutional services",
    legacyMapping: "Blue / Throat banking proposal; contract and asset-code mapping remain unverified.",
    relationship: "component",
    status: "design",
    description: "Banking workflows and institutional settlement, subject to verified reserves and authorization.",
  },
  {
    id: "picash",
    name: "PiCash",
    symbol: "πC",
    color: "#35b879",
    logoPath: "/token-logos/green-picash.svg",
    role: "Everyday payments",
    legacyMapping: "Green / Heart PiCash proposal; contract and asset-code mapping remain unverified.",
    relationship: "component",
    status: "design",
    description: "Daily payment and commerce utility with separately accounted balances and pools.",
  },
  {
    id: "piexchange",
    name: "PiExchange",
    symbol: "πX",
    color: "#ed8a42",
    logoPath: "/token-logos/orange-3141.svg",
    role: "Exchange and market access",
    legacyMapping: "Orange / Sacral is a role conflict: legacy Orange is utility; exchange designation is a new proposal.",
    relationship: "component",
    status: "design",
    description: "Exchange venues, order books and pair-specific AMM pools; market quotes are not guaranteed execution.",
  },
  {
    id: "pigovernance",
    name: "PiGovernance",
    symbol: "πGov",
    color: "#dc6268",
    logoPath: "/token-logos/red-governance.svg",
    role: "Governance and policy",
    legacyMapping: "Red / Root governance proposal; contract and asset-code mapping remain unverified.",
    relationship: "component",
    status: "design",
    description: "Proposal, voting, policy approval and change-control workflows.",
  },
  {
    id: "pipurple",
    name: "PiPurple",
    symbol: "πP",
    color: "#9874d8",
    logoPath: "/token-logos/purple-mined-pi.svg",
    role: "Identity and foundational participation",
    legacyMapping: "Purple / Crown mined-Pi proposal; contract and asset-code mapping remain unverified.",
    relationship: "component",
    status: "design",
    description: "Foundational participation and provenance classification; eligibility does not imply redemption rights.",
  },
  {
    id: "piyellow",
    name: "PiYellow",
    symbol: "πY",
    color: "#e4c85c",
    logoPath: "/token-logos/yellow-31140.svg",
    role: "Utility and service access",
    legacyMapping: "Yellow / Solar Plexus utility proposal; contract and asset-code mapping remain unverified.",
    relationship: "component",
    status: "design",
    description: "Utility access, goods and services with fulfillment evidence and separate accounting.",
  },
] as const;

export const PIGOLD_COMPONENTS = PIGOLD_ASSETS.filter((asset) => asset.relationship === "component");
