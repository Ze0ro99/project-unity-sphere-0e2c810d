/**
 * PiGold ecosystem asset catalogue.
 *
 * This is the user-facing economic taxonomy, not a deployment registry.
 * Contract identifiers and logos remain unverified until independent evidence
 * and approved artwork are supplied. PiGold coordinates accounting and routing;
 * it does not custody or merge constituent pool reserves.
 */
export type PiGoldAsset = {
  id: "pigold" | "pibank" | "picash" | "piexchange" | "pigovernance" | "pipurple" | "piyellow" | "ousd";
  name: string;
  symbol: string;
  color: string;
  logoPath: string;
  role: string;
  legacyMapping: string;
  relationship: "coordinator" | "component";
  status: "design" | "test-only";
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
    name: "PiOrange",
    symbol: "πO",
    color: "#ed8a42",
    logoPath: "/token-logos/orange-3141.svg",
    role: "Mid-tier utility and settlement access",
    legacyMapping: "Orange / Sacral utility tier retained; legacy asset ID piexchange is preserved as a compatibility key only.",
    relationship: "component",
    status: "design",
    description: "Mid-tier utility and settlement layer. PiDEX remains a separate exchange and routing service, not the Orange asset itself.",
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
    id: "ousd",
    name: "OUSD",
    symbol: "OUSD",
    color: "#6f9fd8",
    logoPath: "/token-logos/ousd-test-placeholder.svg",
    role: "USD-denominated test settlement profile",
    legacyMapping: "Additional test-only asset; it is not a replacement for any of the seven legacy layers.",
    relationship: "component",
    status: "test-only",
    description: "Interface and liability-lifecycle test asset only. No USD peg, reserve backing, custody, redemption or production issuer is verified.",
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
