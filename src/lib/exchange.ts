/**
 * PiDEX Exchange Engine
 * -------------------------------------------------------------
 * Client-side deterministic implementation of the economic
 * mechanisms defined by the PiRC monorepo standards:
 *
 *   PiRC-101  Sovereign Monetary Standard  → π base pair discipline
 *   PiRC-207  7-Layer token registry       → market universe + fairness tiers
 *   PiRC-215  AMM invariant x*y=k          → 30 bps fee schedule
 *   PiRC-227  Slippage / MEV protection    → min_out + impact guard
 *   PiRC-251  Circuit breaker              → TWAP deviation halt
 *   PiRC-800  Shielded settlement          → BN254 / Groth16 flag
 *
 * The same math as contracts/pidex_amm/src/lib.rs is mirrored here so the
 * UI quotes are byte-for-byte comparable with on-chain execution.
 */

import { LAYERS, Layer } from "@/data/layers";

export const FEE_BPS = 30;
export const BPS = 10_000;
export const MAX_IMPACT_BPS = 500; // PiRC-227 default guard: 5%
export const BREAKER_BPS = 800; // PiRC-251: halt at 8% TWAP deviation

export type Side = "buy" | "sell";
export type OrderType = "limit" | "market" | "amm";
export type OrderStatus = "open" | "filled" | "cancelled" | "rejected";

export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
export type BookLevel = { price: number; size: number; total: number; zk: boolean };
export type PublicTrade = { id: string; side: Side; price: number; size: number; ts: number; zk: boolean };

export type Order = {
  id: string;
  symbol: string;
  side: Side;
  type: OrderType;
  price: number;
  size: number;
  filled: number;
  status: OrderStatus;
  ts: number;
  zk: boolean;
  feeBps: number;
  reason?: string;
};

export type Fill = {
  id: string;
  orderId: string;
  symbol: string;
  side: Side;
  price: number;
  size: number;
  fee: number;
  ts: number;
  zk: boolean;
  txHash: string;
};

/* ---------------- PiRC-207 fairness tiers (7 tiers) ---------------- */

export type FairnessTier = {
  tier: number;
  name: string;
  minVolume: number; // 30d π volume
  makerBps: number;
  takerBps: number;
  hex: string;
};

export const FAIRNESS_TIERS: FairnessTier[] = [
  { tier: 0, name: "Pioneer", minVolume: 0, makerBps: 10, takerBps: 30, hex: "#a970ff" },
  { tier: 1, name: "Contributor", minVolume: 1_000, makerBps: 8, takerBps: 26, hex: "#ffb020" },
  { tier: 2, name: "Node", minVolume: 10_000, makerBps: 6, takerBps: 22, hex: "#f0d95b" },
  { tier: 3, name: "Validator", minVolume: 50_000, makerBps: 4, takerBps: 18, hex: "#ff8c42" },
  { tier: 4, name: "Liquidity", minVolume: 250_000, makerBps: 2, takerBps: 14, hex: "#58a6ff" },
  { tier: 5, name: "Sovereign", minVolume: 1_000_000, makerBps: 0, takerBps: 10, hex: "#3fb950" },
  { tier: 6, name: "Council", minVolume: 5_000_000, makerBps: -2, takerBps: 6, hex: "#f85149" },
];

export function tierFor(volume30d: number): FairnessTier {
  return [...FAIRNESS_TIERS].reverse().find((t) => volume30d >= t.minVolume) ?? FAIRNESS_TIERS[0];
}

/* ---------------- AMM math (mirrors pidex_amm) ---------------- */

export function ammQuote(reserveIn: number, reserveOut: number, amountIn: number) {
  if (amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) {
    return { out: 0, priceImpactBps: 0, effPrice: 0, fee: 0 };
  }
  const fee = (amountIn * FEE_BPS) / BPS;
  const inAfterFee = amountIn - fee;
  const out = reserveOut - (reserveIn * reserveOut) / (reserveIn + inAfterFee);
  const spot = reserveOut / reserveIn;
  const eff = out / amountIn;
  const impact = Math.max(0, (1 - eff / spot) * BPS);
  return { out, priceImpactBps: impact, effPrice: eff, fee };
}

/* ---------------- Market state ---------------- */

export type Market = {
  symbol: string;
  layer: Layer;
  price: number;
  open24h: number;
  high24h: number;
  low24h: number;
  vol24h: number;
  reserveBase: number;
  reserveQuote: number;
  twap: number;
  halted: boolean;
  candles: Candle[];
  trades: PublicTrade[];
  bids: BookLevel[];
  asks: BookLevel[];
};

export type Account = {
  volume30d: number;
  balances: Record<string, number>;
  orders: Order[];
  fills: Fill[];
};

export type ExchangeState = {
  markets: Record<string, Market>;
  symbols: string[];
  account: Account;
  tick: number;
};

const CANDLE_MS = 60_000;
const rid = () => Math.random().toString(36).slice(2, 10);
const hash = () => Array.from({ length: 4 }, () => Math.random().toString(16).slice(2, 10)).join("").toUpperCase();

function seedMarket(layer: Layer, i: number): Market {
  const base = [0.618, 3.1415, 1.0, 0.4242, 0.0777, 1.618, 9.42][i] ?? 1;
  const now = Date.now();
  const candles: Candle[] = [];
  let p = base;
  for (let k = 120; k > 0; k--) {
    const o = p;
    const drift = (Math.random() - 0.48) * base * 0.012;
    const c = Math.max(base * 0.4, o + drift);
    const h = Math.max(o, c) * (1 + Math.random() * 0.004);
    const l = Math.min(o, c) * (1 - Math.random() * 0.004);
    candles.push({ t: now - k * CANDLE_MS, o, h, l, c, v: 200 + Math.random() * 4000 });
    p = c;
  }
  const reserveQuote = 250_000 + i * 90_000;
  const m: Market = {
    symbol: `${layer.id}π/π`,
    layer,
    price: p,
    open24h: candles[0].o,
    high24h: Math.max(...candles.map((c) => c.h)),
    low24h: Math.min(...candles.map((c) => c.l)),
    vol24h: candles.reduce((s, c) => s + c.v, 0),
    reserveQuote,
    reserveBase: reserveQuote / p,
    twap: p,
    halted: false,
    candles,
    trades: [],
    bids: [],
    asks: [],
  };
  rebuildBook(m);
  return m;
}

function rebuildBook(m: Market) {
  const mk = (side: Side): BookLevel[] => {
    let total = 0;
    return Array.from({ length: 14 }, (_, i) => {
      const step = m.price * 0.0006 * (i + 1) * (0.8 + Math.random() * 0.5);
      const price = side === "buy" ? m.price - step : m.price + step;
      const size = (40 + Math.random() * 900) * (1 + i * 0.12);
      total += size;
      return { price: +price.toFixed(6), size: +size.toFixed(2), total: +total.toFixed(2), zk: Math.random() > 0.55 };
    });
  };
  m.bids = mk("buy");
  m.asks = mk("sell");
}

function createState(): ExchangeState {
  const markets: Record<string, Market> = {};
  LAYERS.forEach((l, i) => {
    const m = seedMarket(l, i);
    markets[m.symbol] = m;
  });
  const balances: Record<string, number> = { π: 25_000 };
  LAYERS.forEach((l) => (balances[`${l.id}π`] = 1_000));
  return {
    markets,
    symbols: Object.keys(markets),
    account: { volume30d: 128_400, balances, orders: [], fills: [], },
    tick: 0,
  };
}

/* ---------------- Store ---------------- */

let state: ExchangeState = createState();
const listeners = new Set<() => void>();
const emit = () => {
  state = { ...state, tick: state.tick + 1 };
  listeners.forEach((l) => l());
};

export const exchangeStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    start();
    return () => {
      listeners.delete(cb);
      if (listeners.size === 0) stop();
    };
  },
  getSnapshot: () => state,
};

let timer: ReturnType<typeof setInterval> | null = null;

function start() {
  if (timer) return;
  timer = setInterval(step, 1000);
}
function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

function step() {
  const now = Date.now();
  Object.values(state.markets).forEach((m) => {
    // Geometric random walk anchored to the AMM spot (PiRC-215)
    const spot = m.reserveQuote / m.reserveBase;
    const shock = (Math.random() - 0.5) * m.price * 0.004;
    const pull = (spot - m.price) * 0.25;
    m.price = Math.max(m.price * 0.2, m.price + shock + pull);

    // TWAP + circuit breaker (PiRC-251)
    m.twap = m.twap * 0.97 + m.price * 0.03;
    m.halted = Math.abs(m.price - m.twap) / m.twap > BREAKER_BPS / BPS;

    // Organic flow through the pool keeps reserves honest
    if (Math.random() > 0.35) {
      const side: Side = Math.random() > 0.5 ? "buy" : "sell";
      const notional = 20 + Math.random() * 900;
      if (side === "buy") {
        const q = ammQuote(m.reserveQuote, m.reserveBase, notional);
        m.reserveQuote += notional;
        m.reserveBase -= q.out;
      } else {
        const sizeBase = notional / m.price;
        const q = ammQuote(m.reserveBase, m.reserveQuote, sizeBase);
        m.reserveBase += sizeBase;
        m.reserveQuote -= q.out;
      }
      pushTrade(m, { id: rid(), side, price: +m.price.toFixed(6), size: +(notional / m.price).toFixed(2), ts: now, zk: Math.random() > 0.6 });
      m.vol24h += notional;
    }

    // Candle aggregation
    const last = m.candles[m.candles.length - 1];
    if (now - last.t >= CANDLE_MS) {
      m.candles = [...m.candles.slice(-239), { t: now, o: last.c, h: m.price, l: m.price, c: m.price, v: 0 }];
    } else {
      last.h = Math.max(last.h, m.price);
      last.l = Math.min(last.l, m.price);
      last.c = m.price;
      last.v += 40 + Math.random() * 200;
    }
    m.high24h = Math.max(m.high24h, m.price);
    m.low24h = Math.min(m.low24h, m.price);

    rebuildBook(m);
    matchResting(m, now);
  });
  emit();
}

function pushTrade(m: Market, t: PublicTrade) {
  m.trades = [t, ...m.trades].slice(0, 60);
}

/* ---------------- Order lifecycle ---------------- */

function settle(m: Market, o: Order, price: number, size: number, now: number) {
  const t = tierFor(state.account.volume30d);
  const feeBps = o.type === "limit" ? t.makerBps : t.takerBps;
  const notional = price * size;
  const fee = (notional * feeBps) / BPS;
  const b = state.account.balances;
  const baseSym = `${m.layer.id}π`;
  if (o.side === "buy") {
    b["π"] = (b["π"] ?? 0) - notional - fee;
    b[baseSym] = (b[baseSym] ?? 0) + size;
  } else {
    b[baseSym] = (b[baseSym] ?? 0) - size;
    b["π"] = (b["π"] ?? 0) + notional - fee;
  }
  o.filled += size;
  o.feeBps = feeBps;
  o.status = o.filled >= o.size - 1e-9 ? "filled" : "open";
  state.account.volume30d += notional;
  state.account.fills = [
    { id: rid(), orderId: o.id, symbol: m.symbol, side: o.side, price, size, fee, ts: now, zk: o.zk, txHash: hash() },
    ...state.account.fills,
  ].slice(0, 200);
  pushTrade(m, { id: rid(), side: o.side, price, size, ts: now, zk: o.zk });
}

function matchResting(m: Market, now: number) {
  state.account.orders.forEach((o) => {
    if (o.status !== "open" || o.symbol !== m.symbol || o.type !== "limit") return;
    const crossed = o.side === "buy" ? m.price <= o.price : m.price >= o.price;
    if (crossed) settle(m, o, o.price, o.size - o.filled, now);
  });
}

export type PlaceParams = {
  symbol: string;
  side: Side;
  type: OrderType;
  size: number; // base units (or π notional for market buy)
  price?: number;
  slippageBps?: number;
  zk?: boolean;
};

export function placeOrder(p: PlaceParams): Order {
  const now = Date.now();
  const m = state.markets[p.symbol];
  const t = tierFor(state.account.volume30d);
  const order: Order = {
    id: rid(),
    symbol: p.symbol,
    side: p.side,
    type: p.type,
    price: p.price ?? m.price,
    size: p.size,
    filled: 0,
    status: "open",
    ts: now,
    zk: !!p.zk,
    feeBps: p.type === "limit" ? t.makerBps : t.takerBps,
  };

  const reject = (reason: string) => {
    order.status = "rejected";
    order.reason = reason;
    state.account.orders = [order, ...state.account.orders].slice(0, 200);
    emit();
    return order;
  };

  if (!m) return reject("Unknown market");
  if (!(p.size > 0)) return reject("Size must be positive");
  if (m.halted) return reject("PiRC-251 circuit breaker active");

  const b = state.account.balances;
  const baseSym = `${m.layer.id}π`;
  const notional = order.price * order.size;
  if (p.side === "buy" && (b["π"] ?? 0) < notional) return reject("Insufficient π balance");
  if (p.side === "sell" && (b[baseSym] ?? 0) < order.size) return reject(`Insufficient ${baseSym} balance`);

  if (p.type === "limit") {
    state.account.orders = [order, ...state.account.orders].slice(0, 200);
    matchResting(m, now);
    emit();
    return order;
  }

  // market / amm → route through the pool, enforce PiRC-227
  const [rIn, rOut] = p.side === "buy" ? [m.reserveQuote, m.reserveBase] : [m.reserveBase, m.reserveQuote];
  const amountIn = p.side === "buy" ? notional : order.size;
  const q = ammQuote(rIn, rOut, amountIn);
  const guard = p.slippageBps ?? MAX_IMPACT_BPS;
  if (q.priceImpactBps > guard) return reject(`Slippage ${(q.priceImpactBps / 100).toFixed(2)}% exceeds ${(guard / 100).toFixed(2)}% (PiRC-227)`);

  const execPrice = p.side === "buy" ? amountIn / q.out : q.out / amountIn;
  if (p.side === "buy") {
    m.reserveQuote += amountIn;
    m.reserveBase -= q.out;
  } else {
    m.reserveBase += amountIn;
    m.reserveQuote -= q.out;
  }
  order.price = +execPrice.toFixed(8);
  order.size = p.side === "buy" ? q.out : order.size;
  state.account.orders = [order, ...state.account.orders].slice(0, 200);
  settle(m, order, order.price, order.size, now);
  emit();
  return order;
}

export function cancelOrder(id: string) {
  const o = state.account.orders.find((x) => x.id === id);
  if (o && o.status === "open") o.status = "cancelled";
  emit();
}

export function cancelAll(symbol?: string) {
  state.account.orders.forEach((o) => {
    if (o.status === "open" && (!symbol || o.symbol === symbol)) o.status = "cancelled";
  });
  emit();
}

/* ---------------- helpers ---------------- */

export const fmt = (n: number, d = 4) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export const compact = (n: number) =>
  Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n);

export function change24h(m: Market) {
  return ((m.price - m.open24h) / m.open24h) * 100;
}
