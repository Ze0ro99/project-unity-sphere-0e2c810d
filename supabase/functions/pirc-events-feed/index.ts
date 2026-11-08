// Authenticated, read-only paginated event feed for Lovable and other approved clients.
// Raw observations are never represented as finalized settlement or authoritative balances.
const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get("PIRC_EVENTS_ALLOWED_ORIGINS") || "")
    .split(",").map((value) => value.trim()).filter(Boolean),
);
const NETWORK_ID = "pi-testnet";
const MAX_LIMIT = 200;

function response(body: unknown, status = 200, origin?: string | null) {
  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "no-store",
    "vary": "Origin",
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-headers", "authorization, apikey, content-type");
    headers.set("access-control-allow-methods", "GET, OPTIONS");
    headers.set("access-control-max-age", "600");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function parseLimit(value: string | null) {
  const parsed = value === null ? 100 : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return Math.min(parsed, MAX_LIMIT);
}

async function authenticate(token: string) {
  const result = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: "Bearer " + token,
    },
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  if (!result.ok) return null;
  const user = await result.json().catch(() => null);
  return user && typeof user.id === "string" ? user : null;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return response({ error: "origin_not_allowed" }, 403);
  if (request.method === "OPTIONS") return response({ ok: true }, 200, origin);
  if (request.method !== "GET") return response({ error: "method_not_allowed" }, 405, origin);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY || ALLOWED_ORIGINS.size === 0) {
    return response({ error: "event_feed_not_configured" }, 503, origin);
  }

  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) return response({ error: "authentication_required" }, 401, origin);

  try {
    const user = await authenticate(match[1]);
    if (!user) return response({ error: "invalid_or_expired_session" }, 401, origin);

    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams.get("limit"));
    if (limit === null) return response({ error: "invalid_limit", max_limit: MAX_LIMIT }, 400, origin);

    const afterIdRaw = url.searchParams.get("after_id") || "0";
    if (!/^(0|[1-9][0-9]*)$/.test(afterIdRaw) || !Number.isSafeInteger(Number(afterIdRaw))) {
      return response({ error: "invalid_after_id" }, 400, origin);
    }

    const contractId = url.searchParams.get("contract_id");
    if (contractId && !/^C[A-Z2-7]{55}$/.test(contractId)) {
      return response({ error: "invalid_contract_id" }, 400, origin);
    }

    const query = new URLSearchParams({
      select: "id,network_id,contract_id,event_id,paging_token,ledger_sequence,transaction_hash,event_type,topics,raw_event,ingest_status,observed_at",
      network_id: "eq." + NETWORK_ID,
      id: "gt." + afterIdRaw,
      order: "id.asc",
      limit: String(limit + 1),
    });
    if (contractId) query.set("contract_id", "eq." + contractId);

    const dbResponse = await fetch(SUPABASE_URL + "/rest/v1/pirc_soroban_event_inbox?" + query.toString(), {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        authorization: "Bearer " + SERVICE_ROLE_KEY,
        accept: "application/json",
      },
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    if (!dbResponse.ok) throw new Error("event_store_query_failed:" + dbResponse.status);
    const rows = await dbResponse.json();
    if (!Array.isArray(rows)) throw new Error("event_store_invalid_response");

    const hasMore = rows.length > limit;
    const events = rows.slice(0, limit);
    const nextAfterId = events.length ? String(events[events.length - 1].id) : afterIdRaw;
    return response({
      ok: true,
      network_id: NETWORK_ID,
      network_alias: "Testnet1",
      canonical_network: "Pi Testnet",
      data_kind: "raw_chain_event_observations",
      settlement_finality: "NOT_ESTABLISHED",
      authenticated_user_id: user.id,
      events,
      page: {
        limit,
        returned: events.length,
        has_more: hasMore,
        next_after_id: hasMore ? nextAfterId : null,
      },
      warning: "Raw event observations only. Do not derive balances, liquidity, payment completion or settled accounting from this feed. Verify transaction status, decode the pinned ABI/XDR and reconcile canonical contract state before promoting an event to a settlement projection.",
    }, 200, origin);
  } catch (error) {
    console.error("pirc-events-feed", String(error).slice(0, 300));
    return response({ error: "event_feed_unavailable" }, 502, origin);
  }
});
