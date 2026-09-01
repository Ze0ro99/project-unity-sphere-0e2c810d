/**
 * PiRC-214 — Oracle & Purchasing-Power Layer
 * -----------------------------------------------------------------------------
 * Live Chainlink Data Feeds read directly on-chain via JSON-RPC `eth_call`
 * against the canonical AggregatorV3Interface proxies (Ethereum mainnet), plus
 * off-chain CEX medianisation. Feeds are aggregated with a robust median and
 * staleness (heartbeat) enforcement identical to the on-chain consumer
 * contracts in `contracts/chainlink_consumer` and `contracts/pirc_oracle`.
 */

export const RPC_ENDPOINTS = [
  "https://ethereum-rpc.publicnode.com",
  "https://eth.llamarpc.com",
  "https://rpc.ankr.com/eth",
];

export type FeedDef = {
  id: string;
  pair: string;
  address: string;
  /** Chainlink heartbeat in seconds — answer is stale past this window. */
  heartbeat: number;
  deviationBps: number;
  category: "crypto" | "commodity" | "fx" | "stable";
  /** Basket weight used by the purchasing-power index (sums to 1 per category). */
  basketWeight?: number;
  invert?: boolean;
};

/** Canonical Chainlink AggregatorV3 proxies (Ethereum mainnet). */
export const FEEDS: FeedDef[] = [
  { id: "eth-usd", pair: "ETH / USD", address: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", heartbeat: 3600, deviationBps: 50, category: "crypto" },
  { id: "btc-usd", pair: "BTC / USD", address: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c", heartbeat: 3600, deviationBps: 50, category: "crypto" },
  { id: "link-usd", pair: "LINK / USD", address: "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c", heartbeat: 3600, deviationBps: 50, category: "crypto" },
  { id: "usdc-usd", pair: "USDC / USD", address: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6", heartbeat: 86400, deviationBps: 25, category: "stable" },
  { id: "xau-usd", pair: "XAU / USD", address: "0x214eD9Da11D2fbe465a6fc601a91E62EBEc1a0D6", heartbeat: 86400, deviationBps: 20, category: "commodity", basketWeight: 0.35 },
  { id: "xag-usd", pair: "XAG / USD", address: "0x379589227b15F1a12195D3f2d90bBc9F31f95235", heartbeat: 86400, deviationBps: 20, category: "commodity", basketWeight: 0.15 },
  { id: "eur-usd", pair: "EUR / USD", address: "0xb49f677943BC038e9857d61E7d053CaA2C1734C1", heartbeat: 86400, deviationBps: 15, category: "fx", basketWeight: 0.25 },
  { id: "jpy-usd", pair: "JPY / USD", address: "0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3", heartbeat: 86400, deviationBps: 15, category: "fx", basketWeight: 0.10 },
  { id: "cny-usd", pair: "CNY / USD", address: "0xeF0a3109ce97e0B58557F0e3Ba95eA16Bfa4A89d", heartbeat: 86400, deviationBps: 15, category: "fx", basketWeight: 0.15 },
];

export type FeedRound = {
  def: FeedDef;
  roundId: string;
  answer: number;
  decimals: number;
  updatedAt: number;
  ageSec: number;
  stale: boolean;
  error?: string;
};

const SEL_LATEST_ROUND = "0xfeaf968c"; // latestRoundData()
const SEL_DECIMALS = "0x313ce567"; // decimals()

let rpcIndex = 0;

async function ethCall(to: string, data: string, signal?: AbortSignal): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    const url = RPC_ENDPOINTS[(rpcIndex + i) % RPC_ENDPOINTS.length];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
        signal,
      });
      const json = await res.json();
      if (json?.error) throw new Error(json.error.message ?? "rpc error");
      if (typeof json?.result !== "string") throw new Error("empty rpc result");
      rpcIndex = (rpcIndex + i) % RPC_ENDPOINTS.length;
      return json.result as string;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("all rpc endpoints failed");
}

/** Decode a 32-byte word at slot `i` of an ABI-encoded return blob. */
function word(hex: string, i: number): bigint {
  const body = hex.startsWith("0x") ? hex.slice(2) : hex;
  const slice = body.slice(i * 64, i * 64 + 64);
  if (slice.length < 64) throw new Error("short return data");
  return BigInt("0x" + slice);
}

/** Two's-complement int256 → bigint. */
function toInt256(v: bigint): bigint {
  const MAX = 1n << 255n;
  return v >= MAX ? v - (1n << 256n) : v;
}

const decimalsCache = new Map<string, number>();

export async function readDecimals(address: string, signal?: AbortSignal): Promise<number> {
  const hit = decimalsCache.get(address);
  if (hit != null) return hit;
  try {
    const raw = await ethCall(address, SEL_DECIMALS, signal);
    const d = Number(word(raw, 0));
    const safe = Number.isFinite(d) && d >= 0 && d <= 30 ? d : 8;
    decimalsCache.set(address, safe);
    return safe;
  } catch {
    return 8;
  }
}

export async function readFeed(def: FeedDef, signal?: AbortSignal): Promise<FeedRound> {
  const now = Math.floor(Date.now() / 1000);
  try {
    const [raw, decimals] = await Promise.all([
      ethCall(def.address, SEL_LATEST_ROUND, signal),
      readDecimals(def.address, signal),
    ]);
    const roundId = word(raw, 0);
    const answerRaw = toInt256(word(raw, 1));
    const updatedAt = Number(word(raw, 3));
    const answer = Number(answerRaw) / 10 ** decimals;
    const ageSec = Math.max(0, now - updatedAt);
    return {
      def,
      roundId: roundId.toString(),
      answer,
      decimals,
      updatedAt,
      ageSec,
      stale: ageSec > def.heartbeat * 1.25 || answer <= 0,
    };
  } catch (e) {
    return {
      def,
      roundId: "0",
      answer: NaN,
      decimals: 8,
      updatedAt: 0,
      ageSec: Number.POSITIVE_INFINITY,
      stale: true,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function readAllFeeds(signal?: AbortSignal): Promise<FeedRound[]> {
  return Promise.all(FEEDS.map((f) => readFeed(f, signal)));
}

/* ------------------------------------------------------------------ *
 * Off-chain medianised Pi quote (PiRC-214 §4 — multi-venue oracle)
 * ------------------------------------------------------------------ */

export type VenueQuote = { venue: string; price: number; ok: boolean; note?: string };

async function jsonFetch(url: string, signal?: AbortSignal): Promise<any> {
  const res = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function fetchPiVenues(signal?: AbortSignal): Promise<VenueQuote[]> {
  const sources: Array<{ venue: string; run: () => Promise<number> }> = [
    {
      venue: "OKX",
      run: async () => Number((await jsonFetch("https://www.okx.com/api/v5/market/ticker?instId=PI-USDT", signal))?.data?.[0]?.last),
    },
    {
      venue: "Bitget",
      run: async () => Number((await jsonFetch("https://api.bitget.com/api/v2/spot/market/tickers?symbol=PIUSDT", signal))?.data?.[0]?.lastPr),
    },
    {
      venue: "Coinbase",
      run: async () => {
        const r = await jsonFetch("https://api.coinbase.com/v2/exchange-rates?currency=USD", signal);
        const rate = Number(r?.data?.rates?.PI);
        return rate > 0 ? 1 / rate : NaN;
      },
    },
  ];
  return Promise.all(
    sources.map(async (s) => {
      try {
        const price = await s.run();
        if (!Number.isFinite(price) || price <= 0) throw new Error("no quote");
        return { venue: s.venue, price, ok: true };
      } catch (e) {
        return { venue: s.venue, price: NaN, ok: false, note: e instanceof Error ? e.message : "unavailable" };
      }
    }),
  );
}

export function median(values: number[]): number {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return NaN;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export type Aggregate = {
  price: number;
  sources: number;
  deviationBps: number;
  trusted: boolean;
};

/** Robust median aggregation with max-deviation quorum (mirrors the consumer contract). */
export function aggregate(quotes: VenueQuote[], maxDeviationBps = 300, minSources = 2): Aggregate {
  const prices = quotes.filter((q) => q.ok).map((q) => q.price);
  const price = median(prices);
  const deviationBps = prices.length
    ? Math.max(...prices.map((p) => Math.abs(p - price) / price)) * 10_000
    : Number.POSITIVE_INFINITY;
  return {
    price,
    sources: prices.length,
    deviationBps: Number.isFinite(deviationBps) ? deviationBps : 0,
    trusted: prices.length >= minSources && deviationBps <= maxDeviationBps,
  };
}

/* ------------------------------------------------------------------ *
 * Purchasing power (PiRC-214 §7)
 * ------------------------------------------------------------------ */

export type PurchasingPower = {
  basketUsd: number;
  basketBaseline: number;
  ppi: number; // purchasing-power index, 1.0 == baseline basket cost
  piUsd: number;
  goldGrams: number;
  silverGrams: number;
  eur: number;
  jpy: number;
  cny: number;
  realYieldBps: number;
  coverage: number; // share of basket legs sourced from live oracles
};

/** Baseline basket cost (USD) captured at PiRC-214 genesis — used as index 1.0. */
export const BASKET_BASELINE = 1_000;

const TROY_OUNCE_GRAMS = 31.1034768;

export function purchasingPower(rounds: FeedRound[], piUsd: number): PurchasingPower {
  const by = new Map(rounds.map((r) => [r.def.id, r]));
  const good = (id: string) => {
    const r = by.get(id);
    return r && !r.stale && Number.isFinite(r.answer) ? r.answer : NaN;
  };
  const xau = good("xau-usd");
  const xag = good("xag-usd");
  const eur = good("eur-usd");
  const jpy = good("jpy-usd");
  const cny = good("cny-usd");

  const legs: Array<[number, number]> = [
    [xau, 0.35],
    [xag, 0.15],
    [eur, 0.25],
    [jpy, 0.10],
    [cny, 0.15],
  ];
  const live = legs.filter(([v]) => Number.isFinite(v));
  const coverage = live.reduce((s, [, w]) => s + w, 0);

  // Basket is normalised so that a 1.0 index equals BASKET_BASELINE USD of
  // commodity+FX exposure at genesis reference levels.
  const REF: Record<string, number> = { xau: 2000, xag: 24, eur: 1.08, jpy: 0.0066, cny: 0.138 };
  const ratios: Array<[number, number]> = [
    [xau / REF.xau, 0.35],
    [xag / REF.xag, 0.15],
    [REF.eur / eur, 0.25],
    [REF.jpy / jpy, 0.10],
    [REF.cny / cny, 0.15],
  ].filter(([r]) => Number.isFinite(r) && r > 0) as Array<[number, number]>;

  const wsum = ratios.reduce((s, [, w]) => s + w, 0) || 1;
  const ppi = ratios.reduce((s, [r, w]) => s + r * w, 0) / wsum;
  const basketUsd = BASKET_BASELINE * ppi;

  const px = Number.isFinite(piUsd) ? piUsd : NaN;
  return {
    basketUsd,
    basketBaseline: BASKET_BASELINE,
    ppi,
    piUsd: px,
    goldGrams: Number.isFinite(xau) ? (px / xau) * TROY_OUNCE_GRAMS : NaN,
    silverGrams: Number.isFinite(xag) ? (px / xag) * TROY_OUNCE_GRAMS : NaN,
    eur: Number.isFinite(eur) ? px / eur : NaN,
    jpy: Number.isFinite(jpy) ? px / jpy : NaN,
    cny: Number.isFinite(cny) ? px / cny : NaN,
    realYieldBps: Number.isFinite(ppi) ? -(ppi - 1) * 10_000 : NaN,
    coverage,
  };
}

/** Purchasing power of 1 Pi expressed in the reference basket. */
export function piPurchasingPower(pp: PurchasingPower): number {
  return Number.isFinite(pp.piUsd) && pp.ppi > 0 ? pp.piUsd / pp.ppi : NaN;
}
