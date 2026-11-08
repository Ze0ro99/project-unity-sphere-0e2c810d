# Pi Testnet Soroban Event Inbox

## Scope
A bounded server-side raw-event ingestion worker for one configured Pi Testnet Soroban contract. It writes events to a service-role-only inbox with a unique network/contract/event key and advances a durable RPC paging cursor only after the inbox write succeeds.

It does not decode XDR, project accounting states, verify settlement digests, sign or submit transactions, transfer Pi, or declare a period settled.

## Required Edge Function secrets
- PI_TESTNET_CONTRACT_ID: deployed Soroban contract address on Pi Testnet.
- PI_TESTNET_START_LEDGER: positive ledger sequence after contract deployment for the initial backfill.
- PI_TESTNET_SOROBAN_RPC_URL: defaults to https://rpc.testnet.minepi.com.
- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY: Supabase project configuration; service key remains server-side.
- PIRC_EVENT_INGEST_SECRET: high-entropy secret sent in the x-pirc-ingest-secret header.
- Optional PIRC_EVENT_PAGE_LIMIT: defaults to 100 and is clamped to 1–500.

Apply migration 20261108130000_pirc_soroban_event_inbox.sql before deploying the function.

## Invocation
POST to /functions/v1/pirc-soroban-event-ingest with the x-pirc-ingest-secret header. Schedule one invocation at a time. Concurrent pollers for the same network/contract are not supported until a database lease/lock is added.

## Recovery
- A failed inbox insert does not advance the cursor.
- Duplicate events are ignored by the database unique key.
- Keep raw event JSON and topic XDR/base64 values for deterministic future decoding.
- Monitor the oldest available RPC ledger; if the stored cursor falls behind the node retention window, stop and perform explicit backfill/reconciliation rather than silently skipping.
- Treat RPC cursor and event IDs as opaque strings.

## Release gate for settlement projection
Before creating a settled projection, implement and test XDR decoding for the canonical contract event shapes, fetch transaction status, read get_period(period_id), and compare the on-chain settlement digest with the stored canonical digest. An observed event alone is not settlement finality.
