import { Shield, CheckCircle2, FileCode2, Scale, Lock, Activity, Gauge, Layers } from "lucide-react";

const STANDARDS = [
  { id: "PiRC-101", title: "Sovereign Monetary Standard", desc: "Base-pair discipline; π as sovereign settlement asset.", icon: Scale, status: "enforced" },
  { id: "PiRC-207", title: "7-Layer Token Registry", desc: "Canonical asset identity across the 7 chromatic layers.", icon: Layers, status: "enforced" },
  { id: "PiRC-215", title: "AMM Invariant & Fee Schedule", desc: "Constant-product x·y=k, 30 bps LP fee, invariant guard.", icon: Activity, status: "enforced" },
  { id: "PiRC-227", title: "Slippage & MEV Protection", desc: "min_out enforcement; commit-reveal ready.", icon: Gauge, status: "enforced" },
  { id: "PiRC-251", title: "Oracle Circuit Breaker", desc: "Admin pause on deviation; halts swaps/withdrawals.", icon: Shield, status: "enforced" },
  { id: "PiRC-260", title: "Keeper Protocol", desc: "Decentralized auto-execution bounties (subscriptions).", icon: FileCode2, status: "documented" },
  { id: "PiRC-800", title: "Shielded Settlement (BN254 · Groth16)", desc: "Verifier contract shipped (contracts/bn254_verifier). Commitment mode today; on-chain pairing via --features bn254 on v25+.", icon: Lock, status: "shipped" },
];

const PROTOCOLS = [
  { v: "v21", state: "supported", note: "Soroban GA" },
  { v: "v22", state: "supported", note: "Current mainnet baseline" },
  { v: "v23", state: "supported", note: "Active testnet" },
  { v: "v25", state: "forward-compatible", note: "No gated host fns used" },
  { v: "v26", state: "forward-compatible", note: "SDK 22.x pinned" },
  { v: "v27", state: "forward-compatible", note: "WASM byte-stable" },
  { v: "v28", state: "forward-compatible", note: "Awaiting release notes" },
];

const CHECKS = [
  "Constant-product invariant k' ≥ k verified on every swap",
  "Checked arithmetic on all i128 ops — overflow → Error::Overflow",
  "require_auth on admin, deposit, withdraw, swap",
  "Instance storage for reserves; persistent storage for LP shares",
  "Fee routed to LPs via reserve growth (no admin skim)",
  "Circuit breaker halts swap/deposit/withdraw when paused",
  "min_out enforced pre-transfer (PiRC-227 slippage)",
  "Optional BN254/Groth16 verifier for shielded orders (PiRC-800)",
];

export default function Standards() {
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Exchange · Standards & Compliance</h1>
          <p className="text-sm text-muted mt-1">
            PiDEX AMM adherence to PiRC architecture, ZK stack, and protocol upgrade matrix.
          </p>
        </div>
        <a
          href="https://github.com/Ze0ro99/PiRC/blob/main/contracts/pidex_amm/DEPLOY.md"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 rounded-md border border-border text-sm hover:bg-panel2 mono"
        >
          contracts/pidex_amm/DEPLOY.md ↗
        </a>
      </header>

      <section className="grid md:grid-cols-2 gap-3">
        {STANDARDS.map((s) => (
          <div key={s.id} className="p-4 rounded-lg border border-border bg-panel/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-panel2 flex items-center justify-center">
                <s.icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="mono text-xs text-muted">{s.id}</span>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      s.status === "enforced"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : s.status === "wired"
                        ? "bg-sky-500/10 text-sky-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="font-medium">{s.title}</div>
              </div>
            </div>
            <p className="text-sm text-muted mt-2">{s.desc}</p>
          </div>
        ))}
      </section>

      <section className="p-4 rounded-lg border border-border bg-panel/60">
        <h2 className="font-semibold mb-3">Protocol upgrade matrix</h2>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-xs mono">
          {PROTOCOLS.map((p) => (
            <div key={p.v} className="p-2 rounded border border-border bg-panel2/40">
              <div className="text-base font-bold">{p.v}</div>
              <div className={`text-[10px] uppercase ${p.state === "supported" ? "text-emerald-400" : "text-sky-400"}`}>{p.state}</div>
              <div className="text-muted mt-1">{p.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="p-4 rounded-lg border border-border bg-panel/60">
        <h2 className="font-semibold mb-3">Verification checklist</h2>
        <ul className="grid md:grid-cols-2 gap-2 text-sm">
          {CHECKS.map((c) => (
            <li key={c} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="p-4 rounded-lg border border-border bg-panel/60">
        <h2 className="font-semibold mb-2">Regulatory posture</h2>
        <p className="text-sm text-muted">
          PiDEX is a non-custodial AMM: LP shares and reserves are on-chain, admin has pause-only rights (PiRC-251),
          no fee skim, no privileged mint. Shielded settlement (PiRC-800) is opt-in and travels through an audited
          BN254/Groth16 verifier — plaintext trades remain the default for jurisdictions requiring transparency.
        </p>
      </section>
    </div>
  );
}
