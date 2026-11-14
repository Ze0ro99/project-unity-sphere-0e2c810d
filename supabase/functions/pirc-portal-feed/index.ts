// Canonical read-only data gateway shared by every Unity Sphere portal.
// All views consume this response; unavailable domains stay explicitly unavailable.
const NETWORK_ID = "pi-testnet";
const PROJECT_ALIAS = "Testnet1";
const RPC_URL = (Deno.env.get("PI_TESTNET_SOROBAN_RPC_URL") || "https://rpc.testnet.minepi.com").replace(/\/$/, "");
const HORIZON_URL = (Deno.env.get("PI_TESTNET_HORIZON_URL") || "https://api.testnet.minepi.com").replace(/\/$/, "");
const EXPECTED_PASSPHRASE = (Deno.env.get("PI_TESTNET_NETWORK_PASSPHRASE") || "Pi Testnet").trim();
const EXPECTED_PROTOCOL = Number(Deno.env.get("PI_TESTNET_PROTOCOL_EXPECTED") || "28");
const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CONTRACT_IDS = [...new Set((Deno.env.get("PI_TESTNET_CONTRACT_IDS") || Deno.env.get("PI_TESTNET_CONTRACT_ID") || "")
  .split(",").map((value) => value.trim()).filter((value) => /^C[A-Z2-7]{55}$/.test(value)))];
const EVENT_LIMIT = Math.min(Math.max(Number(Deno.env.get("PIRC_PORTAL_EVENT_LIMIT") || "50"), 1), 100);

function response(body: unknown, status = 200, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
      "vary": "Origin",
      "x-content-type-options": "nosniff",
    },
  });
}

async function rpc(method: string) {
  const result = await fetch(RPC_URL, {
    method: "POST", redirect: "error",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params: {} }),
    signal: AbortSignal.timeout(10000),
  });
  const payload = await result.json().catch(() => null);
  if (!result.ok || payload?.error || !payload?.result || typeof payload.result !== "object") {
    throw new Error("pi_testnet_rpc_unavailable");
  }
  return payload.result as Record<string, unknown>;
}

async function readDatabase(path: string) {
  const result = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    redirect: "error",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: "Bearer " + SERVICE_ROLE_KEY,
      accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!result.ok) throw new Error("portal_read_model_unavailable");
  return await result.json();
}

async function networkSnapshot() {
  try {
    const [network, health, latest, horizonResponse] = await Promise.all([
      rpc("getNetwork"), rpc("getHealth"), rpc("getLatestLedger"),
      fetch(HORIZON_URL + "/", { redirect: "error", signal: AbortSignal.timeout(10000) }),
    ]);
    const horizon = await horizonResponse.json().catch(() => null);
    const rpcPassphrase = network.passphrase ?? network.networkPassphrase;
    const protocol = Number(network.protocolVersion);
    const healthy = ["healthy", "ok"].includes(String(health.status || "").toLowerCase());
    const identityVerified = horizonResponse.ok
      && horizon?.network_passphrase === EXPECTED_PASSPHRASE
      && rpcPassphrase === EXPECTED_PASSPHRASE
      && protocol === EXPECTED_PROTOCOL
      && healthy;
    return {
      networkId: NETWORK_ID,
      projectAlias: PROJECT_ALIAS,
      legacyAlias: "pi-testnet1",
      status: identityVerified ? "IDENTITY_VERIFIED" : "REACHABLE_UNVERIFIED",
      identityVerified,
      passphraseVerified: horizon?.network_passphrase === EXPECTED_PASSPHRASE && rpcPassphrase === EXPECTED_PASSPHRASE,
      protocol,
      expectedProtocol: EXPECTED_PROTOCOL,
      rpcHealth: String(health.status || "unknown"),
      latestLedger: Number(latest.sequence ?? latest.ledger) || null,
      oldestAvailableLedger: Number(health.oldestLedger) || null,
      observedAt: new Date().toISOString(),
      source: "Pi Testnet Soroban RPC + Horizon root",
    };
  } catch {
    return {
      networkId: NETWORK_ID, projectAlias: PROJECT_ALIAS, legacyAlias: "pi-testnet1",
      status: "UNAVAILABLE", identityVerified: false, latestLedger: null,
      observedAt: new Date().toISOString(), source: "Pi Testnet Soroban RPC + Horizon root",
    };
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "*";
  if (req.method === "OPTIONS") return response({}, 204, origin);
  if (req.method !== "GET") return response({ error: "method_not_allowed" }, 405, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !/^https:\/\/[^/]+$/.test(SUPABASE_URL)) {
    return response({ error: "portal_feed_server_configuration_missing" }, 503, origin);
  }

  const [network, cursorsResult, eventsResult] = await Promise.allSettled([
    networkSnapshot(),
    readDatabase("pirc_soroban_event_cursors?select=network_id,contract_id,start_ledger,paging_cursor,latest_ledger,last_event_id,updated_at&network_id=eq." + NETWORK_ID + "&order=updated_at.desc&limit=32"),
    readDatabase("pirc_soroban_event_inbox?select=network_id,contract_id,event_id,ledger_sequence,transaction_hash,event_type,topics,ingest_status,observed_at&network_id=eq." + NETWORK_ID + "&order=ledger_sequence.desc&limit=" + EVENT_LIMIT),
  ]);
  const cursors = cursorsResult.status === "fulfilled" && Array.isArray(cursorsResult.value) ? cursorsResult.value : [];
  const events = eventsResult.status === "fulfilled" && Array.isArray(eventsResult.value) ? eventsResult.value : [];
  const ids = new Set([...CONTRACT_IDS, ...cursors.map((row: Record<string, unknown>) => String(row.contract_id || ""))].filter(Boolean));
  const cursorById = new Map(cursors.map((row: Record<string, unknown>) => [String(row.contract_id), row]));
  const contracts = [...ids].map((contractId) => ({
    contractId,
    registryStatus: "UNVERIFIED",
    deploymentStatus: "NOT_VERIFIED",
    evidenceStatus: cursorById.has(contractId) ? "EVENT_CURSOR_PRESENT" : "ALLOWLISTED_ONLY",
    cursor: cursorById.get(contractId) || null,
    codeHash: null,
    deploymentTransaction: null,
    initializedStateReadback: null,
  }));
  const networkData = network.status === "fulfilled" ? network.value : {
    networkId: NETWORK_ID, projectAlias: PROJECT_ALIAS, status: "UNAVAILABLE", identityVerified: false, latestLedger: null,
  };
  const sourceState = (ok: boolean) => ok ? "AVAILABLE" : "UNAVAILABLE";
  const generatedAt = new Date().toISOString();
  return response({
    schemaVersion: "pirc.canonical-portal-feed.v1",
    generatedAt,
    freshness: { policy: "no-store; every request re-reads upstream sources", maxAgeSeconds: 0 },
    network: networkData,
    contracts,
    events: events.map((event: Record<string, unknown>) => ({
      networkId: event.network_id, contractId: event.contract_id, eventId: event.event_id,
      ledgerSequence: event.ledger_sequence, transactionHash: event.transaction_hash,
      eventType: event.event_type, topics: event.topics, ingestStatus: event.ingest_status,
      observedAt: event.observed_at, finality: "NOT_VERIFIED",
    })),
    domains: {
      contractRegistry: { status: contracts.length ? "UNVERIFIED_REFERENCES_ONLY" : "NOT_CONFIGURED", source: "Pi Testnet allowlist and durable event cursors" },
      events: { status: sourceState(eventsResult.status === "fulfilled"), count: events.length, evidence: "RAW_OBSERVATIONS_ONLY" },
      rawFactory: { status: "NOT_CONFIGURED", reason: "No approved build/deploy attestation service is connected." },
      subscriptions: { status: "NOT_CONFIGURED", reason: "No canonical subscription state projection is connected." },
      assets: { status: "NOT_CONFIGURED", reason: "No verified asset metadata and balance readback projection is connected." },
      liquidity: { status: "NOT_CONFIGURED", reason: "No deployed pool reserve readback is connected." },
    },
    sourceStatus: {
      network: network.status === "fulfilled" ? networkData.status : "UNAVAILABLE",
      cursors: sourceState(cursorsResult.status === "fulfilled"),
      events: sourceState(eventsResult.status === "fulfilled"),
    },
    portalContract: {
      sharedFeed: true,
      rule: "All portals must render this same canonical response; do not generate local replacement/mock values.",
      staleHandling: "Display source timestamps and mark stale or unavailable data; never silently substitute simulations.",
    },
    safety: {
      readOnly: true, mainnetWrites: false, signingEnabled: false,
      tokenTransfersEnabled: false, mintingEnabled: false,
      rawEventsAreNotSettlementFinality: true,
    },
  }, 200, origin);
});
