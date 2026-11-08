# Lovable Pi Testnet Event Synchronization

## Purpose

Expose the server-side raw Pi Testnet Soroban event inbox to Lovable and other approved authenticated clients without exposing the Supabase service-role key or granting direct table access.

This feed is read-only. It does not decode XDR, prove transaction finality, calculate balances, activate assets, or represent a settlement as complete.

## Four client integration gates

1. **Identity gate:** the client must send a valid Supabase user access token. The Edge Function validates the token against Supabase Auth. Anonymous requests and expired sessions are rejected.
2. **Network and provenance gate:** every response is explicitly tagged pi-testnet / Testnet1 / Pi Testnet and raw_chain_event_observations. The client must keep Testnet data separate from Mainnet and must not merge their cursors or balances.
3. **Pagination and replay gate:** use the opaque numeric next_after_id as after_id on the next request. The server orders by durable inbox identity, caps each page at 200, and returns has_more. Poll serially; do not run overlapping imports. Persist the last completed page cursor only after the client has stored the page idempotently.
4. **Settlement promotion gate:** events remain observations. Before showing a settled payment, balance, swap, reserve or liquidity update, a trusted backend must decode the pinned ABI/XDR, verify transaction success/finality, read canonical contract state, and reconcile the deterministic settlement digest. Until then, show Observed / Unverified, never Settled.

## Edge Function

Deploy pirc-events-feed with JWT verification enabled.

Required server-side Supabase function secrets:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- PIRC_EVENTS_ALLOWED_ORIGINS — comma-separated exact browser origins allowed to call the function, including the approved Lovable production origin and any explicitly approved preview origin.

Never put the service-role key in Lovable client configuration, Vite variables, browser storage, or source control. The function queries the service-role-only inbox after validating the caller's Supabase JWT.

## Request

GET /functions/v1/pirc-events-feed?limit=100&after_id=0
Authorization: Bearer <Supabase user access token>
apikey: <Supabase publishable/anon key>

Optional filter: contract_id=<verified C... contract ID>.

The response includes network_id, data_kind, events, and a page object with has_more and next_after_id. Maximum page size is 200. Continue until has_more is false, then poll again on a bounded interval with a single active poller.

## Lovable client behavior

- Authenticate the user through the approved Supabase Auth flow.
- Call the Edge Function, not the raw PostgREST event table.
- Store each event idempotently by network_id + contract_id + event_id.
- Use next_after_id for continuation and retry the same page after transient failures.
- Refresh on a timer only while the app is active; back off on 429/5xx and stop on 401 until re-authentication.
- Display the network badge and event status from the API. Keep raw event JSON available for diagnostics but do not infer accounting state from topics.
- Keep all event feeds read-only. Client code must not receive deployer keys, signer secrets, service-role credentials or direct transaction-submit permissions.

## Deployment and verification checklist

- [ ] Apply the existing event inbox migration.
- [ ] Deploy the ingestion function with the verified Pi Testnet endpoints and only contract IDs proven deployed by readback.
- [ ] Deploy this event-feed function and configure exact CORS origins.
- [ ] Verify anonymous request returns 401 and invalid origin returns 403.
- [ ] Verify valid authenticated request returns only Pi Testnet inbox records.
- [ ] Verify pagination has no duplicates or skipped IDs under retries.
- [ ] Verify RLS still denies direct anon/authenticated table reads.
- [ ] Confirm Lovable's served build ID and run the import against the deployed Edge Function.
- [ ] Keep settlement projections disabled until XDR, finality and canonical state reconciliation are implemented.

## Current boundary

The last recorded network probe found 0/7 registered layer contract instances. Therefore the feed can be deployed and tested with synthetic fixtures or approved test contract events, but it cannot truthfully report the seven layer assets as active until their contracts are deployed and read back on Pi Testnet.
