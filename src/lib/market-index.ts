/**
 * PiRC-214 — Live Market Index client
 * -----------------------------------------------------------------------------
 * Single source of truth for the real-time π spot index. Data is aggregated
 * server-side (edge function `market-index`) from OKX / MEXC / Bitget / Gate.io
 * / KuCoin, medianised with a deviation quorum, and streamed to every module
 * (exchange terminal, oracle, purchasing power) so no screen ever shows a
 * frozen or hardcoded price.
 */

import { supabase } from "@/integrations/supabase/client";
import { useSyncExternalStore } from "react";

export type IndexVenue = {
  venue: string;
  price: number | null;
  changePct: number | null;
  high24h: number | null;
  low24h: number | null;
  baseVol24h: number | null;
  quoteVol24h: number | null;
  trades24h: number | null;
  ok: boolean;
  note?: string;
};

export type IndexCandle = { t: number; o: number; h: number; l: number; c: number; v: number };

export type MarketIndex = {
  price: number | null;
  sources: number;
  totalSources: number;
  deviationBps: number;
  trusted: boolean;
  changePct: number | null;
  high24h: number | null;
  low24h: number | null;
  baseVol24h: number;
  quoteVol24h: number;
  trades24h: number;
};

export type IndexSnapshot = {
  index: MarketIndex | null;
  venues: IndexVenue[];
  candles: IndexCandle[];
  ts: number;
  loading: boolean;
  error: string | null;
};

const POLL_MS = 5_000;

let snapshot: IndexSnapshot = {
  index: null,
  venues: [],
  candles: [],
  ts: 0,
  loading: true,
  error: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let timer: ReturnType<typeof setInterval> | null = null;
let inFlight = false;

export async function refreshMarketIndex(): Promise<IndexSnapshot> {
  if (inFlight) return snapshot;
  inFlight = true;
  try {
    const { data, error } = await supabase.functions.invoke("market-index");
    if (error) throw error;
    const idx = data?.index;
    snapshot = {
      index: idx
        ? {
            price: typeof idx.price === "number" ? idx.price : null,
            sources: idx.sources ?? 0,
            totalSources: idx.totalSources ?? 0,
            deviationBps: idx.deviationBps ?? 0,
            trusted: !!idx.trusted,
            changePct: typeof idx.changePct === "number" ? idx.changePct : null,
            high24h: typeof idx.high24h === "number" ? idx.high24h : null,
            low24h: typeof idx.low24h === "number" ? idx.low24h : null,
            baseVol24h: idx.baseVol24h ?? 0,
            quoteVol24h: idx.quoteVol24h ?? 0,
            trades24h: idx.trades24h ?? 0,
          }
        : null,
      venues: Array.isArray(data?.venues) ? data.venues : [],
      candles: Array.isArray(data?.candles) ? data.candles : [],
      ts: data?.ts ?? Date.now(),
      loading: false,
      error: null,
    };
  } catch (e) {
    snapshot = { ...snapshot, loading: false, error: e instanceof Error ? e.message : "index unavailable" };
  } finally {
    inFlight = false;
    emit();
  }
  return snapshot;
}

function start() {
  if (timer) return;
  refreshMarketIndex();
  timer = setInterval(refreshMarketIndex, POLL_MS);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

export const marketIndexStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    start();
    return () => {
      listeners.delete(cb);
      if (listeners.size === 0) stop();
    };
  },
  getSnapshot: () => snapshot,
};

export function useMarketIndex(): IndexSnapshot {
  return useSyncExternalStore(marketIndexStore.subscribe, marketIndexStore.getSnapshot, marketIndexStore.getSnapshot);
}

/** Latest medianised π/USD spot, or NaN when no venue is reachable. */
export function piSpot(): number {
  const p = snapshot.index?.price;
  return typeof p === "number" && p > 0 ? p : NaN;
}

/** Subscribe to index updates outside React (used by the exchange engine). */
export function onIndex(cb: (s: IndexSnapshot) => void): () => void {
  const fn = () => cb(snapshot);
  listeners.add(fn);
  start();
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) stop();
  };
}
