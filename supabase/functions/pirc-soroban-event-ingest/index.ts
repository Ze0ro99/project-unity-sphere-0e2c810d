// Bounded, identity-gated raw Soroban event ingestion for Pi Testnet.
// This worker stores raw events only. It does not decode XDR, project settlement,
// sign or submit transactions, mint tokens, transfer assets, or activate PiDEX.
const NETWORK_ID = "pi-testnet"; // Canonical network identity; "Testnet1" is a project alias.
const HORIZON_URL = (Deno.env.get("PI_TESTNET_HORIZON_URL") || "https://api.testnet.minepi.com").replace(/\/$/, "");
const RPC_URL = (Deno.env.get("PI_TESTNET_SOROBAN_RPC_URL") || "https://rpc.testnet.minepi.com").replace(/\/$/, "");
const EXPECTED_PASSPHRASE = (Deno.env.get("PI_TESTNET_NETWORK_PASSPHRASE") || Deno.env.get("PI_NETWORK_PASSPHRASE") || "").trim();
const EXPECTED_PROTOCOL = Number(Deno.env.get("PI_TESTNET_PROTOCOL_EXPECTED") || Deno.env.get("PI_PROTOCOL_EXPECTED") || "28");
const CONTRACT_IDS = [
  ...new Set(
    (Deno.env.get("PI_TESTNET_CONTRACT_IDS") || Deno.env.get("PI_TESTNET_CONTRACT_ID") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ),
];
const START_LEDGER = Number(Deno.env.get("PI_TESTNET_START_LEDGER") || "0");
const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CRON_SECRET = Deno.env.get("PIRC_EVENT_INGEST_SECRET") || "";
const PAGE_LIMIT = Math.min(Math.max(Number(Deno.env.get("PIRC_EVENT_PAGE_LIMIT") || "100"), 1), 500);
const ALLOWED_HORIZON_HOST = "api.testnet.minepi.com";
const ALLOWED_RPC_HOST = "rpc.testnet.minepi.com";

type RpcEvent = {
  type?: string;
  ledger?: number;
  id?: string;
  pagingToken?: string;
  contractId?: string;
  txHash?: string;
  topic?: string[];
  [key: string]: unknown;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function validContractId(value: string) {
  return /^C[A-Z2-7]{55}$/.test(value);
}

function approvedEndpoint(value: string, expectedHost: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:"
      && parsed.hostname.toLowerCase() === expectedHost
      && !parsed.username
      && !parsed.password
      && !parsed.search
      && !parsed.hash;
  } catch {
    return false;
  }
}

async function rpc(method: string, params: Record<string, unknown> = {}) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    redirect: "error",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
    signal: AbortSignal.timeout(12000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.error || !payload.result || typeof payload.result !== "object") {
    throw new Error("soroban_rpc_" + response.status + ": " + JSON.stringify(payload?.error ?? "invalid response").slice(0, 300));
  }
  return payload.result as Record<string, unknown>;
}

async function db(path: string, init: RequestInit = {}) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    ...init,
    redirect: "error",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: "Bearer " + SERVICE_ROLE_KEY,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(12000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error("database_" + response.status + ": " + body.slice(0, 300));
  return body ? JSON.parse(body) : null;
}

async function verifyNetworkIdentity() {
  if (
    !approvedEndpoint(HORIZON_URL, ALLOWED_HORIZON_HOST)
    || !approvedEndpoint(RPC_URL, ALLOWED_RPC_HOST)
    || !EXPECTED_PASSPHRASE
    || !Number.isSafeInteger(EXPECTED_PROTOCOL)
    || EXPECTED_PROTOCOL <= 0
  ) {
    throw new Error("testnet_network_profile_missing_or_not_allowlisted");
  }

  const horizonResponse = await fetch(HORIZON_URL + "/", {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(12000),
  });
  const horizon = await horizonResponse.json().catch(() => null);
  if (!horizonResponse.ok || !horizon || typeof horizon !== "object") {
    throw new Error("testnet_horizon_identity_unavailable");
  }

  const [network, health, latest] = await Promise.all([
    rpc("getNetwork"),
    rpc("getHealth"),
    rpc("getLatestLedger"),
  ]);

  const horizonPassphrase = horizon.network_passphrase;
  const rpcPassphrase = network.passphrase ?? network.networkPassphrase;
  const rpcProtocol = Number(network.protocolVersion);
  const horizonSupportedProtocol = Number(horizon.core_supported_protocol_version);
  const healthStatus = String(health.status || "").toLowerCase();
  const latestSequence = Number(latest.sequence ?? latest.ledger);
  const oldestLedger = Number(health.oldestLedger);
  const latestAvailableLedger = Number(health.latestLedger);

  const passphraseMatches = horizonPassphrase === EXPECTED_PASSPHRASE
    && rpcPassphrase === EXPECTED_PASSPHRASE;
  const protocolMatches = rpcProtocol === EXPECTED_PROTOCOL
    && Number.isSafeInteger(horizonSupportedProtocol)
    && horizonSupportedProtocol >= EXPECTED_PROTOCOL;
  const healthy = healthStatus === "healthy" || healthStatus === "ok";
  const ledgerBoundsValid = Number.isSafeInteger(oldestLedger)
    && Number.isSafeInteger(latestAvailableLedger)
    && latestAvailableLedger >= oldestLedger
    && Number.isSafeInteger(latestSequence)
    && latestSequence > 0;

  if (!passphraseMatches || !protocolMatches || !healthy || !ledgerBoundsValid) {
    throw new Error("testnet_network_identity_or_protocol_mismatch");
  }

  return {
    network_id: NETWORK_ID,
    alias: "Testnet1",
    canonical_network: "Pi Testnet",
    passphrase_verified: true,
    protocol: rpcProtocol,
    horizon_supported_protocol: horizonSupportedProtocol,
    oldest_ledger: oldestLedger,
    latest_ledger: Math.max(latestSequence, latestAvailableLedger),
  };
}

async function ingestContract(contractId: string, oldestLedger: number) {
  let rows = await db(
    "pirc_soroban_event_cursors?network_id=eq." + NETWORK_ID
      + "&contract_id=eq." + contractId + "&select=*&limit=1",
  );
  let cursor = rows?.[0];

  if (!cursor) {
    await db("pirc_soroban_event_cursors", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        network_id: NETWORK_ID,
        contract_id: contractId,
        start_ledger: START_LEDGER,
      }),
    });
    rows = await db(
      "pirc_soroban_event_cursors?network_id=eq." + NETWORK_ID
        + "&contract_id=eq." + contractId + "&select=*&limit=1",
    );
    cursor = rows?.[0];
  }

  if (!cursor) throw new Error("cursor_initialization_failed:" + contractId);
  if (!cursor.paging_cursor && Number(cursor.start_ledger) < oldestLedger) {
    return {
      contract_id: contractId,
      status: "blocked_start_ledger_outside_rpc_retention",
      configured_start_ledger: Number(cursor.start_ledger),
      oldest_available_ledger: oldestLedger,
      fetched: 0,
      cursor_advanced: false,
    };
  }

  const pagination: Record<string, unknown> = { limit: PAGE_LIMIT };
  const params: Record<string, unknown> = {
    filters: [{ type: "contract", contractIds: [contractId] }],
    pagination,
  };
  if (cursor.paging_cursor) pagination.cursor = cursor.paging_cursor;
  else params.startLedger = Number(cursor.start_ledger);

  const result = await rpc("getEvents", params);
  const events: RpcEvent[] = Array.isArray(result.events) ? result.events as RpcEvent[] : [];
  const records = events.map((event) => {
    if (
      event.type !== "contract"
      || event.contractId !== contractId
      || typeof event.id !== "string"
      || !Number.isSafeInteger(event.ledger)
      || Number(event.ledger) <= 0
      || !Array.isArray(event.topic)
      || !event.topic.every((topic) => typeof topic === "string")
    ) {
      throw new Error("rpc_event_shape_or_contract_mismatch:" + contractId);
    }
    return {
      network_id: NETWORK_ID,
      contract_id: contractId,
      event_id: event.id,
      paging_token: typeof event.pagingToken === "string" ? event.pagingToken : event.id,
      ledger_sequence: event.ledger,
      transaction_hash: typeof event.txHash === "string" ? event.txHash : null,
      event_type: event.type,
      topics: event.topic,
      raw_event: event,
      ingest_status: "observed",
    };
  });

  // Idempotent event persistence happens before cursor advancement. A crash
  // between these requests safely replays rows through the database unique key.
  if (records.length) {
    await db(
      "pirc_soroban_event_inbox?on_conflict=network_id,contract_id,event_id",
      {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify(records),
      },
    );
  }

  const nextCursor = typeof result.cursor === "string" ? result.cursor : cursor.paging_cursor;
  const latestLedger = Number.isSafeInteger(result.latestLedger) ? result.latestLedger : null;
  await db(
    "pirc_soroban_event_cursors?network_id=eq." + NETWORK_ID + "&contract_id=eq." + contractId,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        paging_cursor: nextCursor,
        latest_ledger: latestLedger,
        last_event_id: records.length ? records[records.length - 1].event_id : cursor.last_event_id,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  return {
    contract_id: contractId,
    status: "raw_events_ingested_unverified",
    fetched: events.length,
    persisted_or_deduplicated: records.length,
    cursor_advanced: Boolean(nextCursor),
    latest_ledger: latestLedger,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!CRON_SECRET || req.headers.get("x-pirc-ingest-secret") !== CRON_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  if (
    !SUPABASE_URL
    || !SERVICE_ROLE_KEY
    || CONTRACT_IDS.length === 0
    || CONTRACT_IDS.length > 32
    || !CONTRACT_IDS.every(validContractId)
    || !Number.isSafeInteger(START_LEDGER)
    || START_LEDGER <= 0
  ) {
    return json({ error: "missing_or_invalid_server_configuration" }, 503);
  }

  try {
    // Verify both Pi Testnet endpoints, passphrases, protocol and RPC health
    // before reading any event or creating/updating a cursor.
    const identity = await verifyNetworkIdentity();
    const results = [];
    for (const contractId of CONTRACT_IDS) {
      results.push(await ingestContract(contractId, identity.oldest_ledger));
    }
    const blocked = results.some((result) => result.status === "blocked_start_ledger_outside_rpc_retention");
    return json({
      ok: !blocked,
      network: identity,
      contracts_checked: results.length,
      results,
      status: blocked ? "reconciliation_required" : "raw_events_ingested_unverified",
      notice: "Raw event observations only. No XDR decoding, settlement projection, finality proof, contract-state reconciliation, transaction signing or asset transfer was performed.",
    }, blocked ? 409 : 200);
  } catch (error) {
    console.error("pirc-soroban-event-ingest", error);
    return json({ error: "ingestion_failed", detail: String(error).slice(0, 300) }, 502);
  }
});
