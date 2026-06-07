// Unified registry of PiRC standards, 7-layer Omni-Matrix, smart contracts,
// and the 7-tier fairness model — derived from Ze0ro99/PiRC, PiRC-Alpha-Hub,
// and Organizing-the-Earth's-resources repositories.

export interface PiRCStandard {
  id: string;
  title: string;
  category: "Monetary" | "Governance" | "Identity" | "DeFi" | "RWA" | "Security" | "Oracle" | "Custody" | "Infra";
  status: "Final" | "Active" | "Draft" | "Review";
  summary: string;
}

const baseStandards: PiRCStandard[] = [
  { id: "PiRC-01", title: "Foundation Charter", category: "Infra", status: "Final", summary: "Ecosystem-wide constitutional charter for the PiRC sovereign architecture." },
  { id: "PiRC-02", title: "Sovereign Monetary Standard", category: "Monetary", status: "Final", summary: "QWF, IPPR and $REF token logic — defines Pi's reflexive monetary base." },
  { id: "PiRC-03", title: "Registry Matrix", category: "Infra", status: "Final", summary: "Canonical registry for all on-chain artifacts and standards." },
  { id: "PiRC-04", title: "Identity & ZK Proofs", category: "Identity", status: "Active", summary: "Pioneer identity attestations with zero-knowledge proof primitives." },
  { id: "PiRC-05", title: "Cross-Chain Portability", category: "Infra", status: "Active", summary: "Soroban ↔ EVM ↔ Cosmos bridges with circuit-breaker guarantees." },
  { id: "PiRC-06", title: "AI Oracles (DOAM)", category: "Oracle", status: "Active", summary: "Decentralized Oracle Aggregation Model with multi-sig median feeds." },
  { id: "PiRC-07", title: "Governance Execution", category: "Governance", status: "Final", summary: "Quadratic voting, proposal lifecycle, timelock and emergency veto." },
  { id: "PiRC-08", title: "RWA Tokenization", category: "RWA", status: "Active", summary: "Real-world asset tokenization framework with custody attestations." },
  { id: "PiRC-09", title: "Liquidity & AMM", category: "DeFi", status: "Active", summary: "Constant-product AMM and concentrated-liquidity pools for Pi pairs." },
  { id: "PiRC-10", title: "Lending & Risk", category: "DeFi", status: "Active", summary: "Risk-tiered lending markets with health-factor liquidation." },
  { id: "PiRC-11", title: "Treasury Yield", category: "DeFi", status: "Draft", summary: "Treasury-grade yield strategies governed by the Justice Engine." },
  { id: "PiRC-12", title: "Institutional Custody", category: "Custody", status: "Review", summary: "MPC custody primitives for institutional Pioneers." },
  { id: "PiRC-13", title: "Security & Justice", category: "Security", status: "Final", summary: "Divine Justice Engine — wallet freezing, recovery, restorative jurisprudence." },
  { id: "PiRC-14", title: "Ecosystem Finalization", category: "Governance", status: "Active", summary: "Mainnet promotion checklist and EU MiCAR alignment." },
  { id: "PiRC-45", title: "Multi-Religious Jurisprudence", category: "Security", status: "Active", summary: "Pluralistic dispute resolution framework integrated with the Justice Engine." },
  { id: "PiRC-101", title: "Quantum Wealth Factor (QWF)", category: "Monetary", status: "Final", summary: "Sovereign Multiplier capped at 10,000,000 with Φ guardrail." },
  { id: "PiRC-202", title: "$REF Settlement Token", category: "Monetary", status: "Active", summary: "Reflexive Ecosystem Fiat, USD-priced, Pi-collateralized." },
  { id: "PiRC-203", title: "WCF Utility Gating", category: "Identity", status: "Active", summary: "Pioneer Mined-status verification via on-chain snapshots." },
  { id: "PiRC-204", title: "PiDEX Sovereign Matrix", category: "DeFi", status: "Active", summary: "Decentralized exchange layer with native Pi liquidity routing." },
  { id: "PiRC-205", title: "Keeper Protocol", category: "DeFi", status: "Active", summary: "Automated keeper network with on-chain signatures on Pi Testnet." },
  { id: "PiRC-206", title: "Post-Quantum Crypto", category: "Security", status: "Final", summary: "PQ-secure key exchange and signature primitives." },
  { id: "PiRC-260", title: "Divine Justice v2", category: "Security", status: "Active", summary: "Forensic multi-sig, 6-month liquidity lock, biometric re-verification." },
];

// Expand into the 300+ standards index by generating sub-standards per family.
export const PIRC_STANDARDS: PiRCStandard[] = (() => {
  const out: PiRCStandard[] = [...baseStandards];
  const families: Array<{ prefix: string; category: PiRCStandard["category"]; title: string }> = [
    { prefix: "PiRC-3", category: "Infra", title: "Registry Extension" },
    { prefix: "PiRC-4", category: "Identity", title: "Identity Extension" },
    { prefix: "PiRC-5", category: "Infra", title: "Bridge Extension" },
    { prefix: "PiRC-6", category: "Oracle", title: "Oracle Extension" },
    { prefix: "PiRC-7", category: "Governance", title: "Governance Extension" },
    { prefix: "PiRC-8", category: "RWA", title: "RWA Extension" },
    { prefix: "PiRC-9", category: "DeFi", title: "DeFi Extension" },
    { prefix: "PiRC-21", category: "Custody", title: "Custody Extension" },
    { prefix: "PiRC-22", category: "Security", title: "Security Hardening" },
    { prefix: "PiRC-23", category: "Monetary", title: "Monetary Refinement" },
    { prefix: "PiRC-24", category: "Oracle", title: "Feed Refinement" },
    { prefix: "PiRC-25", category: "Governance", title: "Council Extension" },
    { prefix: "PiRC-26", category: "Security", title: "Justice Refinement" },
    { prefix: "PiRC-27", category: "DeFi", title: "Liquidity Refinement" },
    { prefix: "PiRC-28", category: "RWA", title: "Asset Class Refinement" },
    { prefix: "PiRC-29", category: "Infra", title: "Telemetry Extension" },
  ];
  const statuses: PiRCStandard["status"][] = ["Active", "Draft", "Review", "Final"];
  families.forEach((f) => {
    for (let i = 0; i < 20; i++) {
      const id = `${f.prefix}${String(i).padStart(2, "0")}`;
      out.push({
        id,
        title: `${f.title} ${i + 1}`,
        category: f.category,
        status: statuses[(i + f.prefix.length) % statuses.length],
        summary: `${f.title} module ${i + 1} — ratified under ${f.prefix} family for the PiRC sovereign network.`,
      });
    }
  });
  return out;
})();

// ───────────────────────── 7-Layer Omni-Matrix ─────────────────────────
export interface OmniLayer {
  id: string;
  layer: string;
  color: string;
  nodeCount: number;
  health: "Optimal" | "Good" | "Warning" | "Critical";
  volume: string;
  description: string;
}

export const OMNI_LAYERS: OmniLayer[] = [
  { id: "L1", layer: "Physical",      color: "#ff6b35", nodeCount: 1560, health: "Optimal", volume: "1.2M",  description: "Validator hardware, mobile mining nodes and physical relays." },
  { id: "L2", layer: "Data Link",     color: "#f59e0b", nodeCount: 1300, health: "Good",    volume: "800k",  description: "Consensus link layer — block propagation and gossip." },
  { id: "L3", layer: "Network",       color: "#eab308", nodeCount: 3000, health: "Optimal", volume: "3.5M",  description: "Soroban RPC routing, cross-chain bridges and circuit-breakers." },
  { id: "L4", layer: "Transport",     color: "#22c55e", nodeCount: 2200, health: "Warning", volume: "4.1M",  description: "Payment lifecycle, oracle transport and DOAM medianization." },
  { id: "L5", layer: "Session",       color: "#06b6d4", nodeCount: 1000, health: "Optimal", volume: "1.5M",  description: "Pi SDK sessions, authentication and identity attestations." },
  { id: "L6", layer: "Presentation",  color: "#6366f1", nodeCount:  850, health: "Optimal", volume: "900k",  description: "App-layer rendering, i18n and accessibility surfaces." },
  { id: "L7", layer: "Application",   color: "#d4af37", nodeCount: 4500, health: "Optimal", volume: "8.2M",  description: "End-user dApps, marketplaces and Pioneer experiences." },
];

// ───────────────────────── 7-Tier Fairness Standard ─────────────────────────
export interface FairnessTier {
  tier: number;
  name: string;
  weight: number; // 0..1
  description: string;
}

export const FAIRNESS_TIERS: FairnessTier[] = [
  { tier: 1, name: "Pioneer Equity",         weight: 0.98, description: "Every verified Pioneer receives an equal baseline allocation." },
  { tier: 2, name: "Contribution Merit",     weight: 0.94, description: "Active mining, security circles and referral graph contribution." },
  { tier: 3, name: "Network Custody",        weight: 0.91, description: "Node operators, validators and bridge custodians." },
  { tier: 4, name: "Liquidity Provisioning", weight: 0.88, description: "AMM, lending and treasury liquidity contributors." },
  { tier: 5, name: "Sovereign Compliance",   weight: 0.85, description: "EU MiCAR / regional compliance attestations." },
  { tier: 6, name: "Restorative Justice",    weight: 0.82, description: "Divine Justice Engine — recovery and victim restitution priority." },
  { tier: 7, name: "Quantum Guardrail",      weight: 0.79, description: "Post-quantum integrity audits and Φ guardrail enforcement." },
];

// ───────────────────────── Smart Contract Registry ─────────────────────────
export interface ContractEntry {
  id: string;
  name: string;
  family: "Vault" | "Token" | "DEX" | "Lending" | "Governance" | "Identity" | "RWA" | "Justice" | "Oracle" | "Bridge";
  status: "Active" | "Deploying" | "Audited" | "Sunset";
  tvl: string;
  audit: "Passed" | "Pending" | "In Review";
  network: "Pi Testnet" | "Pi Mainnet";
}

const FAMILIES: ContractEntry["family"][] = ["Vault","Token","DEX","Lending","Governance","Identity","RWA","Justice","Oracle","Bridge"];
const STATUSES: ContractEntry["status"][] = ["Active","Deploying","Audited","Sunset"];
const AUDITS: ContractEntry["audit"][] = ["Passed","Pending","In Review"];

export const CONTRACT_REGISTRY: ContractEntry[] = Array.from({ length: 320 }, (_, i) => {
  const fam = FAMILIES[i % FAMILIES.length];
  return {
    id: `PIRC-C-${String(i + 1).padStart(4, "0")}`,
    name: `${fam} Module ${i + 1}`,
    family: fam,
    status: STATUSES[i % STATUSES.length],
    tvl: `$${((i * 137) % 9_500_000 + 12_500).toLocaleString()}`,
    audit: AUDITS[i % AUDITS.length],
    network: i % 5 === 0 ? "Pi Mainnet" : "Pi Testnet",
  };
});

// ───────────────────────── Justice Engine Cases ─────────────────────────
export interface JusticeCase {
  id: string;
  wallet: string;
  status: "Frozen" | "Under Review" | "Recovered" | "Released";
  priority: "Critical" | "High" | "Medium" | "Low";
  amount: string;
  opened: string;
}

export const JUSTICE_CASES: JusticeCase[] = Array.from({ length: 8 }, (_, i) => ({
  id: `DJ-${2025}-${String(i + 1).padStart(4, "0")}`,
  wallet: `GD…${(Math.random().toString(36).slice(2, 6) + "XYZ").toUpperCase()}`,
  status: (["Frozen","Under Review","Recovered","Released"] as const)[i % 4],
  priority: (["Critical","High","Medium","Low"] as const)[i % 4],
  amount: `π ${((i + 1) * 1284.5).toFixed(2)}`,
  opened: `${i + 1}d ago`,
}));
