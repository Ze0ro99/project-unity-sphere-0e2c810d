import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";

type Feed = {
  generatedAt: string;
  network?: { status?: string; identityVerified?: boolean; latestLedger?: number | null; protocol?: number | null };
  domains?: Record<string, { status?: string; count?: number; total?: number; ingestion?: string; reason?: string }>;
  sourceStatus?: Record<string, string>;
  safety?: { readOnly?: boolean; mainnetWrites?: boolean; signingEnabled?: boolean; tokenTransfersEnabled?: boolean; mintingEnabled?: boolean };
};

const env = import.meta.env as Record<string, string | undefined>;
const endpoint = env.VITE_PIRC_PORTAL_FEED_URL || "";
const publicKey = env.VITE_PIRC_PORTAL_FEED_ANON_KEY || "";
const LABELS: Record<string, string> = {
  contractRegistry: "Contract registry",
  events: "Testnet events",
  rawFactory: "RAW factory",
  subscriptions: "PIRC-2 subscriptions",
  assets: "Asset balances",
  liquidity: "PiDEX liquidity",
};

function tone(status?: string) {
  if (status === "IDENTITY_VERIFIED" || status === "AVAILABLE") return "text-emerald-400";
  if (status === "UNAVAILABLE" || status === "NOT_CONFIGURED") return "text-amber-300";
  return "text-muted";
}

export default function CanonicalPortalSync() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!endpoint || !publicKey) {
      setError("Canonical Pi Testnet feed is not configured for this deployment.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        cache: "no-store",
        headers: {
          apikey: publicKey,
          Authorization: "Bearer " + publicKey,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Portal feed HTTP " + response.status);
      const next = await response.json() as Feed;
      if (next.safety?.readOnly !== true || next.safety?.mainnetWrites !== false || next.safety?.signingEnabled !== false) {
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

  const networkStatus = feed?.network?.identityVerified
    ? "IDENTITY_VERIFIED"
    : feed?.network?.status || (loading ? "CONNECTING" : "UNAVAILABLE");

  return (
    <section className="mb-4 rounded-xl border border-border bg-panel/70 p-3" aria-live="polite" aria-label="Canonical Pi Testnet data status">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity size={15} className="text-[#d8b56d]" />
          Canonical Pi Testnet data gateway
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] ${tone(networkStatus)}`}>
          {feed?.network?.identityVerified ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
          {networkStatus}
        </span>
        {feed?.network?.latestLedger != null && <span className="text-[11px] text-muted">Ledger {feed.network.latestLedger}</span>}
        <button type="button" onClick={() => void refresh()} className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted hover:text-text" aria-label="Refresh canonical feed">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      {error && <p className="mt-2 text-[11px] text-amber-300">{error} No local mock data is substituted.</p>}
      <div className="mt-3 grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {Object.entries(LABELS).map(([key, label]) => {
          const item = feed?.domains?.[key];
          const status = item?.status || (loading ? "CONNECTING" : "NOT_CONFIGURED");
          return (
            <div key={key} className="rounded-lg border border-border/70 bg-panel2/50 p-2 min-w-0">
              <div className="text-[10px] text-muted">{label}</div>
              <div className={`mt-1 text-[10px] font-semibold break-words ${tone(status)}`}>{status}</div>
              {item?.count != null && <div className="mt-1 text-[10px] text-muted">{item.count} records</div>}
              {key === "events" && item?.ingestion && <div className="mt-1 text-[9px] text-muted break-words">{item.ingestion}</div>}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted">
        {feed ? `Shared source · ${new Date(feed.generatedAt).toLocaleTimeString()} · 30-second polling · read-only · protocol ${feed.network?.protocol ?? "unavailable"}` : "No verified source is available yet; this panel never treats simulations as live chain data."}
      </p>
    </section>
  );
}
