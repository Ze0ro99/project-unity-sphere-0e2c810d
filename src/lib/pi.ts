// Pi Network Horizon API client (mainnet).
// Falls back to testnet if mainnet is unreachable.

export const HORIZON_MAINNET = "https://api.mainnet.minepi.com";
export const HORIZON_TESTNET = "https://api.testnet.minepi.com";

export type Ledger = {
  id: string;
  paging_token: string;
  hash: string;
  prev_hash: string;
  sequence: number;
  successful_transaction_count: number;
  failed_transaction_count: number;
  operation_count: number;
  closed_at: string;
  total_coins: string;
  fee_pool: string;
  base_fee_in_stroops: number;
  base_reserve_in_stroops: number;
  max_tx_set_size: number;
  protocol_version: number;
};

export type Tx = {
  id: string;
  hash: string;
  ledger: number;
  created_at: string;
  source_account: string;
  fee_charged: string;
  operation_count: number;
  successful: boolean;
  memo?: string;
};

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

export async function fetchLatestLedgers(base = HORIZON_MAINNET, limit = 15): Promise<Ledger[]> {
  const data = await j<any>(`${base}/ledgers?order=desc&limit=${limit}`);
  return data?._embedded?.records ?? [];
}

export async function fetchLatestTx(base = HORIZON_MAINNET, limit = 20): Promise<Tx[]> {
  const data = await j<any>(`${base}/transactions?order=desc&limit=${limit}`);
  return data?._embedded?.records ?? [];
}

export async function fetchRoot(base = HORIZON_MAINNET) {
  return j<any>(`${base}/`);
}

export function shorten(s: string, head = 6, tail = 4) {
  if (!s) return "";
  return s.length <= head + tail + 3 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function relTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const s = Math.floor(d / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
