import EvidenceBadge from "@/components/EvidenceBadge";
import { useMarketIndex } from "@/lib/market-index";
import { PIGOLD_ASSETS } from "@/data/pigold-assets";
import { PIGOLD_PROPOSED_WEIGHTS_BPS, PIGOLD_MODEL_VERSION } from "@/lib/pigold-economics";
import { ArrowDownUp, ShieldCheck, Layers3, Activity, Coins } from "lucide-react";
import { getPurchasingPowerLayer, listPurchasingPowerLayers, purpleMinedPiToPiGoldReference } from "@/lib/pirc-purchasing-power-v1.js";

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel/60 p-4 min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mono text-lg sm:text-xl font-semibold mt-1 break-words">{value}</div>
      {note && <div className="text-[11px] text-muted mt-1">{note}</div>}
    </div>
  );
}


const REFERENCE_LAYER_LABELS: Record<string, string> = {
  pigold: "PiGold",
  yellow: "Pi Yellow",
  orange: "Pi Orange",
  pibank: "PiBank",
  picash: "PiCash",
};

function formatUsdMicros(value: string): string {
  const usd = Number(BigInt(value)) / 1_000_000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
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
        <div className="relative mt-4 flex flex-wrap gap-2 text-[11px] text-muted items-center">
          <span>PI/USDT</span><EvidenceBadge level={quoteFresh ? "OBSERVED" : "UNKNOWN"} source="exchange index" />
          <span className="ms-3">Pools / reserves / liquidity</span><EvidenceBadge level="UNKNOWN" source="no contract readback" />
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="External PI market reference" value={spot == null ? "UNAVAILABLE" : `${spot.toFixed(6)} USDT / PI`} note={quoteFresh ? `${index?.sources} venues · deviation ${index?.deviationBps.toFixed(1)} bps` : "Waiting for a fresh trusted venue quorum"} />
          <Stat label="Internal purchasing power" value="PENDING EVIDENCE" note="Requires verified pools, liabilities, utility and turnover inputs" />
          <Stat label="Unique verified liquidity" value="NOT READ BACK" note="No reserve is counted without a unique accounting ID" />
          <Stat label="Internal / external system value" value="NOT YET COMPUTABLE" note="Separate ledgers; do not add overlapping valuations" />
        </div>
      </section>

      <section className="rounded-xl border border-[#806b42]/40 bg-panel/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-sm">Dynamic purchasing-power policy</h2>
          <span className="chip">{PIGOLD_MODEL_VERSION}</span>
        </div>
        <p className="mono text-sm text-[#e7c982] mt-3">Internal PP = External PI spot × Confidence Factor</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
          {Object.entries(PIGOLD_PROPOSED_WEIGHTS_BPS).map(([key, weight]) => (
            <div key={key} className="rounded-lg border border-border bg-panel2/60 p-2">
              <div className="text-[10px] text-muted break-words">{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</div>
              <div className="mono text-base font-semibold mt-1">{(weight / 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-3">Proposed policy weights only: market anchor 40%, verified liquidity coverage 25%, fulfilled utility 15%, measured velocity 10%, and price stability 10%. The model refuses to calculate an internal index until a versioned policy is explicitly approved by governance and evidence-backed inputs are connected.</p>
      </section>


      <section className="rounded-xl border border-[#806b42]/40 bg-panel/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-sm">PiGold nested purchasing-power ladder</h2>
            <p className="text-[11px] text-muted mt-1">Versioned reference schedule · pirc-purchasing-power-v1</p>
          </div>
          <span className="chip">REFERENCE ONLY · NOT A LIVE PRICE</span>
        </div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted border-b border-border">
                <th className="py-2 pr-3">Layer</th>
                <th className="py-2 pr-3 text-right">Reference / unit</th>
                <th className="py-2 text-right">Units per PiGold</th>
              </tr>
            </thead>
            <tbody>
              {listPurchasingPowerLayers().map((key) => {
                const layer = getPurchasingPowerLayer(key);
                return (
                  <tr key={key} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3 font-medium">{REFERENCE_LAYER_LABELS[key] ?? key}</td>
                    <td className="py-2 pr-3 text-right mono">{formatUsdMicros(layer.illustrativeUsdMicrosPerWholeUnit)}</td>
                    <td className="py-2 text-right mono">{Number(layer.unitsPerPiGold).toLocaleString("en-US")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted mt-3">
          Illustrative scenario: 1 PiGold reference = $600,000; Yellow = $60,000; Orange = $6,000;
          PiBank = $600; PiCash = $60. Each layer retains its own issuer, ledger, reserves and settlement rail.
          These figures do not represent exchange prices, collateral, guaranteed redemption or spendable USD.
          External venue quotes, internal reference values and executable pool quotes remain separate.
        </p>
      </section>


      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
          <h3 className="font-semibold text-sm">Purple · mined-Pi bridge</h3>
          <div className="mono text-lg mt-2">1 mined Pi = 10 PiGold</div>
          <p className="text-[11px] text-muted mt-2">10,000,000 mined-Pi subunits per mined-Pi unit. The 100 PiGold tier is a separate migration policy and is not enabled by denomination changes alone.</p>
          <div className="mono text-xs mt-2">Escrow tier: 100 PiGold · ACTIVATED evidence required</div>
        </article>
        <article className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
          <h3 className="font-semibold text-sm">Indigo · premium reserve</h3>
          <div className="mono text-lg mt-2">Independent valuation</div>
          <p className="text-[11px] text-muted mt-2">Retained as a legacy reserve layer. No fixed PiGold conversion ratio is assigned until its own reserve, eligibility and governance policy is approved.</p>
        </article>
        <article className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <h3 className="font-semibold text-sm">Red · governance</h3>
          <div className="mono text-lg mt-2">No cash conversion</div>
          <p className="text-[11px] text-muted mt-2">Contribution-based governance and voting weight. Voting rights and reputation are not a fixed USD or PiGold redemption claim.</p>
        </article>
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
            <h2 className="text-lg font-semibold">Core layers and OUSD extension</h2>
            <p className="text-xs text-muted">The existing layer taxonomy is preserved; OUSD is an additional test-only profile. Contract deployment, supply and issuer evidence remain independently unverified.</p>
          </div>
          <span className="chip">Legacy layers + PiGold coordinator + OUSD test profile</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PIGOLD_ASSETS.map((asset) => (
            <article key={asset.id} className="card p-4 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1" style={{ background: asset.color }} />
              <div className="flex items-center gap-3 pl-2">
                <div className="relative h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-lg font-bold border border-white/10 overflow-hidden" style={{ background: `${asset.color}22`, color: asset.color }}>
                  {asset.symbol}
                  {asset.logoPath && <img src={asset.logoPath} alt={`${asset.name} logo`} className="absolute inset-0 h-full w-full object-contain p-0.5" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold">{asset.name}</h3>
                  <div className="text-xs text-muted">{asset.role}</div>
                </div>
                <span className="chip ml-auto">DESIGN</span>
              </div>
              <p className="pl-2 mt-3 text-xs leading-relaxed text-muted">{asset.description}</p>
              <p className="pl-2 mt-2 text-[10px] leading-relaxed text-muted/80">Legacy mapping: {asset.legacyMapping}</p>
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
