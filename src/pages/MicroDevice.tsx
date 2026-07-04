import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestLedgers, fetchLatestTx, HORIZON_MAINNET, relTime, shorten } from "@/lib/pi";
import { Cpu, Wifi, Battery, HardDrive } from "lucide-react";

export default function MicroDevice() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ledgersQ = useQuery({ queryKey: ["ledgers-md"], queryFn: () => fetchLatestLedgers(HORIZON_MAINNET, 8), refetchInterval: 4000 });
  const txQ = useQuery({ queryKey: ["tx-md"], queryFn: () => fetchLatestTx(HORIZON_MAINNET, 10), refetchInterval: 4000 });

  const latest = ledgersQ.data?.[0];
  const load = ledgersQ.data
    ? Math.min(100, Math.round((ledgersQ.data[0]?.operation_count ?? 0) * 3.3))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Cpu size={18} className="text-blue" />
        <h1 className="text-2xl font-bold">Micro-Device Live View</h1>
        <span className="chip"><span className="pulse-dot" /> streaming</span>
      </div>

      <div className="grid md:grid-cols-[380px_1fr] gap-6">
        {/* Device chassis */}
        <div className="card p-4 relative">
          <div className="rounded-2xl border border-border p-3 bg-black/40">
            <div className="rounded-xl bg-[#020617] border border-border p-3 h-[520px] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-muted mono">
                <span>PiRC-Node · μ-1</span>
                <span>{now.toLocaleTimeString()}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                <span className="flex items-center gap-1"><Wifi size={10} className="text-green" /> MAINNET</span>
                <span className="flex items-center gap-1"><Battery size={10} className="text-green" /> 98%</span>
              </div>

              <div className="mt-3 rounded-lg border border-border bg-panel p-3">
                <div className="text-[10px] text-muted uppercase">Ledger</div>
                <div className="mono text-lg font-bold">#{latest?.sequence?.toLocaleString() ?? "—"}</div>
                <div className="text-[10px] text-muted mono truncate">{latest ? shorten(latest.hash, 8, 6) : ""}</div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span className="flex items-center gap-1"><HardDrive size={10} /> node load</span>
                  <span className="mono">{load}%</span>
                </div>
                <div className="h-1.5 rounded bg-panel2 mt-1 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green via-gold to-red transition-all" style={{ width: `${load}%` }} />
                </div>
              </div>

              <div className="mt-3 flex-1 overflow-hidden">
                <div className="text-[10px] text-muted uppercase mb-1">tx feed</div>
                <div className="space-y-1 overflow-hidden">
                  {(txQ.data ?? []).slice(0, 10).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-[10px] mono">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.successful ? "bg-green" : "bg-red"}`} />
                      <span className="truncate flex-1">{shorten(t.hash, 6, 4)}</span>
                      <span className="text-muted">{relTime(t.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 scanline" />
              <div className="text-center text-[9px] text-muted mono mt-1">π · sovereign micro-device</div>
            </div>
          </div>
          <div className="text-center text-xs text-muted mt-3">PiRC-Node μ-Class · Mainnet-Ready</div>
        </div>

        {/* Telemetry */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="Uptime" value="99.98%" tone="green" />
            <Tile label="Peers" value="21" />
            <Tile label="Sync" value="in-sync" tone="green" />
            <Tile label="Firmware" value="v3.1.4" />
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-2">Recent Ledgers</h3>
            <div className="divide-y divide-border">
              {ledgersQ.data?.map((l) => (
                <div key={l.id} className="py-2 flex items-center gap-3 text-sm">
                  <div className="mono text-xs w-24">#{l.sequence}</div>
                  <div className="flex-1 mono text-xs text-muted truncate">{shorten(l.hash, 12, 8)}</div>
                  <div className="text-xs"><span className="text-green">{l.successful_transaction_count}</span>/<span className="text-red">{l.failed_transaction_count}</span></div>
                  <div className="text-xs text-muted w-16 text-right">{relTime(l.closed_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div className="card p-3">
      <div className="text-[11px] text-muted uppercase">{label}</div>
      <div className={`mono font-semibold text-lg ${tone === "green" ? "text-green" : ""}`}>{value}</div>
    </div>
  );
}
