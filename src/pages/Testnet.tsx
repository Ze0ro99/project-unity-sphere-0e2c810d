import { useEffect, useState } from "react";
import { LAYERS, ISSUER, MASTER_REGISTRY } from "@/data/layers";
import { HORIZON_TESTNET, fetchRoot, shorten } from "@/lib/pi";
import { CheckCircle2, XCircle, Loader2, RefreshCw, FlaskConical, ExternalLink } from "lucide-react";

type Status = "pending" | "ok" | "fail";
type Check = { id: string; label: string; kind: "token" | "contract" | "network"; address: string; status: Status; detail?: string; latencyMs?: number };

const CONTRACTS = [
  { id: "PIDEX-ROUTER-V1", label: "PiDEX Router", address: "CBPIDEXROUTERV1TESTNET7LAYERSSOROBAN000000000000000000" },
  { id: "PIRC2-SUBSCRIPTION", label: "PiRC-2 Subscriptions", address: "CCUF75B2LZKKEXAMPLEPIRC2SUBSCRIPTIONMAINCONTRACT000000" },
  { id: "PIRC-207-REGISTRY", label: "PiRC-207 Layer Registry", address: MASTER_REGISTRY },
  { id: "PIRC-215-AMM", label: "PiRC-215 AMM", address: "CB215AMMPOOLSOROBANRUSTIMPLEMENTATIONTESTNET0000000000" },
  { id: "PIRC-227-ILLIQUID", label: "PiRC-227 Illiquid AMM", address: "CB227ILLIQUIDAMMSOROBANRUSTIMPLTESTNET000000000000000" },
  { id: "PIRC-251-POL", label: "PiRC-251 POL Routing", address: "CB251POLROUTINGSOROBANRUSTIMPLTESTNET0000000000000000" },
  { id: "PIRC-800-DID", label: "PiRC-800 DID + ZK Reputation", address: "CB800DIDZKREPUTATIONSOROBANIMPLTESTNET0000000000000000" },
  { id: "PIRC-900-ORACLE", label: "PiRC-900 Oracle Circuit Breaker", address: "CB900ORACLECIRCUITBREAKERSOROBANTESTNET00000000000000" },
  { id: "RWA-TOOLKIT", label: "RWA Tokenization Toolkit", address: "CBRWATOOLKITSOROBANRUSTIMPLTESTNETNETWORK00000000000" },
  { id: "REWARD-ENGINE", label: "Reward Engine (PiRC-204)", address: "CBREWARDENGINEPIRC204SOROBANIMPLTESTNET00000000000000" },
  { id: "LEGACY-VAULT", label: "Sovereign Legacy Vault (PQC)", address: "CBLEGACYVAULTPQCFALCONDILITHIUMTESTNET0000000000000000" },
];

export default function Testnet() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [rootInfo, setRootInfo] = useState<any>(null);

  const build = (): Check[] => [
    { id: "network", label: "Pi Testnet Horizon", kind: "network", address: HORIZON_TESTNET, status: "pending" },
    { id: "issuer", label: "Sovereign Issuer Account", kind: "network", address: ISSUER, status: "pending" },
    ...LAYERS.map((l) => ({ id: l.id, label: `${l.id} ${l.name} — ${l.role}`, kind: "token" as const, address: l.address, status: "pending" as Status })),
    ...CONTRACTS.map((c) => ({ id: c.id, label: c.label, kind: "contract" as const, address: c.address, status: "pending" as Status })),
  ];

  const run = async () => {
    setRunning(true);
    const initial = build();
    setChecks(initial);

    // Network root
    const t0 = performance.now();
    let root: any = null;
    try {
      root = await fetchRoot(HORIZON_TESTNET);
      setRootInfo(root);
    } catch {}
    const netLat = Math.round(performance.now() - t0);
    const netOk = !!root?.network_passphrase;

    setChecks((prev) => prev.map((c) => c.id === "network"
      ? { ...c, status: netOk ? "ok" : "fail", latencyMs: netLat, detail: netOk ? `Protocol v${root.core_supported_protocol_version} · ${root.network_passphrase}` : "Unreachable" }
      : c));

    // Sequential-ish (limit concurrency)
    const rest = initial.filter((c) => c.id !== "network");
    for (const c of rest) {
      const start = performance.now();
      let status: Status = "fail";
      let detail = "";
      try {
        // Try account lookup first (works for token issuers / user accounts)
        const acc = await fetch(`${HORIZON_TESTNET}/accounts/${c.address}`);
        if (acc.ok) {
          const data = await acc.json();
          status = "ok";
          detail = `Account · seq ${data.sequence} · balances ${data.balances?.length ?? 0}`;
        } else if (acc.status === 404) {
          // For contract IDs try Soroban ledger entry endpoint pattern
          const ctr = await fetch(`${HORIZON_TESTNET}/ledgers?limit=1`);
          status = ctr.ok ? "fail" : "fail";
          detail = c.kind === "contract" ? "Contract not deployed on testnet (registry-only)" : "Account not funded on testnet";
        } else {
          detail = `HTTP ${acc.status}`;
        }
      } catch (e: any) {
        detail = e?.message ?? "network error";
      }
      const lat = Math.round(performance.now() - start);
      setChecks((prev) => prev.map((x) => x.id === c.id ? { ...x, status, detail, latencyMs: lat } : x));
    }

    setRunning(false);
    setLastRun(new Date());
  };

  useEffect(() => { run(); }, []);

  const counts = checks.reduce(
    (a, c) => ({ ...a, [c.status]: (a as any)[c.status] + 1 }),
    { ok: 0, fail: 0, pending: 0 } as Record<Status, number>,
  );

  return (
    <div className="space-y-4">
      <section className="card p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={18} className="text-orange" />
              <h1 className="text-2xl font-bold">Testnet Verification</h1>
              <span className="chip">Pi Testnet</span>
            </div>
            <p className="text-muted text-sm">
              Live probes against <span className="mono">{HORIZON_TESTNET}</span> for every PiRC-207 layer token, sovereign
              issuer account, and Soroban smart contract in the deployment matrix.
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <Metric label="OK" value={counts.ok} tone="green" />
            <Metric label="Failed" value={counts.fail} tone="red" />
            <Metric label="Pending" value={counts.pending} tone="muted" />
          </div>
          <button onClick={run} disabled={running}
            className="px-4 py-2 rounded-md bg-gold text-black text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {running ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {running ? "Verifying…" : "Re-verify"}
          </button>
        </div>
        {rootInfo && (
          <div className="grid md:grid-cols-4 gap-3 mt-4 text-xs">
            <Fact k="Passphrase" v={rootInfo.network_passphrase} />
            <Fact k="Horizon" v={rootInfo.horizon_version} />
            <Fact k="Core" v={rootInfo.core_version} />
            <Fact k="Protocol" v={String(rootInfo.core_supported_protocol_version)} />
          </div>
        )}
        {lastRun && <div className="text-[10px] text-muted mt-3">Last run: {lastRun.toLocaleTimeString()}</div>}
      </section>

      {(["network", "token", "contract"] as const).map((kind) => {
        const rows = checks.filter((c) => c.kind === kind);
        if (!rows.length) return null;
        return (
          <section key={kind} className="card p-5">
            <h2 className="font-semibold mb-3 capitalize flex items-center gap-2">
              {kind === "token" ? "7-Layer Tokens" : kind === "contract" ? "Smart Contracts" : "Network"}
              <span className="chip">{rows.length}</span>
            </h2>
            <div className="space-y-1">
              {rows.map((c) => <Row key={c.id} c={c} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Row({ c }: { c: Check }) {
  const Icon = c.status === "ok" ? CheckCircle2 : c.status === "fail" ? XCircle : Loader2;
  const tone = c.status === "ok" ? "text-green" : c.status === "fail" ? "text-red" : "text-muted";
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center py-2 border-b border-border/50 last:border-0">
      <Icon size={16} className={`${tone} ${c.status === "pending" ? "animate-spin" : ""}`} />
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{c.label}</div>
        <div className="mono text-[10px] text-muted truncate">{shorten(c.address, 10, 8)}{c.detail ? ` · ${c.detail}` : ""}</div>
      </div>
      <div className="flex items-center gap-2">
        {c.latencyMs != null && <span className="mono text-[10px] text-muted">{c.latencyMs}ms</span>}
        <a href={`https://api.testnet.minepi.com/accounts/${c.address}`} target="_blank" rel="noreferrer"
          className="text-muted hover:text-gold"><ExternalLink size={12} /></a>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "green" | "red" | "muted" }) {
  const cls = tone === "green" ? "text-green" : tone === "red" ? "text-red" : "text-muted";
  return (
    <div>
      <div className={`mono text-2xl font-bold ${cls}`}>{value}</div>
      <div className="text-[10px] text-muted uppercase tracking-wide">{label}</div>
    </div>
  );
}
function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-panel2 border border-border rounded-md p-2">
      <div className="text-[10px] text-muted uppercase tracking-wide">{k}</div>
      <div className="mono truncate">{v}</div>
    </div>
  );
}
