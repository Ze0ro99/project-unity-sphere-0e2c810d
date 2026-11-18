import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Coins, Database, RefreshCw, ShieldCheck } from "lucide-react";
import {
  fetchOusdPublicStatus,
  formatOusdAtomic,
  formatUsdMicros,
  type OusdPublicStatus,
} from "@/lib/ousd-status";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: OusdPublicStatus; generatedAt: string };

function Chip({ children, gold = false }: { children: ReactNode; gold?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${gold ? "border-[#d8b56d]/60 bg-[#d8b56d]/10 text-[#e7c982]" : "border-border bg-panel text-muted"}`}>
      {children}
    </span>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-1 text-[11px] text-muted">{description}</p>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mono mt-2 break-words text-lg font-semibold">{value}</div>
      <p className="mt-1 text-[11px] text-muted">{note}</p>
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "active_testnet": return "TESTNET DEPLOYED";
    case "deployed_unverified": return "DEPLOYED · UNVERIFIED";
    case "paused": return "PAUSED";
    case "reconciliation_required": return "RECONCILIATION REQUIRED";
    case "source_only_not_deployed":
    default: return "SOURCE ONLY · NOT DEPLOYED";
  }
}

export default function OUSD() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetchOusdPublicStatus();
      setState({ kind: "ready", data: response.data, generatedAt: response.generated_at });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "OUSD status is unavailable.",
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const data = state.kind === "ready" ? state.data : null;
  const operationalState = data?.operational_state ?? "STATUS_UNAVAILABLE";

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-[#8d7444]/50 bg-[radial-gradient(ellipse_at_top_right,rgba(216,181,109,.20),transparent_44%),linear-gradient(135deg,#101a2c,#111827_55%,#1a2030)] p-5 sm:p-7">
        <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-[#d8b56d]/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#d8b56d]/60 bg-[#d8b56d]/15 text-[#e7c982]">
              <Coins size={28} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#f0dfb4] sm:text-3xl">OUSD</h1>
                <Chip gold>TESTNET 1 ONLY</Chip>
                <Chip>READ ONLY</Chip>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Test-only USD-denominated accounting and settlement token architecture. This dashboard reports
                attestor metadata and on-chain readback; it does not claim official Pi status, USD backing, a peg,
                or guaranteed redemption.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => void load()} disabled={refreshing}
            className="inline-flex items-center rounded-lg border border-white/20 px-3 py-2 text-xs text-white transition hover:bg-white/10 disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? "mr-2 animate-spin" : "mr-2"} />
            Refresh
          </button>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          <span>Network: Pi Testnet 1</span><span>•</span>
          <span>Public status source: Supabase read-only feed</span><span>•</span>
          <span>Mainnet writes disabled</span>
        </div>
      </section>

      {state.kind === "error" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-400" size={18} />
          <div>
            <div className="text-sm font-semibold">OUSD status feed unavailable</div>
            <p className="mt-1 text-xs text-muted">{state.message}</p>
            <p className="mt-1 text-xs text-muted">No balances, reserves, prices, or deployment state are inferred when the source cannot be read.</p>
          </div>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Contract state" value={data ? statusLabel(data.status) : "UNKNOWN"} note={data?.controller_contract_id ? `Controller ${data.controller_contract_id}` : "No verified controller contract ID"} />
        <Stat label="Attestor-verified reserve" value={data ? formatUsdMicros(data.attestor_verified_reserve_usd_micros) : "UNKNOWN"} note="Gross verified reserve; paid settlements are deducted from current backing" />
        <Stat label="Outstanding liabilities" value={data ? formatUsdMicros(data.outstanding_usd_micros) : "UNKNOWN"} note={data ? `Redemption pending: ${formatUsdMicros(data.redemption_pending_usd_micros)}` : "Waiting for source readback"} />
        <Stat label="OUSD token supply" value={data ? formatOusdAtomic(data.token_supply_atomic) : "UNKNOWN"} note="7 decimals · supply must be read back from the token contract" />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Panel title="Reserve and settlement controls" description="Integer accounting with explicit evidence and a separate payout verifier.">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-muted">Operational state</span><Chip>{operationalState}</Chip></div>
            <div className="flex justify-between gap-3"><span className="text-muted">Backing after paid settlements</span><span className="mono">{data ? formatUsdMicros(data.backing_reserve_usd_micros) : "UNKNOWN"}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">Coverage ratio</span><span className="mono">{data?.coverage_ratio ? `${Number(data.coverage_ratio).toFixed(4)}×` : "NOT AVAILABLE"}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">Paid and burned</span><span className="mono">{data ? formatUsdMicros(data.paid_and_burned_usd_micros) : "UNKNOWN"}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">Latest reserve ledger</span><span className="mono">{data?.latest_verified_reserve_ledger ?? "NOT READ BACK"}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">Latest contract readback</span><span className="mono">{data?.latest_readback_ledger ?? "NOT READ BACK"}</span></div>
            <p className="border-t border-border pt-3 text-[11px] text-muted">
              Coverage = (gross verified reserve − paid and burned settlements) ÷ outstanding liabilities. It is not a market price, peg, solvency opinion, or promise to redeem.
            </p>
          </div>
        </Panel>

        <Panel title="Contract identity" description="Deployment and code identity are shown only after independent readback.">
          <div className="space-y-3 text-xs">
            <div><div className="text-muted">OUSD test token</div><div className="mono mt-1 break-all">{data?.token_contract_id ?? "NOT DEPLOYED"}</div></div>
            <div><div className="text-muted">Reserve controller</div><div className="mono mt-1 break-all">{data?.controller_contract_id ?? "NOT DEPLOYED"}</div></div>
            <div><div className="text-muted">Token WASM hash</div><div className="mono mt-1 break-all">{data?.token_code_hash ?? "NOT VERIFIED"}</div></div>
            <div><div className="text-muted">Controller WASM hash</div><div className="mono mt-1 break-all">{data?.controller_code_hash ?? "NOT VERIFIED"}</div></div>
            <div className="flex justify-between gap-3 border-t border-border pt-3"><span className="text-muted">Protocol version</span><span className="mono">{data?.protocol_version ?? "—"}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">Last readback</span><span className="mono">{data?.last_readback_at ? new Date(data.last_readback_at).toLocaleString() : "—"}</span></div>
          </div>
        </Panel>
      </section>

      <Panel title="OUSD lifecycle" description="All token movements are testnet-only. External USD payout remains an independently attested off-chain action.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["01 · Reserve attestation", "An authorized verifier records a positive reserve amount and evidence hash. Raw bank documents are never stored on-chain or in the public feed."],
            ["02 · Liability issuance", "The controller checks available reserve and mints 7-decimal test OUSD using checked integer conversion."],
            ["03 · Beneficiary approval", "The holder approves the controller; redemption request transfers OUSD into controller escrow."],
            ["04 · External settlement", "A separate payout verifier records an exact-amount settlement attestation. This is an off-chain trust boundary."],
            ["05 · Atomic burn", "The controller burns escrowed OUSD in the same Soroban transaction that marks the liability paid and updates accounting."],
            ["06 · Readback and audit", "The indexer reconciles contract IDs, WASM hashes, events, reserve snapshots and integer totals."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-lg border border-border bg-panel/50 p-3">
              <div className="text-xs font-semibold">{title}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{description}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Economic and security invariants">
        <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted">
          <div className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-500" /> 7-decimal token precision; USD micros convert to token atomic units using checked multiplication by 10.</div>
          <div className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-500" /> Minting is restricted to an allowlisted controller; user redemption requires allowance and escrow.</div>
          <div className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-500" /> Escrowed tokens burn atomically with payout confirmation; no deferred burn backlog is trusted.</div>
          <div className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-500" /> Private reserve, liability and evidence records are service-role-only; the public endpoint returns aggregates only.</div>
        </div>
      </Panel>

      {state.kind === "ready" && (
        <p className="text-right text-[10px] text-muted">Last status response: {new Date(state.generatedAt).toLocaleString()}</p>
      )}
    </div>
  );
}
