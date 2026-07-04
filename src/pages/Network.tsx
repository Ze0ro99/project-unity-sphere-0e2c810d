import { useQuery } from "@tanstack/react-query";
import { fetchRoot, HORIZON_MAINNET, HORIZON_TESTNET } from "@/lib/pi";
import { Radio } from "lucide-react";

export default function Network() {
  const main = useQuery({ queryKey: ["root-main"], queryFn: () => fetchRoot(HORIZON_MAINNET), refetchInterval: 10000 });
  const test = useQuery({ queryKey: ["root-test"], queryFn: () => fetchRoot(HORIZON_TESTNET), refetchInterval: 10000 });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Radio size={18} className="text-blue" />
        <h1 className="text-2xl font-bold">Network Status</h1>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <NetCard title="Pi Mainnet" endpoint={HORIZON_MAINNET} data={main.data} loading={main.isLoading} err={main.error as any} />
        <NetCard title="Pi Testnet" endpoint={HORIZON_TESTNET} data={test.data} loading={test.isLoading} err={test.error as any} />
      </div>
    </div>
  );
}

function NetCard({ title, endpoint, data, loading, err }: any) {
  const ok = !!data && !err;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className={`chip ${ok ? "" : "text-red"}`}>
          <span className={`w-2 h-2 rounded-full ${ok ? "bg-green" : "bg-red"}`} />
          {ok ? "healthy" : loading ? "checking…" : "offline"}
        </span>
      </div>
      <div className="mono text-xs text-muted mt-1 break-all">{endpoint}</div>
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <Info k="Network" v={data?.network_passphrase ?? "—"} />
        <Info k="Protocol" v={data?.protocol_version ? `v${data.protocol_version}` : "—"} />
        <Info k="Horizon" v={data?.horizon_version ?? "—"} />
        <Info k="Core" v={data?.core_version ?? "—"} />
        <Info k="Latest Ledger" v={data?.history_latest_ledger ?? "—"} />
        <Info k="Base Fee" v={data?.fee_pool ? `${data.core_supported_protocol_version ?? ""}` : "100 stroops"} />
      </div>
    </div>
  );
}
function Info({ k, v }: any) {
  return (
    <div className="rounded-md border border-border p-2.5 bg-panel2/40">
      <div className="text-[10px] uppercase text-muted">{k}</div>
      <div className="mono text-xs mt-0.5 truncate">{String(v)}</div>
    </div>
  );
}
