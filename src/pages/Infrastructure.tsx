import { useEffect, useMemo, useState } from "react";
import { Server, Database, GitMerge, RefreshCw, Trash2, Boxes } from "lucide-react";
import {
  CDN_POLICIES,
  WAREHOUSE,
  MERGE_LEDGER,
  cached,
  cacheStats,
  purgeCache,
  type CacheStats,
} from "@/lib/infra";
import { fetchLatestLedgers, HORIZON_MAINNET } from "@/lib/pi";

const TIER_COLOR: Record<string, string> = {
  edge: "text-green",
  regional: "text-gold",
  origin: "text-orange",
};

const STATUS_COLOR: Record<string, string> = {
  built: "text-green",
  example: "text-gold",
  planned: "text-muted",
};

export default function Infrastructure() {
  const [stats, setStats] = useState<CacheStats>(() => cacheStats());
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      await cached("ledgers:mainnet", () => fetchLatestLedgers(HORIZON_MAINNET, 10));
      await cached("layers:registry", async () => CDN_POLICIES);
      await cached("standards:index", async () => WAREHOUSE);
    } catch {
      /* last-known-good served by the cache layer */
    } finally {
      setStats(cacheStats());
      setBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      void refresh();
    }, 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hitPct = useMemo(() => (stats.hitRatio * 100).toFixed(1), [stats.hitRatio]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-panel/60 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-orange flex items-center justify-center text-black">
            <Server size={20} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Infrastructure</h1>
            <p className="text-sm text-muted">
              Edge cache &amp; CDN policy telemetry, contract warehouse build matrix and the branch merge ledger.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => void refresh()}
              disabled={busy}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-border hover:bg-panel2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              onClick={() => {
                purgeCache();
                setStats(cacheStats());
              }}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-border hover:bg-panel2"
            >
              <Trash2 size={14} /> Purge
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Hit ratio", value: `${hitPct}%` },
          { label: "Hits / misses", value: `${stats.hits} / ${stats.misses}` },
          { label: "Stale served · revalidations", value: `${stats.stale} · ${stats.revalidations}` },
          { label: "Payload cached", value: `${(stats.bytes / 1024).toFixed(1)} KB` },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-panel/60 p-4">
            <div className="text-xs text-muted">{k.label}</div>
            <div className="mono text-lg font-semibold mt-1">{k.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-panel/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-sm font-semibold">
          <Database size={15} /> CDN policies &amp; live entries
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mono">
            <thead className="text-muted">
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2">Key</th>
                <th className="text-left px-4 py-2">Tier</th>
                <th className="text-right px-4 py-2">TTL</th>
                <th className="text-right px-4 py-2">SWR</th>
                <th className="text-right px-4 py-2">Age</th>
                <th className="text-right px-4 py-2">Hits</th>
                <th className="text-right px-4 py-2">Last</th>
              </tr>
            </thead>
            <tbody>
              {CDN_POLICIES.map((p) => {
                const e = stats.entries.find((x) => x.key.startsWith(p.key));
                return (
                  <tr key={p.key} className="border-b border-border/50">
                    <td className="px-4 py-2">{p.key}</td>
                    <td className={`px-4 py-2 ${TIER_COLOR[p.tier]}`}>{p.tier}</td>
                    <td className="px-4 py-2 text-right">{p.ttlMs / 1000}s</td>
                    <td className="px-4 py-2 text-right">{p.swrMs / 1000}s</td>
                    <td className="px-4 py-2 text-right">{e ? `${Math.round(e.ageMs / 1000)}s` : "—"}</td>
                    <td className="px-4 py-2 text-right">{e ? `${e.hits}/${e.misses}` : "—"}</td>
                    <td className="px-4 py-2 text-right">{e?.lastMs ? `${e.lastMs}ms` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="warehouse" className="rounded-xl border border-border bg-panel/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-sm font-semibold">
          <Boxes size={15} /> Contract warehouse — build &amp; run matrix
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mono">
            <thead className="text-muted">
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2">Module</th>
                <th className="text-left px-4 py-2">Standard</th>
                <th className="text-left px-4 py-2">Lang</th>
                <th className="text-left px-4 py-2">Path</th>
                <th className="text-left px-4 py-2">Runner</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {WAREHOUSE.map((m) => (
                <tr key={m.id} className="border-b border-border/50">
                  <td className="px-4 py-2">{m.id}</td>
                  <td className="px-4 py-2 text-gold">{m.standard}</td>
                  <td className="px-4 py-2">{m.lang}</td>
                  <td className="px-4 py-2 text-muted">{m.path}</td>
                  <td className="px-4 py-2 text-muted">{m.runner}</td>
                  <td className={`px-4 py-2 ${STATUS_COLOR[m.status]}`}>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-panel/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-sm font-semibold">
          <GitMerge size={15} /> Branch merge ledger
        </div>
        <div className="divide-y divide-border/50">
          {MERGE_LEDGER.map((b) => (
            <div key={b.branch} className="px-4 py-3 grid gap-1 sm:grid-cols-[minmax(0,20rem)_1fr]">
              <div>
                <div className="mono text-xs">{b.branch}</div>
                <div className="text-[11px] text-muted mt-0.5">
                  {b.module} → <span className="mono">{b.target}</span>
                </div>
              </div>
              <div className="text-xs text-muted">
                <span
                  className={`mono text-[10px] px-2 py-0.5 rounded-full border border-border mr-2 ${
                    b.state === "merged" ? "text-green" : "text-gold"
                  }`}
                >
                  {b.state}
                </span>
                {b.note}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
