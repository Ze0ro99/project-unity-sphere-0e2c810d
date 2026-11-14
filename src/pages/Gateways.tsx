import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";
import {
  GitBranch,
  ArrowDownUp, Activity, Layers, Cpu, Radio, ShieldCheck, Lock, FlaskConical,
  Wallet, LineChart, Droplets, Boxes, FileCode2, Gauge, Globe2, KeyRound,
  Sigma, ArrowLeftRight, Landmark, ScanFace, Bot, AlertTriangle, Server, GitMerge, Satellite,
} from "lucide-react";

type Gate = {
  to: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  group: string;
  tag?: string;
};

const GATES: Gate[] = [
  { to: "/pidex", title: "Exchange Terminal", desc: "Local order and AMM quote simulation; no on-chain orders or swaps", icon: ArrowDownUp, group: "Trading", tag: "SIMULATION" },
  { to: "/pidex#book", title: "Order Book", desc: "Simulated depth and spread; not a live order book", icon: LineChart, group: "Trading", tag: "SIMULATION" },
  { to: "/pidex#pool", title: "Liquidity Pools", desc: "AMM source and quote tests; no deployed pool reserves or live LP positions", icon: Droplets, group: "Trading", tag: "NOT DEPLOYED" },
  { to: "/pidex#account", title: "Treasury & Portfolio", desc: "Wallet identity and read-only native balance; deposits, withdrawals and fills are disabled or simulated", icon: Wallet, group: "Trading", tag: "READ-ONLY" },

  { to: "/sovereign", title: "Economic Core", desc: "Manifold routing, Φ solvency, WCF & efficiency factors", icon: Sigma, group: "Sovereign", tag: "core/math" },
  { to: "/sovereign#risk", title: "Risk Analytics", desc: "VaR, expected shortfall, drawdown & depth scoring", icon: Gauge, group: "Sovereign", tag: "PiRC-211" },
  { to: "/sovereign#anomaly", title: "Anomaly Detection", desc: "Robust-z dislocation, volume burst & book imbalance", icon: AlertTriangle, group: "Sovereign", tag: "PiRC-208" },
  { to: "/sovereign#agent", title: "Autonomous Keeper", desc: "Policy loop emitting halt, throttle & seed actions", icon: Bot, group: "Sovereign", tag: "PiRC-212" },
  { to: "/bridge", title: "Cross-Chain Bridge", desc: "Reference adapters and policy status; no cross-network asset transfer is enabled", icon: ArrowLeftRight, group: "Sovereign", tag: "NOT ENABLED" },
  { to: "/governance", title: "Governance & Treasury", desc: "Multisig keeper set, L6 voting and vault operations", icon: Landmark, group: "Sovereign", tag: "PiRC-207" },
  { to: "/compliance", title: "Compliance Gateway", desc: "AML/KYC scoring and EU MiCAR alignment tracking", icon: ScanFace, group: "Sovereign", tag: "PiRC-211.5" },

  { to: "/oracle", title: "Oracle & Purchasing Power", desc: "Oracle adapter and basket-index status; only sourced, timestamped observations may be shown as live", icon: Satellite, group: "Sovereign", tag: "PARTIAL" },
  { to: "/economics", title: "Economic Simulator", desc: "Deterministic off-chain scenarios; outputs are not live prices, balances or settlement", icon: LineChart, group: "Sovereign", tag: "SIMULATION" },
  { to: "/infrastructure", title: "Edge Cache & CDN", desc: "SWR cache telemetry, TTL tiers and hit ratio", icon: Server, group: "Standards" },
  { to: "/infrastructure#warehouse", title: "Contract Warehouse", desc: "Build matrix, runners and branch merge ledger", icon: GitMerge, group: "Standards" },
  { to: "/explorer", title: "Chain Explorer", desc: "Read-only ledger and account explorer; network identity is shown per source", icon: Activity, group: "Blockchain", tag: "READ-ONLY" },
  { to: "/micro-device", title: "Micro-Device", desc: "High-frequency transaction stream & node telemetry", icon: Cpu, group: "Blockchain" },
  { to: "/network", title: "Network Health", desc: "Mainnet, Testnet 1 & 2 — TPS, close time, fail rate", icon: Radio, group: "Blockchain" },
  { to: "/testnet", title: "Testnet Probe", desc: "Contract & issuer verification across test networks", icon: FlaskConical, group: "Blockchain" },

  { to: "/layers", title: "7-Layer Registry", desc: "Seven-layer metadata and verification evidence; supply and holder metrics require verified reads", icon: Layers, group: "Standards", tag: "UNVERIFIED" },
  { to: "/standards", title: "Standards Compliance", desc: "300+ PiRC standards & v21–v28 protocol matrix", icon: ShieldCheck, group: "Standards" },
  { to: "/bn254", title: "BN254 / ZK Verifier", desc: "Groth16 proof verification, commitment & on-chain mode", icon: Lock, group: "Standards", tag: "PiRC-800" },
  { to: "/developer-studio", title: "Contract Factory", desc: "Governed template workflow and Testnet release evidence gates", icon: FileCode2, group: "Standards", tag: "SCAFFOLD" },
  { to: "/developer-studio", title: "Developer Studio / Contract Gateway", desc: "Governed contract composer, RAW factory, registry and Testnet release gates", icon: FileCode2, group: "Standards", tag: "GOVERNED" },
  { to: "/developer-studio#raw-factory", title: "RAW Factory", desc: "Physical evidence intake and approved contract-template pipeline", icon: Boxes, group: "Standards", tag: "SCAFFOLD" },
  { to: "/developer-studio#subscriptions", title: "PIRC-2 Subscription Gateway", desc: "Subscription lifecycle and recurring billing implementation status", icon: Wallet, group: "Standards", tag: "NOT VERIFIED" },
  { to: "/developer-studio#marketplace", title: "Contract Marketplace", desc: "Developer contract listings, licensing and escrow readiness", icon: FileCode2, group: "Standards", tag: "NOT IMPLEMENTED" },
  { to: "/developer-studio#quantum", title: "Post-Quantum Security", desc: "Crypto-agility and post-quantum migration readiness", icon: Lock, group: "Standards", tag: "RESEARCH" },
  { to: "/repository", title: "Repository Sync", desc: "Ze0ro99/PiRC branches, CI workflows & key verification", icon: GitBranch, group: "Standards", tag: "LIVE" },
  { to: "/economic-gates#market-data", title: "Market Data Gateway", desc: "Validated PI/USD ticks, venue quorum, freshness and deviation.", icon: Satellite, group: "Economic", tag: "Gate 1" },
  { to: "/economic-gates#utility-commerce", title: "Utility & Commerce Gateway", desc: "Verified merchants, goods, services, inventory and fulfilled orders.", icon: Boxes, group: "Economic", tag: "Gate 2" },
  { to: "/economic-gates#velocity-liquidity", title: "Velocity & Liquidity Gateway", desc: "Reconciled commerce velocity, order-book depth, spread and slippage.", icon: Activity, group: "Economic", tag: "Gate 3" },
  { to: "/economic-gates#solvency-settlement", title: "Solvency & Settlement Gateway", desc: "Verified reserves, liabilities, transaction finality and read-back.", icon: ShieldCheck, group: "Economic", tag: "Gate 4" },
];

const GROUPS = ["Trading", "Sovereign", "Blockchain", "Economic", "Standards"];

const GROUP_ICON: Record<string, LucideIcon> = {
  Trading: Gauge,
  Sovereign: Sigma,
  Blockchain: Globe2,
  Standards: KeyRound,
  Economic: Activity,
};

export default function Gateways() {
  const { t } = useI18n();
  const groupLabels: Record<string, string> = { Trading: t("gate.group.trading"), Sovereign: t("gate.group.sovereign"), Blockchain: t("gate.group.blockchain"), Economic: t("nav.economicGates"), Standards: t("gate.group.standards") };
  const titleLabels: Record<string, string> = { "Exchange Terminal": t("nav.pidex"), "Economic Core": t("nav.sovereign"), "Cross-Chain Bridge": t("nav.bridge"), "Governance & Treasury": t("nav.governance"), "Compliance Gateway": t("nav.compliance"), "Oracle & Purchasing Power": t("nav.oracle"), "Chain Explorer": t("nav.explorer"), "Network Health": t("nav.network"), "7-Layer Registry": t("nav.layers"), "Standards Compliance": t("nav.standards"), "Testnet Probe": t("nav.testnet"), "Repository Sync": t("nav.repository"), "BN254 / ZK Verifier": t("nav.bn254"), "Market Data Gateway": t("gate.marketData.title"), "Utility & Commerce Gateway": t("gate.utility.title"), "Velocity & Liquidity Gateway": t("gate.velocity.title"), "Solvency & Settlement Gateway": t("gate.solvency.title") };
  const descLabels: Record<string, string> = { "Validated PI/USD ticks, venue quorum, freshness and deviation.": t("gate.marketData.desc"), "Verified merchants, goods, services, inventory and fulfilled orders.": t("gate.utility.desc"), "Reconciled commerce velocity, order-book depth, spread and slippage.": t("gate.velocity.desc"), "Verified reserves, liabilities, transaction finality and read-back.": t("gate.solvency.desc") };
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-panel/60 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-orange flex items-center justify-center text-black">
            <Boxes size={20} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("gate.title")}</h1>
            <p className="text-sm text-muted">{t("gate.subtitle")}</p>
          </div>
        </div>
      </section>

      {GROUPS.map((g) => {
        const GIcon = GROUP_ICON[g];
        return (
          <section key={g} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted mono uppercase tracking-widest">
              <GIcon size={14} /> {groupLabels[g] ?? g}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {GATES.filter((x) => x.group === g).map((gate) => (
                <Link
                  key={gate.to + gate.title}
                  to={gate.to}
                  className="group rounded-xl border border-border bg-panel/60 hover:bg-panel2 transition p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <span className="w-10 h-10 rounded-lg bg-panel2 border border-border flex items-center justify-center text-gold group-hover:scale-105 transition">
                      <gate.icon size={18} />
                    </span>
                    {gate.tag && (
                      <span className="text-[10px] mono px-2 py-0.5 rounded-full border border-border text-muted">
                        {gate.tag === "LIVE" ? t("Live") : gate.tag}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{titleLabels[gate.title] ?? t(gate.title)}</div>
                    <div className="text-xs text-muted mt-1 leading-relaxed">{descLabels[gate.desc] ?? t(gate.desc)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
