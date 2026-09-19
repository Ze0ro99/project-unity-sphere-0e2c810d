// PiRC-214 — Live Market Index (server-side venue aggregation)
// Aggregates real-time Pi Network spot data from public CEX endpoints.
// Runs server-side to bypass browser CORS restrictions on exchange APIs.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Venue = {
  venue: string;
  price: number;
  changePct: number | null;
  high24h: number | null;
  low24h: number | null;
  baseVol24h: number | null;
  quoteVol24h: number | null;
  trades24h: number | null;
  ok: boolean;
  note?: string;
};

const num = (v: unknown): number => {
  const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : NaN;
};
const orNull = (n: number) => (Number.isFinite(n) ? n : null);

async function jf(url: string, ms = 6000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const SOURCES: Array<{ venue: string; run: () => Promise<Venue> }> = [
  {
    venue: "OKX",
    run: async () => {
      const t = (await jf("https://www.okx.com/api/v5/market/ticker?instId=PI-USDT"))?.data?.[0];
      const last = num(t?.last);
      const open = num(t?.open24h);
      return {
        venue: "OKX",
        price: last,
        changePct: Number.isFinite(open) && open > 0 ? ((last - open) / open) * 100 : null,
        high24h: orNull(num(t?.high24h)),
        low24h: orNull(num(t?.low24h)),
        baseVol24h: orNull(num(t?.vol24h)),
        quoteVol24h: orNull(num(t?.volCcy24h)),
        trades24h: null,
        ok: Number.isFinite(last) && last > 0,
      };
    },
  },
  {
    venue: "MEXC",
    run: async () => {
      const t = await jf("https://api.mexc.com/api/v3/ticker/24hr?symbol=PIUSDT");
      const last = num(t?.lastPrice);
      return {
        venue: "MEXC",
        price: last,
        changePct: orNull(num(t?.priceChangePercent) * 100),
        high24h: orNull(num(t?.highPrice)),
        low24h: orNull(num(t?.lowPrice)),
        baseVol24h: orNull(num(t?.volume)),
        quoteVol24h: orNull(num(t?.quoteVolume)),
        trades24h: orNull(num(t?.count)),
        ok: Number.isFinite(last) && last > 0,
      };
    },
  },
  {
    venue: "Bitget",
    run: async () => {
      const t = (await jf("https://api.bitget.com/api/v2/spot/market/tickers?symbol=PIUSDT"))?.data?.[0];
      const last = num(t?.lastPr);
      return {
        venue: "Bitget",
        price: last,
        changePct: orNull(num(t?.change24h) * 100),
        high24h: orNull(num(t?.high24h)),
        low24h: orNull(num(t?.low24h)),
        baseVol24h: orNull(num(t?.baseVolume)),
        quoteVol24h: orNull(num(t?.quoteVolume)),
        trades24h: null,
        ok: Number.isFinite(last) && last > 0,
      };
    },
  },
  {
    venue: "Gate.io",
    run: async () => {
      const t = (await jf("https://api.gateio.ws/api/v4/spot/tickers?currency_pair=PI_USDT"))?.[0];
      const last = num(t?.last);
      return {
        venue: "Gate.io",
        price: last,
        changePct: orNull(num(t?.change_percentage)),
        high24h: orNull(num(t?.high_24h)),
        low24h: orNull(num(t?.low_24h)),
        baseVol24h: orNull(num(t?.base_volume)),
        quoteVol24h: orNull(num(t?.quote_volume)),
        trades24h: null,
        ok: Number.isFinite(last) && last > 0,
      };
    },
  },
  {
    venue: "KuCoin",
    run: async () => {
      const d = (await jf("https://api.kucoin.com/api/v1/market/stats?symbol=PI-USDT"))?.data;
      const last = num(d?.last);
      return {
        venue: "KuCoin",
        price: last,
        changePct: orNull(num(d?.changeRate) * 100),
        high24h: orNull(num(d?.high)),
        low24h: orNull(num(d?.low)),
        baseVol24h: orNull(num(d?.vol)),
        quoteVol24h: orNull(num(d?.volValue)),
        trades24h: null,
        ok: Number.isFinite(last) && last > 0,
      };
    },
  },
];

function median(values: number[]): number {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return NaN;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

async function klines(): Promise<Array<{ t: number; o: number; h: number; l: number; c: number; v: number }>> {
  try {
    const raw = await jf("https://api.mexc.com/api/v3/klines?symbol=PIUSDT&interval=1m&limit=500");
    if (Array.isArray(raw) && raw.length) {
      return raw.map((k: any[]) => ({
        t: Number(k[0]),
        o: num(k[1]),
        h: num(k[2]),
        l: num(k[3]),
        c: num(k[4]),
        v: num(k[5]),
      }));
    }
  } catch { /* fall through */ }
  try {
    const raw = (await jf("https://www.okx.com/api/v5/market/candles?instId=PI-USDT&bar=1m&limit=300"))?.data;
    if (Array.isArray(raw)) {
      return raw
        .map((k: string[]) => ({ t: Number(k[0]), o: num(k[1]), h: num(k[2]), l: num(k[3]), c: num(k[4]), v: num(k[5]) }))
        .reverse();
    }
  } catch { /* no candles */ }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const [venuesSettled, candles] = await Promise.all([
      Promise.all(
        SOURCES.map(async (s) => {
          try {
            const v = await s.run();
            if (!v.ok) throw new Error("no quote");
            return v;
          } catch (e) {
            return {
              venue: s.venue,
              price: NaN,
              changePct: null,
              high24h: null,
              low24h: null,
              baseVol24h: null,
              quoteVol24h: null,
              trades24h: null,
              ok: false,
              note: e instanceof Error ? e.message : "unavailable",
            } as Venue;
          }
        }),
      ),
      klines(),
    ]);

    const live = venuesSettled.filter((v) => v.ok);
    const prices = live.map((v) => v.price);
    const price = median(prices);
    const deviationBps = prices.length && price > 0
      ? Math.max(...prices.map((p) => Math.abs(p - price) / price)) * 10_000
      : 0;

    const sum = (key: keyof Venue) =>
      live.reduce((s, v) => s + (Number.isFinite(v[key] as number) ? (v[key] as number) : 0), 0);
    const avgOf = (key: keyof Venue) => {
      const xs = live.map((v) => v[key] as number).filter((x) => Number.isFinite(x));
      return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    };

    return new Response(
      JSON.stringify({
        ts: Date.now(),
        index: {
          price: Number.isFinite(price) ? price : null,
          sources: live.length,
          totalSources: venuesSettled.length,
          deviationBps,
          trusted: live.length >= 2 && deviationBps <= 300,
          changePct: avgOf("changePct"),
          high24h: live.length ? Math.max(...live.map((v) => v.high24h ?? -Infinity).filter(Number.isFinite)) : null,
          low24h: live.length ? Math.min(...live.map((v) => v.low24h ?? Infinity).filter(Number.isFinite)) : null,
          baseVol24h: sum("baseVol24h"),
          quoteVol24h: sum("quoteVol24h"),
          trades24h: sum("trades24h"),
        },
        venues: venuesSettled,
        candles,
      }),
      { headers: { ...corsHeaders, "content-type": "application/json", "cache-control": "public, max-age=3" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "index unavailable" }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
