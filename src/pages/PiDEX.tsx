import { useMemo, useState, useSyncExternalStore } from "react";
import {
  exchangeStore,
  placeOrder,
  cancelOrder,
  cancelAll,
  ammQuote,
  tierFor,
  FAIRNESS_TIERS,
  change24h,
  fmt,
  compact,
  FEE_BPS,
  TIMEFRAMES,
  aggregate,
  addLiquidity,
  removeLiquidity,
  quoteLiquidity,
  deposit,
  withdraw,
  resetAccount,
  portfolioEquity,
  exportFillsCsv,
  type Side,
  type OrderType,
  type TimeInForce,
  type TimeframeId,
  type Market,
} from "@/lib/exchange";
import CandleChart from "@/components/exchange/CandleChart";
import DepthChart from "@/components/exchange/DepthChart";
import {
  Search, Shield, Activity, Star, TrendingUp, TrendingDown, AlertTriangle,
  Layers as LayersIcon, Wallet, Gauge, X, Download, Droplets, RotateCcw,
} from "lucide-react";

type Tab = "orders" | "history" | "balances" | "pool";

export default function PiDEX() {
  const state = useSyncExternalStore(exchangeStore.subscribe, exchangeStore.getSnapshot, exchangeStore.getSnapshot);
  const [symbol, setSymbol] = useState(state.symbols[1] ?? state.symbols[0]);
  const [query, setQuery] = useState("");
  const [side, setSide] = useState<Side>("buy");
  const [type, setType] = useState<OrderType>("limit");
  const [priceInput, setPriceInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [triggerInput, setTriggerInput] = useState("");
  const [tif, setTif] = useState<TimeInForce>("GTC");
  const [postOnly, setPostOnly] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [tf, setTf] = useState<TimeframeId>("1m");
  const [slip, setSlip] = useState(50); // bps
  const [zk, setZk] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");
  const [lpAmount, setLpAmount] = useState("");
  const [treasuryAmount, setTreasuryAmount] = useState("");
  const [treasuryAsset, setTreasuryAsset] = useState("π");
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const m = state.markets[symbol];
  const tier = tierFor(state.account.volume30d);
  const price = parseFloat(priceInput) || m.price;
  const size = parseFloat(sizeInput) || 0;
  const equity = portfolioEquity(state);
  const lpPos = state.account.lp[symbol];
  const candles = useMemo(
    () => aggregate(m.candles, TIMEFRAMES.find((x) => x.id === tf)?.minutes ?? 1),
    [m.candles, tf],
  );

  const markets = useMemo(
    () =>
      state.symbols
        .map((s) => state.markets[s])
        .filter((x) => x.symbol.toLowerCase().includes(query.toLowerCase()) || x.layer.name.toLowerCase().includes(query.toLowerCase())),
    [state, query],
  );

  const quote = useMemo(() => {
    if (type === "limit" || size <= 0) return null;
    const amountIn = side === "buy" ? size * m.price : size;
    const [rIn, rOut] = side === "buy" ? [m.reserveQuote, m.reserveBase] : [m.reserveBase, m.reserveQuote];
    return ammQuote(rIn, rOut, amountIn);
  }, [type, size, side, m]);

  const openOrders = state.account.orders.filter((o) => o.status === "open" || o.status === "pending");
  const chg = change24h(m);

  const flash = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    window.setTimeout(() => setToast(null), 3800);
  };

  const submit = () => {
    if (size <= 0) return flash(false, "Enter an order size");
    const o = placeOrder({
      symbol,
      side,
      type,
      size,
      price: type === "limit" ? price : undefined,
      trigger: type === "stop" ? parseFloat(triggerInput) || 0 : undefined,
      slippageBps: slip,
      zk,
      tif,
      postOnly,
      reduceOnly,
    });
    if (o.status === "rejected") flash(false, o.reason ?? "Order rejected");
    else if (o.status === "pending") flash(true, `STOP ${side.toUpperCase()} armed @ ${fmt(o.trigger ?? 0, 5)} π`);
    else flash(true, `${type.toUpperCase()} ${side.toUpperCase()} ${fmt(o.size, 2)} ${m.layer.id}π @ ${fmt(o.price, 5)} π`);
  };

  const setPct = (pct: number) => {
    const bal = side === "buy" ? (state.account.balances["π"] ?? 0) / m.price : state.account.balances[`${m.layer.id}π`] ?? 0;
    setSizeInput((bal * pct).toFixed(2));
  };

  const runLiquidity = (fn: () => { ok: boolean; message: string }) => {
    const r = fn();
    flash(r.ok, r.message);
  };

  const downloadCsv = () => {
    const blob = new Blob([exportFillsCsv(state)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pidex-fills-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    flash(true, `Exported ${state.account.fills.length} fills`);
  };


  return (
    <div className="space-y-3">
      {/* Ticker strip */}
      <section className="card px-4 py-3 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg flex items-center justify-center text-black font-bold text-lg" style={{ background: m.layer.hex }}>π</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold mono">{m.symbol}</h1>
              <span className="chip">{m.layer.name} · {m.layer.role}</span>
              {m.halted ? (
                <span className="chip" style={{ borderColor: "#f85149", color: "#f85149" }}>
                  <AlertTriangle size={10} /> HALTED · PiRC-251
                </span>
              ) : (
                <span className="chip"><span className="pulse-dot" /> Live</span>
              )}
            </div>
            <div className="text-[11px] text-muted">PiRC-101 base pair · Spot · Hybrid CLOB + AMM</div>
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold mono" style={{ color: chg >= 0 ? "#3fb950" : "#f85149" }}>{fmt(m.price, 5)}</span>
          <span className={`text-sm mono flex items-center gap-1 ${chg >= 0 ? "text-green" : "text-red"}`}>
            {chg >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{chg.toFixed(2)}%
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-xs ml-auto">
          <Stat label="24h High" value={fmt(m.high24h, 5)} />
          <Stat label="24h Low" value={fmt(m.low24h, 5)} />
          <Stat label="24h Vol (π)" value={compact(m.vol24h)} />
          <Stat label="Pool TVL (π)" value={compact(m.reserveQuote * 2)} />
        </div>
      </section>

      <div className="grid xl:grid-cols-[240px_1fr_300px] lg:grid-cols-[220px_1fr] gap-3">
        {/* Markets rail */}
        <section className="card p-3 order-2 xl:order-1 lg:order-1">
          <div className="flex items-center gap-2 bg-panel2 border border-border rounded-md px-2 py-1.5 mb-2">
            <Search size={13} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search markets"
              className="bg-transparent text-xs w-full focus:outline-none"
            />
          </div>
          <div className="text-[10px] text-muted grid grid-cols-3 px-1 mb-1 uppercase tracking-wide">
            <span>Pair</span><span className="text-right">Last</span><span className="text-right">24h</span>
          </div>
          <div className="space-y-0.5">
            {markets.map((x) => {
              const c = change24h(x);
              const active = x.symbol === symbol;
              return (
                <button
                  key={x.symbol}
                  onClick={() => { setSymbol(x.symbol); setPriceInput(""); }}
                  className={`w-full grid grid-cols-3 items-center px-1.5 py-1.5 rounded text-xs mono transition ${active ? "bg-panel2" : "hover:bg-panel2/50"}`}
                  style={active ? { boxShadow: `inset 2px 0 0 ${x.layer.hex}` } : {}}
                >
                  <span className="text-left flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: x.layer.hex }} />
                    {x.layer.id}π
                  </span>
                  <span className="text-right">{fmt(x.price, 4)}</span>
                  <span className={`text-right ${c >= 0 ? "text-green" : "text-red"}`}>{c.toFixed(2)}%</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border space-y-1 text-[10px] text-muted">
            <div className="flex justify-between"><span>Fee tier</span><span className="mono" style={{ color: tier.hex }}>T{tier.tier} {tier.name}</span></div>
            <div className="flex justify-between"><span>Maker / Taker</span><span className="mono">{tier.makerBps / 100}% / {tier.takerBps / 100}%</span></div>
            <div className="flex justify-between"><span>30d volume</span><span className="mono">{compact(state.account.volume30d)} π</span></div>
          </div>
        </section>

        {/* Chart + book + form */}
        <section className="order-1 xl:order-2 lg:order-2 space-y-3">
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Activity size={13} /> <span className="mono">{tf} · Japanese candlesticks</span>
              </div>
              <div className="flex gap-1 text-[10px]">
                {TIMEFRAMES.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => setTf(x.id)}
                    className={`px-2 py-1 rounded transition ${x.id === tf ? "bg-panel2 text-text" : "text-muted hover:text-text"}`}
                  >
                    {x.id}
                  </button>
                ))}
              </div>
            </div>
            <CandleChart candles={candles} accent={m.layer.hex} />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <OrderBook m={m} onPick={(p) => { setType("limit"); setPriceInput(p.toFixed(6)); }} />
            <div className="card p-3">
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-2"><LayersIcon size={13} /> Market Depth</h3>
              <DepthChart bids={m.bids} asks={m.asks} />
              <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] mono">
                <div className="text-green">Bid liq {compact(m.bids[m.bids.length - 1]?.total ?? 0)}</div>
                <div className="text-red text-right">Ask liq {compact(m.asks[m.asks.length - 1]?.total ?? 0)}</div>
              </div>
            </div>
          </div>

          {/* Order ticket */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex rounded-md overflow-hidden border border-border">
                {(["limit", "market", "amm", "stop"] as OrderType[]).map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={`px-3 py-1.5 text-xs capitalize transition ${type === t ? "bg-panel2 text-text" : "text-muted hover:text-text"}`}>
                    {t === "amm" ? "AMM Swap" : t === "stop" ? "Stop / TP" : t}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-1">
                <button onClick={() => setSide("buy")} className={`px-4 py-1.5 rounded text-xs font-semibold ${side === "buy" ? "bg-green text-black" : "bg-panel2 text-muted"}`}>Buy</button>
                <button onClick={() => setSide("sell")} className={`px-4 py-1.5 rounded text-xs font-semibold ${side === "sell" ? "bg-red text-white" : "bg-panel2 text-muted"}`}>Sell</button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                label={`Price (π)${type !== "limit" ? " · market" : ""}`}
                value={type === "limit" ? priceInput : fmt(m.price, 6)}
                disabled={type !== "limit"}
                onChange={setPriceInput}
                placeholder={fmt(m.price, 6)}
              />
              <Field label={`Size (${m.layer.id}π)`} value={sizeInput} onChange={setSizeInput} placeholder="0.00" />
            </div>

            {type === "stop" && (
              <div className="mt-3">
                <Field
                  label={`Trigger price (π) · ${side === "buy" ? "fires at or above" : "fires at or below"}`}
                  value={triggerInput}
                  onChange={setTriggerInput}
                  placeholder={fmt(m.price, 6)}
                />
              </div>
            )}

            <div className="flex gap-1 mt-2">
              {[0.25, 0.5, 0.75, 1].map((p) => (
                <button key={p} onClick={() => setPct(p)} className="flex-1 py-1 rounded bg-panel2 text-[10px] text-muted hover:text-text transition">
                  {p * 100}%
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[10px] text-muted uppercase tracking-wide">Time in force</span>
              <div className="flex rounded-md overflow-hidden border border-border">
                {(["GTC", "IOC", "FOK"] as TimeInForce[]).map((t) => (
                  <button key={t} onClick={() => setTif(t)}
                    className={`px-2.5 py-1 text-[10px] mono transition ${tif === t ? "bg-panel2 text-text" : "text-muted hover:text-text"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
                <input type="checkbox" checked={postOnly} onChange={(e) => setPostOnly(e.target.checked)} className="accent-gold" />
                Post-only
              </label>
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
                <input type="checkbox" checked={reduceOnly} onChange={(e) => setReduceOnly(e.target.checked)} className="accent-gold" />
                Reduce-only
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="block">
                <div className="text-[10px] text-muted uppercase tracking-wide mb-1 flex justify-between">
                  <span>Max slippage (PiRC-227)</span><span className="mono text-text">{(slip / 100).toFixed(2)}%</span>
                </div>
                <input type="range" min={5} max={500} step={5} value={slip} onChange={(e) => setSlip(+e.target.value)}
                  className="w-full accent-gold" />
              </label>
              <label className="flex items-end gap-2 text-xs cursor-pointer select-none pb-1">
                <input type="checkbox" checked={zk} onChange={(e) => setZk(e.target.checked)} className="accent-purple" />
                <Shield size={12} className="text-purple" /> Shielded settlement · BN254 / Groth16 (PiRC-800)
              </label>
            </div>


            <div className="mt-3 space-y-1 text-[11px] mono">
              <Row k="Est. total" v={`${fmt(size * (type === "limit" ? price : m.price), 5)} π`} />
              <Row k={`Fee · T${tier.tier} ${type === "limit" ? "maker" : "taker"}`}
                v={`${((type === "limit" ? tier.makerBps : tier.takerBps) / 100).toFixed(2)}%`} />
              {quote && <Row k="Price impact" v={`${(quote.priceImpactBps / 100).toFixed(3)}%`} danger={quote.priceImpactBps > slip} />}
              {quote && <Row k="Min received" v={`${fmt(quote.out * (1 - slip / 10000), 5)} ${side === "buy" ? `${m.layer.id}π` : "π"}`} />}
              <Row k="Pool fee (PiRC-215)" v={`${FEE_BPS / 100}% · x·y=k`} />
            </div>

            <button
              onClick={submit}
              disabled={m.halted}
              className={`w-full mt-3 py-2.5 rounded-md font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${side === "buy" ? "bg-green text-black hover:brightness-110" : "bg-red text-white hover:brightness-110"}`}
            >
              {m.halted ? "Trading halted — circuit breaker" : `${side === "buy" ? "Buy" : "Sell"} ${m.layer.id}π`}
            </button>
            <div className="text-[10px] text-muted mono pt-2 mt-2 border-t border-border">
              Router PIDEX-ROUTER-V1 · Settlement Pi Mainnet + Soroban · Registry {m.layer.address.slice(0, 8)}…{m.layer.address.slice(-6)}
            </div>
          </div>
        </section>

        {/* Trades + tier ladder */}
        <section className="order-3 space-y-3">
          <div className="card p-3">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-2"><Activity size={13} /> Live Trades</h3>
            <div className="text-[10px] text-muted grid grid-cols-3 px-1 mb-1 uppercase">
              <span>Price</span><span className="text-right">Size</span><span className="text-right">Time</span>
            </div>
            <div className="space-y-0.5 text-[11px] mono max-h-72 overflow-auto">
              {m.trades.length === 0 && <div className="text-muted py-2">Streaming…</div>}
              {m.trades.map((t) => (
                <div key={t.id} className="grid grid-cols-3 px-1 py-0.5 rounded hover:bg-panel2/50">
                  <span className={t.side === "buy" ? "text-green" : "text-red"}>
                    {t.zk && <Shield size={9} className="inline text-purple mr-1" />}{fmt(t.price, 5)}
                  </span>
                  <span className="text-right">{fmt(t.size, 2)}</span>
                  <span className="text-right text-muted">{new Date(t.ts).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-3">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-2"><Gauge size={13} /> 7-Tier Fairness Schedule</h3>
            <div className="space-y-1 text-[10px] mono">
              {FAIRNESS_TIERS.map((t) => (
                <div key={t.tier} className={`flex items-center gap-2 px-1.5 py-1 rounded ${t.tier === tier.tier ? "bg-panel2" : ""}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.hex }} />
                  <span className="w-20">T{t.tier} {t.name}</span>
                  <span className="text-muted flex-1">≥{compact(t.minVolume)} π</span>
                  <span>{(t.makerBps / 100).toFixed(2)}/{(t.takerBps / 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Account panel */}
      <section className="card p-4">
        <div className="flex items-center gap-1 border-b border-border mb-3 text-xs">
          {(["orders", "history", "balances", "pool"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 capitalize transition border-b-2 -mb-px ${tab === t ? "border-gold text-text" : "border-transparent text-muted hover:text-text"}`}>
              {t === "orders" ? `Open Orders (${openOrders.length})` : t === "pool" ? "Pool / AMM" : t}
            </button>
          ))}
          {tab === "orders" && openOrders.length > 0 && (
            <button onClick={() => cancelAll()} className="ml-auto text-[11px] text-muted hover:text-red transition">Cancel all</button>
          )}
        </div>

        {tab === "orders" && (
          <Table head={["Time", "Market", "Side", "Type", "TIF", "Price", "Trigger", "Size", "Filled", "Status", ""]}>
            {openOrders.length === 0 && <Empty cols={11} text="No open orders" />}
            {openOrders.map((o) => (
              <tr key={o.id} className="border-b border-border/40">
                <Td>{new Date(o.ts).toLocaleTimeString()}</Td>
                <Td>{o.symbol}</Td>
                <Td className={o.side === "buy" ? "text-green" : "text-red"}>{o.side.toUpperCase()}</Td>
                <Td>{o.type}{o.postOnly ? " · PO" : ""}{o.reduceOnly ? " · RO" : ""}</Td>
                <Td>{o.tif}</Td>
                <Td>{fmt(o.price, 5)}</Td>
                <Td>{o.trigger ? fmt(o.trigger, 5) : "—"}</Td>
                <Td>{fmt(o.size, 2)}</Td>
                <Td>{fmt(o.filled, 2)}</Td>
                <Td className={o.status === "pending" ? "text-gold" : ""}>{o.status}</Td>
                <Td>
                  <button onClick={() => cancelOrder(o.id)} className="text-muted hover:text-red transition"><X size={13} /></button>
                </Td>
              </tr>
            ))}
          </Table>
        )}

        {tab === "history" && (
          <>
            <div className="flex justify-end mb-2">
              <button onClick={downloadCsv} className="flex items-center gap-1.5 text-[11px] text-muted hover:text-text transition">
                <Download size={12} /> Export CSV
              </button>
            </div>
            <Table head={["Time", "Market", "Side", "Price", "Size", "Fee (π)", "ZK", "Tx"]}>
              {state.account.fills.length === 0 && <Empty cols={8} text="No fills yet" />}
              {state.account.fills.map((f) => (
                <tr key={f.id} className="border-b border-border/40">
                  <Td>{new Date(f.ts).toLocaleTimeString()}</Td>
                  <Td>{f.symbol}</Td>
                  <Td className={f.side === "buy" ? "text-green" : "text-red"}>{f.side.toUpperCase()}</Td>
                  <Td>{fmt(f.price, 5)}</Td>
                  <Td>{fmt(f.size, 2)}</Td>
                  <Td>{fmt(f.fee, 5)}</Td>
                  <Td>{f.zk ? <Shield size={11} className="text-purple" /> : "—"}</Td>
                  <Td className="text-muted">{f.txHash.slice(0, 12)}…</Td>
                </tr>
              ))}
            </Table>
          </>
        )}

        {tab === "balances" && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <Stat label="Portfolio equity (π)" value={fmt(equity.equity, 2)} />
              <Stat label="Spot value (π)" value={fmt(equity.spot, 2)} />
              <Stat label="LP value (π)" value={fmt(equity.lpValue, 2)} />
              <Stat label="Fees paid (π)" value={fmt(equity.feesPaid, 4)} />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {Object.entries(state.account.balances).map(([sym, bal]) => (
                <button
                  key={sym}
                  onClick={() => setTreasuryAsset(sym)}
                  className={`bg-panel2 rounded-md px-3 py-2 flex items-center gap-2 text-left transition hover:brightness-125 ${treasuryAsset === sym ? "ring-1 ring-gold" : ""}`}
                >
                  <Wallet size={14} className="text-muted" />
                  <div>
                    <div className="text-[10px] text-muted uppercase">{sym}</div>
                    <div className="mono text-sm">{fmt(bal, 4)}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-border">
              <div className="w-40">
                <Field label={`Amount (${treasuryAsset})`} value={treasuryAmount} onChange={setTreasuryAmount} placeholder="0.00" />
              </div>
              <button
                onClick={() => runLiquidity(() => deposit(treasuryAsset, parseFloat(treasuryAmount) || 0))}
                className="px-4 py-2 rounded-md bg-green text-black text-xs font-semibold hover:brightness-110"
              >
                Deposit
              </button>
              <button
                onClick={() => runLiquidity(() => withdraw(treasuryAsset, parseFloat(treasuryAmount) || 0))}
                className="px-4 py-2 rounded-md bg-panel2 border border-border text-xs font-semibold hover:text-red"
              >
                Withdraw
              </button>
              <button
                onClick={() => { resetAccount(); flash(true, "Account reset to sovereign defaults"); }}
                className="ml-auto flex items-center gap-1.5 text-[11px] text-muted hover:text-text transition"
              >
                <RotateCcw size={12} /> Reset account
              </button>
            </div>
          </div>
        )}

        {tab === "pool" && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-3 gap-3 text-xs">
              <PoolCard title="Reserves (PiRC-215)">
                <Row k={`${m.layer.id}π`} v={fmt(m.reserveBase, 2)} />
                <Row k="π" v={fmt(m.reserveQuote, 2)} />
                <Row k="k invariant" v={compact(m.reserveBase * m.reserveQuote)} />
                <Row k="Spot" v={fmt(m.reserveQuote / m.reserveBase, 6)} />
              </PoolCard>
              <PoolCard title="Risk controls">
                <Row k="TWAP" v={fmt(m.twap, 6)} />
                <Row k="Deviation" v={`${(((m.price - m.twap) / m.twap) * 100).toFixed(3)}%`} />
                <Row k="Breaker (PiRC-251)" v={m.halted ? "TRIPPED" : "Armed @ 8%"} danger={m.halted} />
                <Row k="MEV" v="Private mempool" />
              </PoolCard>
              <PoolCard title="Settlement">
                <Row k="Fee schedule" v={`${FEE_BPS / 100}% pool + tier`} />
                <Row k="Curve" v="x·y=k · constant product" />
                <Row k="Verifier" v="BN254 · Groth16" />
                <Row k="Layer" v={`${m.layer.id} ${m.layer.name} · ${m.layer.role}`} />
              </PoolCard>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-panel2/50 border border-border rounded-lg p-3">
                <div className="text-[11px] font-semibold mb-2 flex items-center gap-2"><Droplets size={13} /> Provide liquidity</div>
                <Field label="Amount (π) — paired automatically" value={lpAmount} onChange={setLpAmount} placeholder="0.00" />
                {(() => {
                  const q = quoteLiquidity(symbol, parseFloat(lpAmount) || 0);
                  return (
                    <div className="mt-2 space-y-0.5 mono text-[11px]">
                      <Row k={`Pairs with ${m.layer.id}π`} v={fmt(q.base, 4)} />
                      <Row k="LP shares minted" v={fmt(q.shares, 4)} />
                      <Row k="Pool share" v={`${q.poolPct.toFixed(4)}%`} />
                    </div>
                  );
                })()}
                <button
                  onClick={() => runLiquidity(() => addLiquidity(symbol, parseFloat(lpAmount) || 0))}
                  className="w-full mt-3 py-2 rounded-md bg-gold text-black text-xs font-semibold hover:brightness-110"
                >
                  Add liquidity
                </button>
              </div>

              <div className="bg-panel2/50 border border-border rounded-lg p-3">
                <div className="text-[11px] font-semibold mb-2 flex items-center gap-2"><Droplets size={13} /> Your position</div>
                {lpPos ? (
                  <div className="space-y-0.5 mono text-[11px]">
                    <Row k="LP shares" v={fmt(lpPos.shares, 4)} />
                    <Row k="Pool share" v={`${((lpPos.shares / m.lpShares) * 100).toFixed(4)}%`} />
                    <Row k="Redeemable π" v={fmt((lpPos.shares / m.lpShares) * m.reserveQuote, 4)} />
                    <Row k={`Redeemable ${m.layer.id}π`} v={fmt((lpPos.shares / m.lpShares) * m.reserveBase, 4)} />
                    <Row k="Fees earned (π)" v={fmt(lpPos.feesEarned, 6)} />
                  </div>
                ) : (
                  <div className="text-muted text-[11px] py-6 text-center">No LP position in {m.symbol}</div>
                )}
                <div className="flex gap-1 mt-3">
                  {[0.25, 0.5, 1].map((p) => (
                    <button
                      key={p}
                      disabled={!lpPos}
                      onClick={() => runLiquidity(() => removeLiquidity(symbol, p))}
                      className="flex-1 py-2 rounded-md bg-panel2 border border-border text-[11px] hover:text-text disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Remove {p * 100}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </section>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 card px-4 py-3 text-xs flex items-center gap-2 max-w-sm"
          style={{ borderColor: toast.ok ? "#3fb950" : "#f85149" }}>
          {toast.ok ? <Star size={14} className="text-green" /> : <AlertTriangle size={14} className="text-red" />}
          <span className="mono">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- sub components ---------------- */

function OrderBook({ m, onPick }: { m: Market; onPick: (p: number) => void }) {
  const max = Math.max(m.bids[m.bids.length - 1]?.total ?? 1, m.asks[m.asks.length - 1]?.total ?? 1);
  const spread = (m.asks[0]?.price ?? 0) - (m.bids[0]?.price ?? 0);
  const row = (l: (typeof m.bids)[number], side: Side) => (
    <button key={`${side}${l.price}`} onClick={() => onPick(l.price)}
      className="relative w-full grid grid-cols-3 px-1 py-[3px] text-[11px] mono hover:bg-panel2/60">
      <div className="absolute inset-y-0 right-0" style={{ width: `${(l.total / max) * 100}%`, background: side === "buy" ? "rgba(63,185,80,0.12)" : "rgba(248,81,73,0.12)" }} />
      <span className={`relative text-left ${side === "buy" ? "text-green" : "text-red"}`}>{fmt(l.price, 5)}</span>
      <span className="relative text-right">{fmt(l.size, 2)}</span>
      <span className="relative text-right text-muted">{compact(l.total)}</span>
    </button>
  );
  return (
    <div className="card p-3">
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-2"><LayersIcon size={13} /> Order Book</h3>
      <div className="text-[10px] text-muted grid grid-cols-3 px-1 mb-1 uppercase">
        <span>Price (π)</span><span className="text-right">Size</span><span className="text-right">Total</span>
      </div>
      <div className="flex flex-col-reverse">{m.asks.slice(0, 9).map((l) => row(l, "sell"))}</div>
      <div className="flex items-center justify-between px-1 py-1.5 my-1 border-y border-border">
        <span className="text-sm font-bold mono" style={{ color: m.layer.hex }}>{fmt(m.price, 5)}</span>
        <span className="text-[10px] text-muted mono">spread {fmt(spread, 5)}</span>
      </div>
      <div>{m.bids.slice(0, 9).map((l) => row(l, "buy"))}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted uppercase tracking-wide">{label}</div>
      <div className="mono font-semibold text-sm">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-[10px] text-muted uppercase tracking-wide mb-1">{label}</div>
      <input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-panel2 border border-border rounded-md px-3 py-2 mono text-sm focus:outline-none focus:border-gold disabled:text-muted"
      />
    </label>
  );
}

function Row({ k, v, danger }: { k: string; v: string; danger?: boolean }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-1">
      <span className="text-muted">{k}</span>
      <span className={danger ? "text-red" : ""}>{v}</span>
    </div>
  );
}

function PoolCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-panel2/50 border border-border rounded-lg p-3">
      <div className="text-[11px] font-semibold mb-2">{title}</div>
      <div className="space-y-0.5 mono text-[11px]">{children}</div>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] mono">
        <thead>
          <tr className="text-muted text-left uppercase text-[10px]">
            {head.map((h, i) => <th key={i} className="font-medium py-1 px-2">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-1.5 px-2 ${className}`}>{children}</td>;
}
function Empty({ cols, text }: { cols: number; text: string }) {
  return <tr><td colSpan={cols} className="py-6 text-center text-muted">{text}</td></tr>;
}
