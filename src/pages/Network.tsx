import { useQuery } from "@tanstack/react-query";
import {
  fetchRoot,
  fetchLatestLedgers,
  meanCloseTime,
  tps,
  HORIZON_MAINNET,
  HORIZON_TESTNET,
  HORIZON_TESTNET2,
  type Ledger,
} from "@/lib/pi";
import { Radio } from "lucide-react";

const NETWORKS = [
  { key: "mainnet", title: "Pi Mainnet", endpoint: HORIZON_MAINNET },
  { key: "testnet", title: "Pi Testnet 1", endpoint: HORIZON_TESTNET },
  { key: "testnet2", title: "Pi Testnet 2", endpoint: HORIZON_TESTNET2 },
];

export default function Network() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Radio size={18} className="text-blue" />
        <h1 className="text-2xl font-bold">Network Status</h1>
        <span className="chip"><span className="pulse-dot" /> live</span>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {NETWORKS.map((n) => (
          <NetCard key={n.key} nkey={n.key} title={n.title} endpoint={n.endpoint} />
        ))}
      </div>
    </div>
  );
}

function NetCard({ nkey, title, endpoint }: { nkey: string; title: string; endpoint: string }) {
  const root = useQuery({
    queryKey: ["root", nkey],
    queryFn: () => fetchRoot(endpoint),
    refetchInterval: 10000,
    retry: 1,
  });
  const ledgers = useQuery({
    queryKey: ["ledgers-net", nkey],
    queryFn: () => fetchLatestLedgers(endpoint, 12),
    refetchInterval: 10000,
    retry: 1,
    enabled: !root.error,
  });

  const data = root.data;
  const ok = !!data && !root.error;
  const ls: Ledger[] = ledgers.data ?? [];
  const mct = meanCloseTime(ls);
  const rate = tps(ls);
  const failRate = ls.length
    ? (ls.reduce((a, l) => a + (l.failed_transaction_count ?? 0), 0) /
        Math.max(1, ls.reduce((a, l) => a + (l.successful_transaction_count ?? 0) + (l.failed_transaction_count ?? 0), 0))) * 100
    : null;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className={`chip ${ok ? "" : "text-red"}`}>
          <span className={`w-2 h-2 rounded-full ${ok ? "bg-green" : root.isLoading ? "bg-gold" : "bg-red"}`} />
          {ok ? "healthy" : root.isLoading ? "checking…" : "offline"}
        </span>
      </div>
      <div className="mono text-xs text-muted mt-1 break-all">{endpoint}</div>

      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <Info k="Network" v={data?.network_passphrase ?? "—"} />
        <Info k="Protocol" v={data?.protocol_version ? `v${data.protocol_version}` : "—"} />
        <Info k="Horizon" v={data?.horizon_version ?? "—"} />
        <Info k="Core" v={data?.core_version ?? "—"} />
        <Info k="Latest Ledger" v={data?.history_latest_ledger?.toLocaleString?.() ?? "—"} />
        <Info k="Ingest Lag" v={
          data?.core_latest_ledger && data?.history_latest_ledger
            ? `${Math.max(0, data.core_latest_ledger - data.history_latest_ledger)} ledgers`
            : "—"
        } />
      </div>

      <div className="text-[10px] uppercase text-muted mt-4 mb-2 tracking-wide">Live throughput</div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Info k="Close Time" v={mct ? `${mct.toFixed(1)}s` : "—"} />
        <Info k="Ops / sec" v={rate ? rate.toFixed(2) : "—"} />
        <Info k="Fail Rate" v={failRate === null ? "—" : `${failRate.toFixed(2)}%`} />
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-2.5 bg-panel2/40">
      <div className="text-[10px] uppercase text-muted">{k}</div>
      <div className="mono text-xs mt-0.5 truncate">{String(v)}</div>
    </div>
  );
}
