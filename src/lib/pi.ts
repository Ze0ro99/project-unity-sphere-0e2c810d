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

export const HORIZON_TESTNET2 = "https://api.testnet2.minepi.com";

export type AccountInfo = {
  id: string;
  sequence: string;
  subentry_count: number;
  balances: { balance: string; asset_type: string; asset_code?: string; asset_issuer?: string }[];
  flags?: Record<string, boolean>;
  last_modified_ledger?: number;
};

export async function fetchAccount(id: string, base = HORIZON_MAINNET) {
  return j<AccountInfo>(`${base}/accounts/${id}`);
}

/** Assets issued by an account — used for live PiRC-207 layer supply/holder metrics. */
export async function fetchIssuedAssets(issuer: string, base = HORIZON_MAINNET) {
  const data = await j<any>(`${base}/assets?asset_issuer=${issuer}&limit=200`);
  return (data?._embedded?.records ?? []) as {
    asset_code: string;
    asset_issuer: string;
    amount: string;
    num_accounts: number;
    flags?: Record<string, boolean>;
  }[];
}

/** Mean seconds between ledger closes — network throughput indicator. */
export function meanCloseTime(ledgers: Ledger[]) {
  if (!ledgers || ledgers.length < 2) return null;
  const ts = ledgers.map((l) => new Date(l.closed_at).getTime()).sort((a, b) => b - a);
  const diffs: number[] = [];
  for (let i = 0; i < ts.length - 1; i++) diffs.push((ts[i] - ts[i + 1]) / 1000);
  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

export function tps(ledgers: Ledger[]) {
  const mct = meanCloseTime(ledgers);
  if (!mct || !ledgers.length) return null;
  const ops = ledgers.reduce((a, l) => a + (l.operation_count ?? 0), 0) / ledgers.length;
  return ops / mct;
}
