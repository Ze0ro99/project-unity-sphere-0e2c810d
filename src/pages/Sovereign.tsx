import { useMemo, useSyncExternalStore, useState } from "react";
import {
  Gauge, Waves, AlertTriangle, Bot, ShieldCheck, Sigma, Activity, Route as RouteIcon,
} from "lucide-react";
import { exchangeStore, fmt } from "@/lib/exchange";
import {
  agentEvaluate, curvature, detectAnomalies, num, pct, phiSolvency, portfolioVar, PQ_SUITE,
  quadraticBreaker, riskMetrics, routeOrder, systemEfficiency, weightedContributionFactor,
  creditCeiling, PARITY, PHI, type ManifoldEdge, type ManifoldNode,
} from "@/lib/sovereign";

function Panel({ title, icon: Icon, tag, children }: {
  title: string; icon: typeof Gauge; tag?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-panel/60 overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-panel2/40">
        <Icon size={15} className="text-gold" />
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {tag && <span className="ml-auto text-[10px] mono px-1.5 py-0.5 rounded border border-border text-muted">{tag}</span>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel2/30 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`text-lg font-semibold mono ${tone ?? ""}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Sovereign() {
  const state = useSyncExternalStore(exchangeStore.subscribe, exchangeStore.getSnapshot);
  const markets = useMemo(() => state.symbols.map((s) => state.markets[s]), [state]);
  const [size, setSize] = useState(2500);

  const risks = useMemo(() => markets.map(riskMetrics), [markets]);
  const anomalies = useMemo(() => detectAnomalies(markets), [markets]);
  const actions = useMemo(() => agentEvaluate(markets), [markets]);

  const tvl = markets.reduce((s, m) => s + m.reserveQuote * 2, 0);
  const claims = markets.reduce((s, m) => s + m.reserveBase, 0);
  const quoteReserves = markets.reduce((s, m) => s + m.reserveQuote, 0);
  const solvency = phiSolvency(quoteReserves, claims, claims > 0 ? quoteReserves / claims : 1);
  const weights = markets.map((m) => (tvl ? (m.reserveQuote * 2) / tvl : 0));
  const pVar = portfolioVar(risks, weights);
  const efficiency = systemEfficiency(38.4, 0.007, 5.2);
  const wcf = weightedContributionFactor({
    liquidity: tvl / 2_000_000,
    volume: markets.reduce((s, m) => s + m.vol24h, 0) / 500_000,
    uptime: 0.999,
    governance: 0.6,
  });

  /* Liquidity manifold — one chart per layer, π as the origin chart. */
  const { nodes, edges } = useMemo(() => {
    const ns: ManifoldNode[] = [
      { id: "π", density: tvl / 2, volatility: 0.35, latency: 5200 },
      ...markets.map((m, i) => ({
        id: m.layer.id,
        density: m.reserveQuote,
        volatility: risks[i]?.volatility ?? 0.5,
        latency: 5200 + i * 180,
      })),
    ];
    const es: ManifoldEdge[] = [];
    markets.forEach((m) => {
      es.push({ from: "π", to: m.layer.id, depth: m.reserveQuote, feeBps: 30 });
      es.push({ from: m.layer.id, to: "π", depth: m.reserveQuote, feeBps: 30 });
    });
    markets.forEach((a) =>
      markets.forEach((b) => {
        if (a.layer.id !== b.layer.id)
          es.push({ from: a.layer.id, to: b.layer.id, depth: Math.min(a.reserveQuote, b.reserveQuote) * 0.35, feeBps: 45 });
      }),
    );
    return { nodes: ns, edges: es };
  }, [markets, risks, tvl]);

  const [dest, setDest] = useState("L6");
  const route = useMemo(() => routeOrder(nodes, edges, "π", dest, size), [nodes, edges, dest, size]);
  const refDensity = nodes.reduce((s, n) => s + n.density, 0) / Math.max(1, nodes.length);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-panel/60 p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple to-blue flex items-center justify-center text-black">
            <Sigma size={20} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Omni-Sovereign Economic Core</h1>
            <p className="text-sm text-muted">
              Differential-manifold routing, Φ justice solvency, reflexive rewards, risk analytics and the autonomous keeper — all evaluated live against the exchange state.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Protocol TVL" value={`${num(tvl)} π`} sub={`${markets.length} layer pools`} />
        <Stat
          label="Φ Solvency (PiRC-101)"
          value={solvency.phi === Infinity ? "∞" : solvency.phi.toFixed(3)}
          sub={`floor ${PHI.toFixed(3)} · ${solvency.solvent ? "solvent" : "under-reserved"}`}
          tone={solvency.solvent ? "text-green" : "text-red"}
        />
        <Stat label="System Efficiency (PiRC-205)" value={pct(efficiency)} sub="ops/s ÷ friction × (1 − fail)" />
        <Stat label="Portfolio VaR 95% (PiRC-211)" value={pct(pVar)} sub="1-bar, Gaussian copula ρ=0.45" tone="text-orange" />
        <Stat label="WCF (PiRC-204)" value={wcf.toFixed(4)} sub="liquidity·0.4 vol·0.3 uptime·0.2 gov·0.1" />
        <Stat label="Credit Ceiling (PiRC-260)" value={`${num(creditCeiling(tvl / 2))} π`} sub="10,000,000 : 1 sovereign expansion" />
        <Stat label="Parity Target" value={PARITY.toLocaleString()} sub="GOLD reserve parity" tone="text-gold" />
        <Stat label="Open Anomalies (PiRC-208)" value={String(anomalies.length)} sub="robust-z / MAD detector" tone={anomalies.length ? "text-red" : "text-green"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Differential Manifold Routing" icon={RouteIcon} tag="core/math">
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <label className="text-xs text-muted">
              Destination chart
              <select
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                className="mt-1 block bg-panel2 border border-border rounded-md px-2 py-1.5 text-sm text-text"
              >
                {markets.map((m) => (
                  <option key={m.layer.id} value={m.layer.id}>{m.layer.id} · {m.layer.name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted flex-1 min-w-[160px]">
              Order size · {num(size)} π
              <input
                type="range" min={100} max={250000} step={100} value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="mt-2 w-full accent-gold"
              />
            </label>
          </div>
          {route ? (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 flex-wrap mono text-sm">
                {route.path.map((p, i) => (
                  <span key={`${p}-${i}`} className="flex items-center gap-1.5">
                    <span className="px-2 py-1 rounded-md border border-border bg-panel2/50">{p}</span>
                    {i < route.path.length - 1 && <span className="text-muted">→</span>}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Stat label="Geodesic cost" value={route.cost.toFixed(5)} />
                <Stat label="Hops" value={String(route.hops)} />
                <Stat label="Geodesic gain" value={pct(route.friction)} tone="text-green" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No geodesic path — manifold disconnected at this size.</p>
          )}

          <table className="w-full text-xs mt-4">
            <thead className="text-muted">
              <tr className="text-left">
                <th className="py-1.5">Chart</th><th>Density</th><th>Vol</th><th className="text-right">Curvature K</th>
              </tr>
            </thead>
            <tbody className="mono">
              {nodes.map((n) => {
                const k = curvature(n, refDensity);
                return (
                  <tr key={n.id} className="border-t border-border/60">
                    <td className="py-1.5">{n.id}</td>
                    <td>{num(n.density)}</td>
                    <td>{pct(n.volatility, 0)}</td>
                    <td className={`text-right ${k >= 0 ? "text-green" : "text-red"}`}>{k.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        <Panel title="Risk Analytics Desk" icon={Gauge} tag="PiRC-211">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted">
                <tr className="text-left">
                  <th className="py-1.5">Market</th><th>σ ann.</th><th>VaR95</th><th>ES</th><th>MaxDD</th><th className="text-right">Depth 1%</th>
                </tr>
              </thead>
              <tbody className="mono">
                {risks.map((r) => (
                  <tr key={r.symbol} className="border-t border-border/60">
                    <td className="py-1.5 text-text">{r.symbol}</td>
                    <td>{pct(r.volatility, 0)}</td>
                    <td className="text-orange">{pct(r.var95)}</td>
                    <td className="text-red">{pct(r.expectedShortfall)}</td>
                    <td>{pct(r.maxDrawdown, 1)}</td>
                    <td className="text-right">{num(r.depth1pct)} π</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Quadratic Circuit Breakers" icon={Activity} tag="PiRC-251">
          <div className="space-y-2">
            {markets.map((m) => {
              const b = quadraticBreaker(m.price, m.twap);
              const tone = ["text-green", "text-yellow", "text-orange", "text-red"][b.level];
              return (
                <div key={m.symbol} className="flex items-center gap-3 text-xs">
                  <span className="w-24 mono">{m.symbol}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-panel2 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-green via-yellow to-red" style={{ width: `${Math.min(100, b.throttle * 100)}%` }} />
                  </div>
                  <span className="mono w-20 text-right">{b.deviationBps.toFixed(0)} bps</span>
                  <span className={`w-20 text-right font-semibold ${tone}`}>{b.label}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Anomaly Detection" icon={AlertTriangle} tag="PiRC-208">
          {anomalies.length === 0 ? (
            <p className="text-sm text-muted">No anomalies — all markets inside 4σ robust bounds.</p>
          ) : (
            <ul className="space-y-2 text-xs max-h-64 overflow-auto">
              {anomalies.slice(0, 12).map((a, i) => (
                <li key={`${a.symbol}-${a.kind}-${i}`} className="flex items-start gap-2 border-b border-border/60 pb-2">
                  <span className="mono w-20 shrink-0">{a.symbol}</span>
                  <span className="flex-1">
                    <span className="font-semibold text-orange">{a.kind}</span>
                    <span className="block text-muted">{a.detail}</span>
                  </span>
                  <span className="mono text-red">{a.score.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Autonomous Keeper Agent" icon={Bot} tag="PiRC-212">
          <ul className="space-y-2 text-xs max-h-64 overflow-auto">
            {actions.map((a) => (
              <li key={a.id} className="border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`mono px-1.5 py-0.5 rounded text-[10px] ${
                    a.severity === "critical" ? "bg-red/15 text-red" : a.severity === "warn" ? "bg-orange/15 text-orange" : "bg-blue/15 text-blue"
                  }`}>{a.action}</span>
                  <span className="mono text-muted">{a.target}</span>
                  <span className="ml-auto mono text-[10px] text-muted">{a.policy}</span>
                </div>
                <p className="text-muted mt-1">{a.rationale}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Post-Quantum Envelope" icon={ShieldCheck} tag={PQ_SUITE.suite}>
          <dl className="text-xs space-y-2">
            <div className="flex justify-between gap-4"><dt className="text-muted">KEM</dt><dd className="mono">{PQ_SUITE.kem}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Signature</dt><dd className="mono">{PQ_SUITE.sigAlg}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Mode</dt><dd className="mono text-green">{PQ_SUITE.hybrid ? "Hybrid classical + PQ" : "PQ only"}</dd></div>
          </dl>
          <p className="text-xs text-muted mt-3 leading-relaxed">{PQ_SUITE.note}</p>
        </Panel>
      </div>

      <Panel title="Reserve & Liquidity Ledger" icon={Waves} tag="PiRC-215 / 101">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted">
              <tr className="text-left">
                <th className="py-1.5">Layer</th><th>Spot</th><th>Reserve π</th><th>Reserve base</th><th>Φ</th><th>Floor</th><th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody className="mono">
              {markets.map((m) => {
                const s = phiSolvency(m.reserveQuote, m.reserveBase, m.price);
                return (
                  <tr key={m.symbol} className="border-t border-border/60">
                    <td className="py-1.5">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: m.layer.hex }} />
                        {m.layer.id} {m.layer.name}
                      </span>
                    </td>
                    <td>{fmt(m.price)}</td>
                    <td>{num(m.reserveQuote)}</td>
                    <td>{num(m.reserveBase)}</td>
                    <td className={s.solvent ? "text-green" : "text-red"}>{s.phi === Infinity ? "∞" : s.phi.toFixed(3)}</td>
                    <td>{fmt(s.floorPrice)}</td>
                    <td className={`text-right ${s.breachedFloor ? "text-red" : "text-green"}`}>
                      {s.breachedFloor ? "FLOOR BREACH" : "PROTECTED"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
