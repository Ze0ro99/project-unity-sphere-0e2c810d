import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ArrowDownUp, Activity, Layers, Cpu, Radio, ShieldCheck, Lock, FlaskConical,
  Wallet, LineChart, Droplets, Boxes, FileCode2, Gauge, Globe2, KeyRound,
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
  { to: "/pidex", title: "Exchange Terminal", desc: "Spot, limit, market & AMM swaps with live candlesticks", icon: ArrowDownUp, group: "Trading", tag: "LIVE" },
  { to: "/pidex#book", title: "Order Book", desc: "Depth heatmap, spread and cumulative liquidity", icon: LineChart, group: "Trading" },
  { to: "/pidex#pool", title: "Liquidity Pools", desc: "Provide / remove liquidity, LP shares & fee accrual", icon: Droplets, group: "Trading", tag: "PiRC-215" },
  { to: "/pidex#account", title: "Treasury & Portfolio", desc: "Balances, deposits, withdrawals and fills export", icon: Wallet, group: "Trading" },

  { to: "/explorer", title: "Chain Explorer", desc: "Ledgers, transactions and accounts on Pi Mainnet", icon: Activity, group: "Blockchain", tag: "LIVE" },
  { to: "/micro-device", title: "Micro-Device", desc: "High-frequency transaction stream & node telemetry", icon: Cpu, group: "Blockchain" },
  { to: "/network", title: "Network Health", desc: "Mainnet, Testnet 1 & 2 — TPS, close time, fail rate", icon: Radio, group: "Blockchain" },
  { to: "/testnet", title: "Testnet Probe", desc: "Contract & issuer verification across test networks", icon: FlaskConical, group: "Blockchain" },

  { to: "/layers", title: "7-Layer Registry", desc: "PiRC-207 colour layers, supply and holder metrics", icon: Layers, group: "Standards", tag: "PiRC-207" },
  { to: "/standards", title: "Standards Compliance", desc: "300+ PiRC standards & v21–v28 protocol matrix", icon: ShieldCheck, group: "Standards" },
  { to: "/bn254", title: "BN254 / ZK Verifier", desc: "Groth16 proof verification, commitment & on-chain mode", icon: Lock, group: "Standards", tag: "PiRC-800" },
  { to: "/standards#contracts", title: "Contract Factory", desc: "Soroban AMM & verifier templates with deploy runbooks", icon: FileCode2, group: "Standards" },
];

const GROUPS = ["Trading", "Blockchain", "Standards"];

const GROUP_ICON: Record<string, LucideIcon> = {
  Trading: Gauge,
  Blockchain: Globe2,
  Standards: KeyRound,
};

export default function Gateways() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-panel/60 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-orange flex items-center justify-center text-black">
            <Boxes size={20} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Sovereign Gateways</h1>
            <p className="text-sm text-muted">Every platform capability, one gateway per feature.</p>
          </div>
        </div>
      </section>

      {GROUPS.map((g) => {
        const GIcon = GROUP_ICON[g];
        return (
          <section key={g} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted mono uppercase tracking-widest">
              <GIcon size={14} /> {g}
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
                        {gate.tag}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{gate.title}</div>
                    <div className="text-xs text-muted mt-1 leading-relaxed">{gate.desc}</div>
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
