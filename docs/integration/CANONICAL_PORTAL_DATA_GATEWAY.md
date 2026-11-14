# Canonical Portal Data Gateway

**Status:** implementation source added; deployment and provider configuration are not yet verified.

## Single source of truth

All Unity Sphere portals and external clients (including the legacy Lovable frontend) must read the same endpoint:

`POST/GET {SUPABASE_URL}/functions/v1/pirc-portal-feed`

Use `GET` with the project's public anon key in the `apikey` header and the normal Supabase authorization header. The service-role key is used only inside the Edge Function and must never be shipped to a browser, Lovable project, repository, or log.

The response is versioned as `pirc.canonical-portal-feed.v1`. It contains the Pi Testnet network probe, contract references/cursors, sanitized raw event observations, per-domain availability, freshness, and safety flags. It deliberately does not expose raw event payloads.

## Portal integration rule

Every portal (Pioneer, Merchant, Developer Studio, PiDEX, Treasury/Governance, Asset/RAW, Subscription and Monitoring) must use this same feed adapter and render the same underlying source records. Portal-specific filters and presentation are allowed; portal-specific fabricated balances, contract statuses, prices, subscription states or liquidity are not.

When a domain is not connected, the API returns `NOT_CONFIGURED` or `UNAVAILABLE`. When a contract is merely allowlisted or has an event cursor, it remains `UNVERIFIED`; this is not proof of deployment, code hash, initialization, balances or finality.

## Required environment

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Function only)
- `PI_TESTNET_SOROBAN_RPC_URL` (optional; defaults to the Pi Testnet RPC)
- `PI_TESTNET_HORIZON_URL` (optional; defaults to Pi Testnet Horizon)
- `PI_TESTNET_NETWORK_PASSPHRASE` (optional; defaults to `Pi Testnet`)
- `PI_TESTNET_PROTOCOL_EXPECTED` (optional; defaults to 28)
- `PI_TESTNET_CONTRACT_IDS` (optional; comma-separated allowlist)
- `PIRC_PORTAL_EVENT_LIMIT` (optional; 1–100)

Apply the existing `pirc_soroban_event_inbox` migration first. The event ingestion worker and this read gateway must share the canonical `network_id = pi-testnet`; `Testnet1` and `pi-testnet1` are aliases only.

## Deployment and consumer setup

1. Deploy `supabase/functions/pirc-portal-feed` to the same Supabase project as the event inbox.
2. Set the required Edge Function secrets in Supabase project settings; do not paste keys into chat or commit them.
3. Keep function JWT verification enabled; clients call with the public anon key, never the service-role key.
4. Configure the frontend environment with only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Replace portal-local mocks with this shared response. Keep simulations in a separately labelled sandbox and never mix them into live panels.
6. Verify the endpoint from the deployed application and record the returned network passphrase, protocol, ledger, source states and timestamp.
7. Add domain projections only after the relevant source is authoritative and has a migration, read model, freshness policy and tests.

## Current limitations

- The endpoint reads the raw event inbox and cursor tables. Events are observations, not settlement proof.
- Contract IDs from an allowlist or cursor are not deployment-verified.
- RAW factory execution, subscriptions, asset balances and PiDEX liquidity are explicitly `NOT_CONFIGURED` until real authoritative read models and read-back checks are implemented.
- No contract deployment, wallet signing, transfer, mint, settlement or Mainnet write is performed by this feed.
