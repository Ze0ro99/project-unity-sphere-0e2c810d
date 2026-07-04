import { useQuery } from "@tanstack/react-query";
import { fetchLatestLedgers, fetchLatestTx, fetchRoot, relTime, shorten, HORIZON_MAINNET } from "@/lib/pi";
import { Activity, Blocks, Coins, GitBranch, Zap } from "lucide-react";
import { LAYERS } from "@/data/layers";

export default function Explorer() {
  const ledgersQ = useQuery({
    queryKey: ["ledgers"],
    queryFn: () => fetchLatestLedgers(HORIZON_MAINNET, 12),
    refetchInterval: 5000,
  });
  const txQ = useQuery({
    queryKey: ["tx"],
    queryFn: () => fetchLatestTx(HORIZON_MAINNET, 20),
    refetchInterval: 5000,
  });
  const rootQ = useQuery({
    queryKey: ["root"],
    queryFn: () => fetchRoot(HORIZON_MAINNET),
    refetchInterval: 15000,
  });

  const latest = ledgersQ.data?.[0];
  const tps = ledgersQ.data
    ? Math.round(
        (ledgersQ.data.reduce((a, l) => a + l.successful_transaction_count, 0) /
          Math.max(1, ledgersQ.data.length)) /
          5,
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Hero + search */}
      <section className="card p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 scanline" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="chip mb-3">
              <span className="pulse-dot" /> Live · Pi Mainnet
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">PiRC Sovereign Network Explorer</h1>
            <p className="text-muted text-sm mt-1">
              Real-time blocks, transactions, and 7-layer token telemetry — Piscan-grade.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              placeholder="Search address / tx hash / ledger #"
              className="w-full md:w-96 bg-panel border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-blue"
            />
            <button className="px-3 py-2 rounded-md bg-blue/90 hover:bg-blue text-black text-sm font-semibold">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Blocks} label="Latest Ledger"
          value={latest ? `#${latest.sequence.toLocaleString()}` : "—"}
          sub={latest ? relTime(latest.closed_at) : ""} />
        <Stat icon={Zap} label="Avg TPS (60s)"
          value={ledgersQ.data ? String(tps) : "—"}
          sub="successful ops / sec" />
        <Stat icon={GitBranch} label="Protocol"
          value={rootQ.data?.protocol_version ? `v${rootQ.data.protocol_version}` : "—"}
          sub={rootQ.data?.core_version ?? "stellar-core"} />
        <Stat icon={Coins} label="Total Pi"
          value={latest ? shortenBigNumber(latest.total_coins) : "—"}
          sub="on ledger" />
      </section>

      {/* 7-layer strip */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue" />
            <h2 className="font-semibold">7-Layer Token Registry</h2>
            <span className="chip">PiRC-207</span>
          </div>
          <a href="/layers" className="text-xs text-blue hover:underline">View all →</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {LAYERS.map((l) => (
            <div key={l.id} className="rounded-lg border border-border bg-panel2/50 p-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.hex }} />
                <span className="text-xs mono text-muted">{l.id}</span>
                <span className="text-xs font-semibold">{l.name}</span>
              </div>
              <div className="text-[11px] text-muted mt-1">{l.role}</div>
              <div className="text-[10px] mono text-muted mt-2 truncate">{shorten(l.address, 6, 6)}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <LedgersPanel data={ledgersQ.data} loading={ledgersQ.isLoading} />
        <TxPanel data={txQ.data} loading={txQ.isLoading} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wide">
        <Icon size={14} /> {label}
      </div>
      <div className="text-xl md:text-2xl font-bold mt-1 mono">{value}</div>
      <div className="text-xs text-muted mt-1">{sub}</div>
    </div>
  );
}

function LedgersPanel({ data, loading }: any) {
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Blocks size={16} className="text-purple" /> Latest Ledgers
        </h2>
        <span className="chip"><span className="pulse-dot" /> live</span>
      </div>
      <div className="divide-y divide-border">
        {loading && <SkeletonRows n={6} />}
        {data?.map((l: any) => (
          <div key={l.id} className="py-2.5 flex items-center gap-3 text-sm">
            <div className="w-14 h-10 rounded bg-panel2 flex flex-col items-center justify-center border border-border">
              <span className="text-[10px] text-muted">#</span>
              <span className="mono text-xs">{l.sequence.toString().slice(-5)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="mono text-xs truncate">{shorten(l.hash, 10, 8)}</div>
              <div className="text-[11px] text-muted">{relTime(l.closed_at)} · {l.operation_count} ops</div>
            </div>
            <div className="text-right">
              <div className="text-xs"><span className="text-green">{l.successful_transaction_count}</span> <span className="text-muted">/</span> <span className="text-red">{l.failed_transaction_count}</span></div>
              <div className="text-[11px] text-muted">tx s/f</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TxPanel({ data, loading }: any) {
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Zap size={16} className="text-gold" /> Latest Transactions
        </h2>
        <span className="chip"><span className="pulse-dot" /> live</span>
      </div>
      <div className="divide-y divide-border">
        {loading && <SkeletonRows n={8} />}
        {data?.map((t: any) => (
          <div key={t.id} className="py-2.5 flex items-center gap-3 text-sm">
            <span className={`w-2 h-2 rounded-full ${t.successful ? "bg-green" : "bg-red"}`} />
            <div className="flex-1 min-w-0">
              <div className="mono text-xs truncate link-hash cursor-pointer">{shorten(t.hash, 10, 8)}</div>
              <div className="text-[11px] text-muted mono truncate">from {shorten(t.source_account, 6, 6)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs mono">{t.operation_count} op</div>
              <div className="text-[11px] text-muted">{relTime(t.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="py-3 animate-pulse flex gap-3">
          <div className="w-10 h-10 bg-panel2 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-panel2 rounded w-2/3" />
            <div className="h-2.5 bg-panel2 rounded w-1/3" />
          </div>
        </div>
      ))}
    </>
  );
}

function shortenBigNumber(v: string) {
  const n = Number(v);
  if (!isFinite(n)) return v;
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString();
}
