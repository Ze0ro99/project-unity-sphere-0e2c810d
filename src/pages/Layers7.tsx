import { useQuery } from "@tanstack/react-query";
import { LAYERS, ISSUER, MASTER_REGISTRY } from "@/data/layers";
import { shorten, fetchIssuedAssets, fetchAccount, isValidStrKey, HORIZON_TESTNET } from "@/lib/pi";
import { Layers, RefreshCw } from "lucide-react";

export default function Layers7() {
  const issuerValid = isValidStrKey(ISSUER, "G");

  // Seven-layer issuer data is intentionally pinned to Pi Testnet.
  const assetsQ = useQuery({
    queryKey: ["issued-assets", "pi-testnet", ISSUER],
    queryFn: () => fetchIssuedAssets(ISSUER, HORIZON_TESTNET),
    refetchInterval: 30000,
    retry: 1,
    enabled: issuerValid,
  });
  const issuerQ = useQuery({
    queryKey: ["issuer-account", "pi-testnet", ISSUER],
    queryFn: () => fetchAccount(ISSUER, HORIZON_TESTNET),
    refetchInterval: 30000,
    retry: 1,
    enabled: issuerValid,
  });

  const totalHolders = (assetsQ.data ?? []).reduce((sum, asset) => sum + (asset.num_accounts ?? 0), 0);
  const issuerDataLoaded = !assetsQ.error && assetsQ.data !== undefined;

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Layers size={18} className="text-purple" />
          <h1 className="text-2xl font-bold">7-Layer Token System</h1>
          <span className="chip">PiRC-207</span>
          <span className={`chip ${issuerDataLoaded ? "" : "text-muted"}`}>
            <span className={`w-2 h-2 rounded-full ${issuerDataLoaded ? "bg-green" : assetsQ.isFetching ? "bg-gold" : "bg-red"}`} />
            {issuerDataLoaded ? "Pi Testnet issuer data loaded" : assetsQ.isFetching ? "syncing…" : "Testnet data unavailable"}
          </span>
          <button
            onClick={() => { assetsQ.refetch(); issuerQ.refetch(); }}
            className="ml-auto chip hover:bg-panel2"
            aria-label="Refresh Testnet issuer data"
          >
            <RefreshCw size={12} className={assetsQ.isFetching ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        <p className="text-muted text-sm">
          Pi Testnet view of the seven proposed PiRC token layers. Issuer account metrics are read from Pi Testnet Horizon.
          Per-layer asset-code mapping and Soroban contract deployment remain unverified until exact network evidence is available.
        </p>
        <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
          <Row label="Pi Testnet issuer account" value={ISSUER} />
          <Row label="Master registry reference" value={MASTER_REGISTRY} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <Metric label="Issued assets" value={assetsQ.data ? String(assetsQ.data.length) : "—"} />
          <Metric label="Issuer asset holders*" value={totalHolders ? totalHolders.toLocaleString() : "—"} />
          <Metric label="Account subentries" value={issuerQ.data ? String(issuerQ.data.subentry_count) : "—"} />
          <Metric label="Last modified ledger" value={issuerQ.data?.last_modified_ledger?.toLocaleString?.() ?? "—"} />
        </div>
        <p className="text-xs text-muted mt-2">*Holder count is the sum of returned issuer-asset account counts; it is not a unique-holder count across assets.</p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LAYERS.map((layer) => (
          <div key={layer.id} className="card p-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: layer.hex }} />
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-md flex items-center justify-center text-black font-bold"
                style={{ background: layer.hex }}
              >
                {layer.id}
              </span>
              <div>
                <div className="font-semibold">{layer.name}</div>
                <div className="text-xs text-muted">{layer.role}</div>
              </div>
              <span className="ml-auto chip text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                unverified
              </span>
            </div>
            <div className="mt-4 text-xs text-muted">Soroban contract reference</div>
            <div className="mono text-xs break-all">{layer.address}</div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <Metric label="Asset code" value="not mapped" />
              <Metric label="Supply" value="unverified" />
              <Metric label="Holders" value="unverified" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border py-2 px-1 bg-panel2/40">
      <div className="text-[10px] text-muted uppercase">{label}</div>
      <div className="text-sm mono font-semibold truncate">{value}</div>
    </div>
  );
}
