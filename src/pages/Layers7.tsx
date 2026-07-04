import { LAYERS, ISSUER, MASTER_REGISTRY } from "@/data/layers";
import { shorten } from "@/lib/pi";
import { Layers } from "lucide-react";

export default function Layers7() {
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={18} className="text-purple" />
          <h1 className="text-2xl font-bold">7-Layer Token System</h1>
          <span className="chip">PiRC-207</span>
        </div>
        <p className="text-muted text-sm">
          Mainnet registry of the seven color-coded PiRC token layers. Each layer holds a distinct
          monetary role in the sovereign ecosystem.
        </p>
        <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
          <Row label="Issuer" value={ISSUER} />
          <Row label="Master Registry" value={MASTER_REGISTRY} />
        </div>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LAYERS.map((l) => (
          <div key={l.id} className="card p-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: l.hex }} />
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-md flex items-center justify-center text-black font-bold"
                    style={{ background: l.hex }}>
                {l.id}
              </span>
              <div>
                <div className="font-semibold">{l.name}</div>
                <div className="text-xs text-muted">{l.role}</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted">Contract</div>
            <div className="mono text-xs break-all">{l.address}</div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <Metric label="Status" value="ACTIVE" positive />
              <Metric label="QWF_eff" value="128" />
              <Metric label="ϕ-solv" value="✓" positive />
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
function Metric({ label, value, positive }: any) {
  return (
    <div className="rounded-md border border-border py-2 bg-panel2/40">
      <div className="text-[10px] text-muted uppercase">{label}</div>
      <div className={`text-sm mono font-semibold ${positive ? "text-green" : ""}`}>{value}</div>
    </div>
  );
}
