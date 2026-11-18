export type OusdPublicStatus = {
  network_id: string;
  status: string;
  operational_state: string;
  controller_contract_id: string | null;
  token_contract_id: string | null;
  controller_code_hash: string | null;
  token_code_hash: string | null;
  protocol_version: number | null;
  deployed_ledger: number | null;
  latest_readback_ledger: number | null;
  token_supply_atomic: string | null;
  attestor_verified_reserve_usd_micros: string;
  backing_reserve_usd_micros: string;
  outstanding_usd_micros: string;
  redemption_pending_usd_micros: string;
  paid_and_burned_usd_micros: string;
  latest_verified_reserve_ledger: number | null;
  coverage_ratio: string | null;
  last_readback_at: string | null;
  updated_at: string;
};

type OusdStatusResponse = {
  ok: boolean;
  network: string;
  source: string;
  mode: "read_only";
  data: OusdPublicStatus;
  generated_at: string;
};

const DEFAULT_STATUS_URL =
  "https://naeuosudklqsgeghafkw.supabase.co/functions/v1/ousd-public-status";

export async function fetchOusdPublicStatus(): Promise<OusdStatusResponse> {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const url = env?.VITE_OUSD_STATUS_URL || DEFAULT_STATUS_URL;
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`OUSD status endpoint unavailable (HTTP ${response.status}). No reserve values were inferred.`);
  }
  const payload = await response.json() as OusdStatusResponse;
  if (!payload?.ok || payload.network !== "pi-testnet" || payload.mode !== "read_only" || !payload.data) {
    throw new Error("OUSD status response failed network or schema validation.");
  }
  return payload;
}

export function formatUsdMicros(value: string | null | undefined): string {
  if (value == null) return "—";
  try {
    const amount = BigInt(value);
    const whole = amount / 1_000_000n;
    const fraction = (amount % 1_000_000n).toString().padStart(6, "0").slice(0, 2);
    return `$${whole.toLocaleString("en-US")}.${fraction}`;
  } catch {
    return "—";
  }
}

export function formatOusdAtomic(value: string | null | undefined): string {
  if (value == null) return "NOT READ BACK";
  try {
    const amount = BigInt(value);
    const whole = amount / 10_000_000n;
    const fraction = (amount % 10_000_000n).toString().padStart(7, "0");
    return `${whole.toLocaleString("en-US")}.${fraction} OUSD`;
  } catch {
    return "—";
  }
}
