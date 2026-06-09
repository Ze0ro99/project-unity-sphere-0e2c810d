/**
 * Pi Network Horizon (Stellar) live client.
 * Pi runs Stellar Core; Horizon exposes the same REST surface as stellar.org.
 *  - Mainnet:  https://api.mainnet.minepi.com
 *  - Testnet:  https://api.testnet.minepi.com
 *  - Testnet2: https://api.testnet2.minepi.com
 */
import { useQuery } from "@tanstack/react-query";

export type PiNetwork = "mainnet" | "testnet" | "testnet2";

export const HORIZON: Record<PiNetwork, string> = {
  mainnet: "https://api.mainnet.minepi.com",
  testnet: "https://api.testnet.minepi.com",
  testnet2: "https://api.testnet2.minepi.com",
};

export const NETWORK_LABEL: Record<PiNetwork, string> = {
  mainnet: "Pi Mainnet",
  testnet: "Pi Testnet",
  testnet2: "Pi Testnet 2",
};

/** Operator receiver wallet (memo-tagged deposits land here). */
export const RECEIVER_ADDRESS =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_PI_RECEIVER_ADDRESS) ||
  "GD6HJ6WAXF4I7EW7M3SHOKRALOOPSSYSNVLCJ66PBFZRBZKYMPQFNMP4";

async function horizonGet<T>(network: PiNetwork, path: string): Promise<T> {
  const res = await fetch(`${HORIZON[network]}${path}`, {
    headers: { Accept: "application/hal+json,application/json" },
  });
  if (!res.ok) throw new Error(`Horizon ${network} ${path} → ${res.status}`);
  return (await res.json()) as T;
}

export interface HorizonLedger {
  sequence: number;
  hash: string;
  closed_at: string;
  successful_transaction_count: number;
  failed_transaction_count: number;
  operation_count: number;
  total_coins: string;
  base_fee_in_stroops: number;
}

export interface HorizonTransaction {
  id: string;
  hash: string;
  ledger: number;
  created_at: string;
  source_account: string;
  fee_charged: string;
  operation_count: number;
  memo_type?: string;
  memo?: string;
  successful: boolean;
}

export interface HorizonAccount {
  id: string;
  account_id: string;
  sequence: string;
  balances: Array<{ asset_type: string; balance: string }>;
}

export interface HorizonPayment {
  id: string;
  type: string;
  transaction_hash: string;
  transaction_successful?: boolean;
  created_at: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
}

/* -------- hooks -------- */

export function useLedgers(network: PiNetwork, limit = 8) {
  return useQuery({
    queryKey: ["horizon", network, "ledgers", limit],
    queryFn: () =>
      horizonGet<{ _embedded: { records: HorizonLedger[] } }>(
        network,
        `/ledgers?order=desc&limit=${limit}`,
      ).then((d) => d._embedded.records),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function useRecentTransactions(network: PiNetwork, limit = 10) {
  return useQuery({
    queryKey: ["horizon", network, "tx", limit],
    queryFn: () =>
      horizonGet<{ _embedded: { records: HorizonTransaction[] } }>(
        network,
        `/transactions?order=desc&limit=${limit}`,
      ).then((d) => d._embedded.records),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function useAccount(address: string | null | undefined, network: PiNetwork) {
  return useQuery({
    queryKey: ["horizon", network, "account", address],
    enabled: !!address,
    queryFn: () => horizonGet<HorizonAccount>(network, `/accounts/${address}`),
    refetchInterval: 5_000,
    staleTime: 2_000,
    retry: 0,
  });
}

export function useNetworkStatus(network: PiNetwork) {
  return useQuery({
    queryKey: ["horizon", network, "root"],
    queryFn: () => horizonGet<Record<string, unknown>>(network, "/"),
    refetchInterval: 30_000,
  });
}

/** Pi/USD spot via CoinGecko — also returns OHLC for candlestick. */
export interface CGTicker {
  pi_network?: { usd?: number; usd_24h_change?: number; usd_24h_vol?: number; usd_market_cap?: number };
}

export function usePiPrice() {
  return useQuery({
    queryKey: ["coingecko", "pi-network", "simple"],
    queryFn: async () => {
      const r = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true",
      );
      if (!r.ok) throw new Error("coingecko failed");
      const data = (await r.json()) as CGTicker;
      return data.pi_network ?? null;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export interface OhlcCandle {
  time: number; // seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export type CandleRange = "1" | "7" | "30" | "90" | "365";

export function usePiOhlc(days: CandleRange) {
  return useQuery({
    queryKey: ["coingecko", "pi-network", "ohlc", days],
    queryFn: async (): Promise<OhlcCandle[]> => {
      const r = await fetch(
        `https://api.coingecko.com/api/v3/coins/pi-network/ohlc?vs_currency=usd&days=${days}`,
      );
      if (!r.ok) throw new Error("ohlc failed");
      const raw = (await r.json()) as Array<[number, number, number, number, number]>;
      return raw.map(([t, o, h, l, c]) => ({ time: Math.floor(t / 1000), open: o, high: h, low: l, close: c }));
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function usePiExchanges() {
  return useQuery({
    queryKey: ["coingecko", "pi-network", "tickers"],
    queryFn: async () => {
      const r = await fetch("https://api.coingecko.com/api/v3/coins/pi-network/tickers");
      if (!r.ok) throw new Error("tickers failed");
      const data = (await r.json()) as {
        tickers: Array<{
          market: { name: string; identifier: string };
          base: string;
          target: string;
          last: number;
          volume: number;
          converted_last: { usd: number };
          trust_score?: string;
          trade_url?: string;
        }>;
      };
      return data.tickers ?? [];
    },
    refetchInterval: 60_000,
  });
}

export function explorerTx(network: PiNetwork, hash: string) {
  const base = network === "mainnet" ? "https://blockexplorer.minepi.com" : "https://blockexplorer.minepi.com";
  return `${base}/${network}/transactions/${hash}`;
}
export function explorerAccount(network: PiNetwork, addr: string) {
  return `https://blockexplorer.minepi.com/${network}/accounts/${addr}`;
}
