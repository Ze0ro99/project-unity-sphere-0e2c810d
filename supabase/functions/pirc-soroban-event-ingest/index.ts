// Bounded raw Soroban event ingestion. No XDR decoding, settlement projection,
// transaction signing, transaction submission, or Pi transfer is performed.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const NETWORK_ID = "pi-testnet";
const RPC_URL = (Deno.env.get("PI_TESTNET_SOROBAN_RPC_URL") || "https://rpc.testnet.minepi.com").replace(/\/$/, "");
const CONTRACT_ID = (Deno.env.get("PI_TESTNET_CONTRACT_ID") || "").trim();
const START_LEDGER = Number(Deno.env.get("PI_TESTNET_START_LEDGER") || "0");
const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CRON_SECRET = Deno.env.get("PIRC_EVENT_INGEST_SECRET") || "";
const PAGE_LIMIT = Math.min(Math.max(Number(Deno.env.get("PIRC_EVENT_PAGE_LIMIT") || "100"), 1), 500);
type RpcEvent = { type?: string; ledger?: number; id?: string; pagingToken?: string; contractId?: string; txHash?: string; topic?: string[]; [key: string]: unknown };
function json(body: unknown, status = 200) {
 return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
function validContractId(value: string) { return /^C[A-Z2-7]{55}$/.test(value); }
async function rpc(method: string, params: Record<string, unknown>) {
 const response = await fetch(RPC_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: AbortSignal.timeout(12000) });
 const payload = await response.json().catch(() => null);
 if (!response.ok || !payload || payload.error || !payload.result) throw new Error("soroban_rpc_" + response.status + ": " + JSON.stringify(payload?.error ?? "invalid response").slice(0, 300));
 return payload.result;
}
async function db(path: string, init: RequestInit = {}) {
 const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, { ...init, headers: { apikey: SERVICE_ROLE_KEY, authorization: "Bearer " + SERVICE_ROLE_KEY, "content-type": "application/json", ...(init.headers ?? {}) }, signal: AbortSignal.timeout(12000) });
 const body = await response.text();
 if (!response.ok) throw new Error("database_" + response.status + ": " + body.slice(0, 300));
 return body ? JSON.parse(body) : null;
}
Deno.serve(async (req) => {
 if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
 if (!CRON_SECRET || req.headers.get("x-pirc-ingest-secret") !== CRON_SECRET) return json({ error: "unauthorized" }, 401);
 if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !validContractId(CONTRACT_ID) || !Number.isSafeInteger(START_LEDGER) || START_LEDGER <= 0) return json({ error: "missing_or_invalid_server_configuration" }, 503);
 try {
  let rows = await db("pirc_soroban_event_cursors?network_id=eq." + NETWORK_ID + "&contract_id=eq." + CONTRACT_ID + "&select=*&limit=1");
  let cursor = rows?.[0];
  if (!cursor) {
   await db("pirc_soroban_event_cursors", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ network_id: NETWORK_ID, contract_id: CONTRACT_ID, start_ledger: START_LEDGER }) });
   rows = await db("pirc_soroban_event_cursors?network_id=eq." + NETWORK_ID + "&contract_id=eq." + CONTRACT_ID + "&select=*&limit=1");
   cursor = rows?.[0];
  }
  if (!cursor) throw new Error("cursor_initialization_failed");
  const pagination: Record<string, unknown> = { limit: PAGE_LIMIT };
  const params: Record<string, unknown> = { filters: [{ type: "contract", contractIds: [CONTRACT_ID] }], pagination };
  if (cursor.paging_cursor) pagination.cursor = cursor.paging_cursor;
  else params.startLedger = Number(cursor.start_ledger);
  const result = await rpc("getEvents", params);
  const events: RpcEvent[] = Array.isArray(result.events) ? result.events : [];
  const records = events.map((event) => {
   if (event.type !== "contract" || event.contractId !== CONTRACT_ID || typeof event.id !== "string" || !Number.isSafeInteger(event.ledger) || !Array.isArray(event.topic)) throw new Error("rpc_event_shape_or_contract_mismatch");
   return { network_id: NETWORK_ID, contract_id: CONTRACT_ID, event_id: event.id, paging_token: event.pagingToken ?? event.id, ledger_sequence: event.ledger, transaction_hash: event.txHash ?? null, event_type: event.type, topics: event.topic, raw_event: event, ingest_status: "observed" };
  });
  if (records.length) await db("pirc_soroban_event_inbox?on_conflict=network_id,contract_id,event_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(records) });
  const nextCursor = typeof result.cursor === "string" ? result.cursor : cursor.paging_cursor;
  const latestLedger = Number.isSafeInteger(result.latestLedger) ? result.latestLedger : null;
  await db("pirc_soroban_event_cursors?network_id=eq." + NETWORK_ID + "&contract_id=eq." + CONTRACT_ID, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ paging_cursor: nextCursor, latest_ledger: latestLedger, last_event_id: records.length ? records[records.length - 1].event_id : cursor.last_event_id, updated_at: new Date().toISOString() }) });
  return json({ ok: true, network_id: NETWORK_ID, contract_id: CONTRACT_ID, fetched: events.length, persisted_or_deduplicated: records.length, cursor_advanced: Boolean(nextCursor), latest_ledger: latestLedger, status: "raw_events_ingested_unverified", notice: "No XDR decoding, settlement projection, transaction signing, or contract-state read-back was performed." });
 } catch (error) {
  console.error("pirc-soroban-event-ingest", error);
  return json({ error: "ingestion_failed", detail: String(error).slice(0, 300) }, 502);
 }
});
