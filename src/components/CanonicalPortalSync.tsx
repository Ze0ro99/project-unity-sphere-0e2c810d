import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";

type DomainState = { status: string; reason?: string; count?: number; evidence?: string };
type PortalFeed = {
  generatedAt: string;
  network: { status: string; identityVerified: boolean; latestLedger: number | null; protocol?: number };
  domains: Record<string, DomainState>;
  sourceStatus: Record<string, string>;
  safety: { readOnly: boolean; mainnetWrites: boolean; signingEnabled: boolean; tokenTransfersEnabled: boolean };
};

const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = env.VITE_SUPABASE_ANON_KEY || "";
const DOMAIN_LABELS: Record<string, string> = {
  contractRegistry: "Contract registry",
  events: "Testnet events",
  rawFactory: "RAW factory",
  subscriptions: "PIRC-2 subscriptions",
  assets: "Asset balances",
  liquidity: "PiDEX liquidity",
};

function stateTone(status?: string) {
  if (status === "AVAILABLE" || status === "IDENTITY_VERIFIED") return "text-emerald-400";
  if (status === "UNAVAILABLE" || status === "NOT_CONFIGURED") return "text-amber-300";
  return "text-muted";
}

export default function CanonicalPortalSync() {
  const [feed, setFeed] = useState<PortalFeed | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabaseUrl || !anonKey) {
      setError("Supabase public client configuration is missing.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(supabaseUrl + "/functions/v1/pirc-portal-feed", {
        method: "GET",
        cache: "no-store",
        headers: { apikey: anonKey, Authorization: "Bearer " + anonKey, Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Portal feed HTTP " + response.status);
      const next = await response.json() as PortalFeed;
      if (next.safety?.mainnetWrites !== false || next.safety?.signingEnabled !== false) {
        throw new Error("Canonical feed safety contract mismatch.");
      }
      setFeed(next);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Canonical feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const networkStatus = feed?.network.identityVerified ? "IDENTITY_VERIFIED" : feed?.network.status || (loading ? "CONNECTING" : "UNAVAILABLE");
  return (
    <section className="mb-4 rounded-xl border border-border bg-panel/70 p-3" aria-live="polite" aria-label="Canonical data synchronization for all portals">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity size={15} className="text-[#d8b56d]" />
          Shared live data gateway
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] ${stateTone(networkStatus)}`}>
          {feed?.network.identityVerified ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
          {networkStatus}
        </span>
        {feed?.network.latestLedger != null && <span className="text-[11px] text-muted">Ledger {feed.network.latestLedger}</span>}
        <button type="button" onClick={() => void refresh()} className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted hover:text-text" aria-label="Refresh shared portal data">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      {error && <p className="mt-2 text-[11px] text-amber-300">{error} Live panels remain unavailable until the canonical source responds; no mock replacement is used.</p>}
      <div className="mt-3 grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {Object.entries(DOMAIN_LABELS).map(([key, label]) => {
          const item = feed?.domains[key];
          const status = item?.status || (loading ? "CONNECTING" : "UNAVAILABLE");
          return (
            <div key={key} className="rounded-lg border border-border/70 bg-panel2/50 p-2 min-w-0">
              <div className="text-[10px] text-muted">{label}</div>
              <div className={`mt-1 text-[10px] font-semibold break-words ${stateTone(status)}`}>{status}</div>
              {item?.count != null && <div className="mt-1 text-[10px] text-muted">{item.count} records</div>}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted">
        {feed ? `One shared source · refreshed ${new Date(feed.generatedAt).toLocaleTimeString()} · 30-second polling · read-only · ${feed.network.protocol ? "Protocol " + feed.network.protocol : "protocol unavailable"}` : "All portals are gated on the same canonical feed. No independent portal mock data is treated as live."}
      </p>
    </section>
  );
}
