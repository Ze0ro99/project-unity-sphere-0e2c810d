import { useEffect, useState } from "react";
import { LAYERS, ISSUER, MASTER_REGISTRY } from "@/data/layers";
import { HORIZON_TESTNET, fetchRoot, shorten } from "@/lib/pi";
import { CheckCircle2, XCircle, Loader2, RefreshCw, FlaskConical, ExternalLink, AlertTriangle } from "lucide-react";
import { useI18n } from "@/i18n";
import { useProtocol } from "@/lib/useProtocol";

type Status = "pending" | "ok" | "fail" | "unknown";
type Check = { id: string; label: string; kind: "token" | "contract" | "network"; address: string; status: Status; detail?: string; latencyMs?: number };

// Only contract IDs sourced from the checked-in PiRC registry are listed here.
// These IDs still require Soroban RPC deployment proof; Horizon account lookup is not sufficient.
const CONTRACTS = [
  { id: "PIRC2-SUBSCRIPTION", label: "PiRC-2 Subscriptions (registry reference)", address: "CCUF75B6W3HRJTJD6O7OXNI72HGJ7DERZ5MUNOMFMSK23ME5GUIKPFYV" },
  { id: "PIRC-207-REGISTRY", label: "PiRC-207 Layer Registry (registry reference)", address: MASTER_REGISTRY },
];

export default function Testnet() {
  const { t } = useI18n();
  const tr = t;
  const { observation } = useProtocol(HORIZON_TESTNET);
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
      ? { ...c, status: netOk ? "ok" : "fail", latencyMs: netLat, detail: netOk ? root.network_passphrase : "Unreachable" }
      : c));

    // Sequential-ish (limit concurrency)
    const rest = initial.filter((c) => c.id !== "network");
    for (const c of rest) {
      const start = performance.now();
      let status: Status = "fail";
      let detail = "";
      // C... StrKeys are Soroban contract IDs, not Horizon account IDs.
      // A Horizon 404 cannot prove whether a contract is deployed.
      if (c.address.startsWith("C")) {
        try {
          const response = await fetch(`/v1/assets/pi-testnet/${encodeURIComponent(c.address)}/verification`, {
            headers: { Accept: "application/json" },
          });
          if (!response.ok) {
            status = "unknown";
            detail = `Soroban verification API unavailable (HTTP ${response.status})`;
          } else {
            const proof = await response.json();
            const readback = proof?.checks?.network_readback;
            if (readback === "CONTRACT_INSTANCE_PRESENT") {
              status = "ok";
              detail = "Soroban instance present; code hash and issuer authority remain unverified";
            } else if (readback === "CONTRACT_INSTANCE_NOT_FOUND") {
              status = "fail";
              detail = "No contract instance found on configured Pi Testnet RPC";
            } else if (readback === "INVALID_CONTRACT_ID") {
              status = "fail";
              detail = "Invalid Soroban contract identifier";
            } else {
              status = "unknown";
              detail = "Pi Testnet Soroban RPC readback unavailable or inconclusive";
            }
          }
        } catch (e: any) {
          status = "unknown";
          detail = e?.message ?? "Soroban verification API unavailable";
        }
        const lat = Math.round(performance.now() - start);
        setChecks((prev) => prev.map((x) => x.id === c.id ? { ...x, status, detail, latencyMs: lat } : x));
        continue;
      }
      try {
        const acc = await fetch(`${HORIZON_TESTNET}/accounts/${c.address}`);
        if (acc.ok) {
          const data = await acc.json();
          status = "ok";
          detail = `Horizon account · seq ${data.sequence} · balances ${data.balances?.length ?? 0}`;
        } else if (acc.status === 404) {
          status = "fail";
          detail = "Account not found on this Horizon network";
        } else {
          detail = `Horizon HTTP ${acc.status}`;
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
    { ok: 0, fail: 0, pending: 0, unknown: 0 } as Record<Status, number>,
  );

  return (
    <div className="space-y-4">
      <section className="card p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={18} className="text-orange" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("nav.testnet")}</h1>
              <span className="chip">Pi Testnet</span>
            </div>
            <p className="text-muted text-sm">
              Read-only checks against <span className="mono">{HORIZON_TESTNET}</span>. G... identifiers use Horizon account reads; C... identifiers use the same-origin read-only Soroban verification API. Instance presence does not prove code hash, issuer authority or audit status.
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <Metric label="OK" value={counts.ok} tone="green" />
            <Metric label={tr("Failed")} value={counts.fail} tone="red" />
            <Metric label={tr("Unknown")} value={counts.unknown} tone="muted" />
            <Metric label={tr("Pending")} value={counts.pending} tone="muted" />
          </div>
          <button onClick={run} disabled={running}
            className="px-4 py-2 rounded-md bg-gold text-black text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {running ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {running ? "Verifying…" : "Re-verify"}
          </button>
        </div>
        {rootInfo && (
          <div className="grid md:grid-cols-4 gap-3 mt-4 text-xs">
            <Fact k={tr("Passphrase")} v={rootInfo.network_passphrase} />
            <Fact k="Horizon" v={rootInfo.horizon_version} />
            <Fact k="Core" v={rootInfo.core_version} />
            <Fact k={t("protocol.active")} v={observation.active ? `v${observation.active}` : "—"} />
          </div>
        )}
        {lastRun && <div className="text-[10px] text-muted mt-3">{tr("Last run:")} {lastRun.toLocaleTimeString()}</div>}
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
  const { t: tr } = useI18n();
  const Icon = c.status === "ok" ? CheckCircle2 : c.status === "fail" ? XCircle : c.status === "unknown" ? AlertTriangle : Loader2;
  const tone = c.status === "ok" ? "text-green" : c.status === "fail" ? "text-red" : c.status === "unknown" ? "text-amber-400" : "text-muted";
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center py-2 border-b border-border/50 last:border-0">
      <Icon size={16} className={`${tone} ${c.status === "pending" ? "animate-spin" : ""}`} />
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{c.label}</div>
        <div className="mono text-[10px] text-muted truncate">{shorten(c.address, 10, 8)}{c.detail ? ` · ${c.detail}` : ""}</div>
      </div>
      <div className="flex items-center gap-2">
        {c.latencyMs != null && <span className="mono text-[10px] text-muted">{c.latencyMs}ms</span>}
        {c.address.startsWith("G") && <a href={`https://api.testnet.minepi.com/accounts/${c.address}`} target="_blank" rel="noreferrer"
          className="text-muted hover:text-gold" aria-label={tr("Open Horizon account")}><ExternalLink size={12} /></a>}
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
