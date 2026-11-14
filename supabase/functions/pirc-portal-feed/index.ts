import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const NETWORK_ID = "pi-testnet";
const PROJECT_ALIAS = "Testnet1";
const RPC_URL = "https://rpc.testnet.minepi.com";
const HORIZON_URL = "https://api.testnet.minepi.com";
const EXPECTED_PASSPHRASE = "Pi Testnet";
const MIN_PROTOCOL = 28;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function rpc(method: string): Promise<Record<string, unknown>> {
  const response = await fetch(RPC_URL, {
    method: "POST",
    redirect: "error",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params: {} }),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.error || !payload?.result || typeof payload.result !== "object") {
    throw new Error("pi_testnet_rpc_unavailable");
  }
  return payload.result as Record<string, unknown>;
}

async function networkSnapshot() {
  const results = await Promise.allSettled([
    rpc("getNetwork"),
    rpc("getHealth"),
    rpc("getLatestLedger"),
    fetch(HORIZON_URL + "/", { redirect: "error", signal: AbortSignal.timeout(10_000) }),
  ]);
  const network = results[0].status === "fulfilled" ? results[0].value : null;
  const health = results[1].status === "fulfilled" ? results[1].value : null;
  const latest = results[2].status === "fulfilled" ? results[2].value : null;
  const horizonResponse = results[3].status === "fulfilled" ? results[3].value : null;
  const horizon = horizonResponse ? await horizonResponse.json().catch(() => null) : null;

  const rpcPassphrase = network?.passphrase ?? network?.networkPassphrase ?? null;
  const protocol = Number(network?.protocolVersion);
  const horizonProtocol = Number(horizon?.core_supported_protocol_version);
  const healthy = ["healthy", "ok"].includes(String(health?.status || "").toLowerCase());
  const reachable = Boolean(network && health && latest && horizonResponse?.ok && horizon);
  const identityVerified = Boolean(
    reachable &&
    rpcPassphrase === EXPECTED_PASSPHRASE &&
    horizon?.network_passphrase === EXPECTED_PASSPHRASE &&
    Number.isSafeInteger(protocol) && protocol >= MIN_PROTOCOL &&
    Number.isSafeInteger(horizonProtocol) && horizonProtocol >= MIN_PROTOCOL &&
    healthy
  );

  return {
    networkId: NETWORK_ID,
    projectAlias: PROJECT_ALIAS,
    status: identityVerified ? "IDENTITY_VERIFIED" : reachable ? "REACHABLE_UNVERIFIED" : "UNAVAILABLE",
    identityVerified,
    passphraseVerified: rpcPassphrase === EXPECTED_PASSPHRASE && horizon?.network_passphrase === EXPECTED_PASSPHRASE,
    protocol: Number.isSafeInteger(protocol) ? protocol : null,
    horizonSupportedProtocol: Number.isSafeInteger(horizonProtocol) ? horizonProtocol : null,
    rpcHealth: health?.status ?? "unavailable",
    latestLedger: Number(latest?.sequence ?? latest?.ledger) || null,
    latestLedgerHash: typeof latest?.id === "string" ? latest.id : null,
    observedAt: new Date().toISOString(),
    source: "Pi Testnet Soroban RPC and Horizon root",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey || new URL(supabaseUrl).protocol !== "https:") {
    return json({ error: "server_configuration_missing" }, 503);
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [networkResult, feedResult] = await Promise.allSettled([
    networkSnapshot(),
    db.rpc("pirc_portal_feed"),
  ]);

  const feed = feedResult.status === "fulfilled" && !feedResult.value.error
    ? feedResult.value.data
    : null;
  if (!feed || feed.ok !== true || feed.mode !== "read_only") {
    return json({
      error: "portal_read_model_unavailable",
      network: networkResult.status === "fulfilled" ? networkResult.value : { status: "UNAVAILABLE", identityVerified: false },
      safety: { readOnly: true, mainnetWrites: false, signingEnabled: false },
    }, 502);
  }

  const cursors = Array.isArray(feed.cursors) ? feed.cursors : [];
  const events = Array.isArray(feed.events) ? feed.events : [];
  const contractIds = [...new Set(cursors.map((row: Record<string, unknown>) => String(row.contract_id || "")).filter(Boolean))];
  const cursorById = new Map(cursors.map((row: Record<string, unknown>) => [String(row.contract_id), row]));
  const contracts = contractIds.map((contractId) => ({
    contractId,
    registryStatus: "UNVERIFIED",
    deploymentStatus: "NOT_VERIFIED",
    evidenceStatus: "EVENT_CURSOR_PRESENT",
    cursor: cursorById.get(contractId) ?? null,
    codeHash: null,
    deploymentTransaction: null,
    initializedStateReadback: null,
  }));

  const network = networkResult.status === "fulfilled"
    ? networkResult.value
    : { networkId: NETWORK_ID, projectAlias: PROJECT_ALIAS, status: "UNAVAILABLE", identityVerified: false, latestLedger: null, observedAt: new Date().toISOString() };

  return json({
    schemaVersion: "pirc.canonical-portal-feed.v1",
    generatedAt: new Date().toISOString(),
    freshness: { policy: "no-store; upstream re-read per request", maxAgeSeconds: 0 },
    network,
    contracts,
    events: events.map((event: Record<string, unknown>) => ({
      networkId: event.network,
      contractId: event.contract_id,
      eventId: event.event_id,
      ledgerSequence: event.ledger_sequence,
      transactionHash: event.transaction_hash,
      eventType: event.event_type,
      processingStatus: event.processing_status,
      observedAt: event.observed_at,
      finality: "NOT_VERIFIED",
    })),
    domains: {
      contractRegistry: { status: contracts.length ? "UNVERIFIED_REFERENCES_ONLY" : "NOT_CONFIGURED", source: "Private event cursor read model" },
      events: { status: "AVAILABLE", count: events.length, total: Number(feed.total_event_count || 0), ingestion: feed.ingestion_status, evidence: "RAW_OBSERVATIONS_ONLY" },
      rawFactory: { status: "NOT_CONFIGURED", reason: "No approved build/deploy attestation service is connected." },
      subscriptions: { status: "NOT_CONFIGURED", reason: "No canonical subscription projection is connected." },
      assets: { status: "NOT_CONFIGURED", reason: "No verified asset metadata or balance read-back projection is connected." },
      liquidity: { status: "NOT_CONFIGURED", reason: "No deployed pool reserve read-back is connected." },
    },
    sourceStatus: {
      network: network.status,
      cursors: cursors.length ? "AVAILABLE" : "EMPTY",
      events: events.length ? "AVAILABLE" : "EMPTY",
    },
    safety: {
      readOnly: true,
      mainnetWrites: false,
      signingEnabled: false,
      tokenTransfersEnabled: false,
      mintingEnabled: false,
      rawEventsAreNotSettlementFinality: true,
    },
  });
});
