import { useMarketIndex } from "@/lib/market-index";
import { PIGOLD_ASSETS } from "@/data/pigold-assets";
import { ArrowDownUp, ShieldCheck, Layers3, Activity, Coins } from "lucide-react";

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel/60 p-4 min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mono text-lg sm:text-xl font-semibold mt-1 break-words">{value}</div>
      {note && <div className="text-[11px] text-muted mt-1">{note}</div>}
    </div>
  );
}

export default function PiGold() {
  const market = useMarketIndex();
  const index = market.index;
  const quoteFresh = !!index?.trusted && index.sources >= 3 && market.ts > 0 && Date.now() - market.ts <= 30_000;
  const spot = quoteFresh && typeof index?.price === "number" ? index.price : null;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-[#806b42]/60 bg-[radial-gradient(ellipse_at_top_right,rgba(152,116,216,.20),transparent_42%),linear-gradient(135deg,#101a2c,#111827_55%,#1a2030)] p-5 sm:p-7">
        <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-[#d8b56d]/20" />
        <div className="absolute -right-5 -top-9 h-48 w-48 rounded-full border border-[#d8b56d]/20" />
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="h-14 w-14 rounded-xl border border-[#d8b56d]/60 bg-[#d8b56d]/15 flex items-center justify-center text-3xl text-[#e7c982]">π</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f0dfb4]">PiGold</h1>
              <span className="chip">COORDINATION LAYER</span>
              <span className="chip">DESIGN / TESTNET READ-ONLY</span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              One economic coordination view across independent Pi assets and pair-specific liquidity pools.
              PiGold coordinates routes and accounting; it does not combine, own or double-count component reserves.
            </p>
          </div>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="External PI market reference" value={spot == null ? "UNAVAILABLE" : `${spot.toFixed(6)} USDT / PI`} note={quoteFresh ? `${index?.sources} venues · deviation ${index?.deviationBps.toFixed(1)} bps` : "Waiting for a fresh trusted venue quorum"} />
          <Stat label="Internal purchasing power" value="PENDING EVIDENCE" note="Requires verified pools, liabilities, utility and turnover inputs" />
          <Stat label="Unique verified liquidity" value="NOT READ BACK" note="No reserve is counted without a unique accounting ID" />
          <Stat label="Internal / external system value" value="NOT YET COMPUTABLE" note="Separate ledgers; do not add overlapping valuations" />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><ArrowDownUp size={16} className="text-[#d8b56d]" /> Dynamic market anchor</div>
          <p className="text-xs text-muted mt-2">External PI quotes update the reference input. A quote is not a guaranteed execution price and does not by itself prove liquidity.</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Activity size={16} className="text-[#d8b56d]" /> Economic velocity</div>
          <p className="text-xs text-muted mt-2">Measured from reconciled 24-hour turnover against circulating value, not simulated order-book activity.</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16} className="text-[#d8b56d]" /> Stability and solvency</div>
          <p className="text-xs text-muted mt-2">Coverage, price deviation, stale data and settlement evidence gate the internal purchasing-power index.</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Layers3 size={16} className="text-[#d8b56d]" /> Independent liquidity layers</div>
          <p className="text-xs text-muted mt-2">Each asset and pool keeps its own contract identity, reserve accounting ID and authorization policy.</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Seven-asset ecosystem</h2>
            <p className="text-xs text-muted">Proposed product taxonomy. Contract deployment, supply and official artwork are not verified by this catalogue.</p>
          </div>
          <span className="chip">6 components + PiGold coordinator</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PIGOLD_ASSETS.map((asset) => (
            <article key={asset.id} className="card p-4 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1" style={{ background: asset.color }} />
              <div className="flex items-center gap-3 pl-2">
                <div className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-lg font-bold border border-white/10" style={{ background: `${asset.color}22`, color: asset.color }}>{asset.symbol}</div>
                <div className="min-w-0">
                  <h3 className="font-semibold">{asset.name}</h3>
                  <div className="text-xs text-muted">{asset.role}</div>
                </div>
                <span className="chip ml-auto">DESIGN</span>
              </div>
              <p className="pl-2 mt-3 text-xs leading-relaxed text-muted">{asset.description}</p>
              {asset.relationship === "coordinator" && <div className="pl-2 mt-3 text-[11px] text-[#e7c982] flex items-center gap-1"><Coins size={12} /> Coordinates; does not custody component reserves</div>}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-200"><ShieldCheck size={16} /> Evidence gate</div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          This dashboard deliberately does not invent pool balances, token supplies, internal prices or total value.
          The economic index remains unavailable until independent Testnet readbacks confirm each asset and pool,
          unique reserve-accounting identifiers, liabilities, utility fulfillment and market-data freshness.
          The model weights are provisional and require governance approval before they can influence any transaction.
        </p>
      </section>
    </div>
  );
}
