# Canonical Pi Testnet portal feed deployment

## Backend

The Edge Function `pirc-portal-feed` uses the deployed database RPC `public.pirc_portal_feed()` and the server-provided `SUPABASE_SERVICE_ROLE_KEY`. The service-role key must remain server-side and is never returned to the browser.

The database read model is the source of truth for event/cursor rows. Its current schema is:
- inbox: `network,event_id,contract_id,transaction_hash,ledger_sequence,event_type,payload,observed_at,processed_at,processing_status,processing_error`
- cursors: `network,contract_id,last_ledger_sequence,last_event_id,updated_at`

Do not query invented columns such as `network_id`, `start_ledger`, `paging_cursor`, `latest_ledger`, `topics`, or `ingest_status`. The function calls the vetted RPC rather than duplicating the private table schema.

## Frontend build environment

Set these variables in the actual deployment provider (Netlify/Vercel) before expecting the shared panel to load:

- `VITE_PIRC_PORTAL_FEED_URL=https://naeuosudklqsgeghafkw.supabase.co/functions/v1/pirc-portal-feed`
- `VITE_PIRC_PORTAL_FEED_ANON_KEY=<the project's public legacy anon JWT key>` (set in provider UI only; never commit it)

The public anon key is intended for browser use; it does not grant access to private tables. The Edge Function still requires JWT verification and performs database reads using its server-side service-role secret. Never set a service-role key in a `VITE_*` variable.

If either public setting is absent, the panel displays `NOT_CONFIGURED` and does not fall back to another Supabase project or mock values.

## Current data semantics

- Network identity is marked verified only when Pi Soroban RPC and Horizon independently report the expected Pi Testnet passphrase and a supported protocol version.
- Contract IDs sourced from cursors remain `UNVERIFIED`; a cursor is not deployment proof.
- Event rows are raw observations, not settled balances or finality.
- RAW factory, recurring subscriptions, verified asset balances and live liquidity remain `NOT_CONFIGURED` until their own authoritative read models exist.
- No signing, transfer, mint, settlement or Mainnet operation is exposed.

## Activation gates

1. Deploy the matching Edge Function version.
2. Set the two public frontend variables in the deployment provider.
3. Build and publish the frontend.
4. Verify the endpoint returns `pirc.canonical-portal-feed.v1` with the safety contract.
5. Only after a separate trusted ingestion worker is running should event counts/cursors become non-empty.
