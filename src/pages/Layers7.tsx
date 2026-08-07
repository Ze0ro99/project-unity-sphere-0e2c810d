import { useQuery } from "@tanstack/react-query";
import { LAYERS, ISSUER, MASTER_REGISTRY } from "@/data/layers";
import { shorten, fetchIssuedAssets, fetchAccount, HORIZON_MAINNET } from "@/lib/pi";
import { Layers, RefreshCw } from "lucide-react";

export default function Layers7() {
  const assetsQ = useQuery({
    queryKey: ["issued-assets", ISSUER],
    queryFn: () => fetchIssuedAssets(ISSUER, HORIZON_MAINNET),
    refetchInterval: 30000,
    retry: 1,
  });
  const issuerQ = useQuery({
    queryKey: ["issuer-account", ISSUER],
    queryFn: () => fetchAccount(ISSUER, HORIZON_MAINNET),
    refetchInterval: 30000,
    retry: 1,
  });

  const byCode = new Map((assetsQ.data ?? []).map((a) => [a.asset_code.toUpperCase(), a]));
  const totalHolders = (assetsQ.data ?? []).reduce((a, x) => a + (x.num_accounts ?? 0), 0);
  const live = !assetsQ.error && !!assetsQ.data?.length;

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Layers size={18} className="text-purple" />
          <h1 className="text-2xl font-bold">7-Layer Token System</h1>
          <span className="chip">PiRC-207</span>
          <span className={`chip ${live ? "" : "text-muted"}`}>
            <span className={`w-2 h-2 rounded-full ${live ? "bg-green" : assetsQ.isFetching ? "bg-gold" : "bg-red"}`} />
            {live ? "live registry" : assetsQ.isFetching ? "syncing…" : "registry offline"}
          </span>
          <button
            onClick={() => { assetsQ.refetch(); issuerQ.refetch(); }}
            className="ml-auto chip hover:bg-panel2"
            aria-label="Refresh registry"
          >
            <RefreshCw size={12} className={assetsQ.isFetching ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        <p className="text-muted text-sm">
          Mainnet registry of the seven color-coded PiRC token layers. Each layer holds a distinct
          monetary role in the sovereign ecosystem. Supply and holder counts stream from Pi Horizon.
        </p>
        <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
          <Row label="Issuer" value={ISSUER} />
          <Row label="Master Registry" value={MASTER_REGISTRY} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <Metric label="Issued Assets" value={assetsQ.data ? String(assetsQ.data.length) : "—"} />
          <Metric label="Total Holders" value={totalHolders ? totalHolders.toLocaleString() : "—"} />
          <Metric label="Trustlines" value={issuerQ.data ? String(issuerQ.data.subentry_count) : "—"} />
          <Metric label="Issuer Ledger" value={issuerQ.data?.last_modified_ledger?.toLocaleString?.() ?? "—"} />
        </div>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LAYERS.map((l) => {
          const a =
            byCode.get(l.name.toUpperCase()) ??
            byCode.get(l.id.toUpperCase()) ??
            byCode.get(`PI${l.id}`.toUpperCase());
          const supply = a ? Number(a.amount) : null;
          return (
            <div key={l.id} className="card p-5 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: l.hex }} />
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-md flex items-center justify-center text-black font-bold"
                  style={{ background: l.hex }}
                >
                  {l.id}
                </span>
                <div>
                  <div className="font-semibold">{l.name}</div>
                  <div className="text-xs text-muted">{l.role}</div>
                </div>
                <span className={`ml-auto chip ${a ? "" : "text-muted"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${a ? "bg-green" : "bg-muted"}`} />
                  {a ? "on-chain" : "registry"}
                </span>
              </div>

              <div className="mt-4 text-xs text-muted">Contract</div>
              <div className="mono text-xs break-all">{l.address}</div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <Metric
                  label="Supply"
                  value={supply === null ? "—" : compact(supply)}
                  positive={supply !== null && supply > 0}
                />
                <Metric label="Holders" value={a ? a.num_accounts.toLocaleString() : "—"} />
                <Metric
                  label="Auth"
                  value={a?.flags?.auth_required ? "gated" : a ? "open" : "—"}
                  positive={!!a && !a.flags?.auth_required}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function compact(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3 bg-panel2/40">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="mono text-xs break-all mt-1">{value}</div>
      <div className="text-[11px] text-muted mt-1">short: {shorten(value, 8, 8)}</div>
    </div>
  );
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-md border border-border py-2 px-1 bg-panel2/40">
      <div className="text-[10px] text-muted uppercase">{label}</div>
      <div className={`text-sm mono font-semibold truncate ${positive ? "text-green" : ""}`}>{value}</div>
    </div>
  );
}
