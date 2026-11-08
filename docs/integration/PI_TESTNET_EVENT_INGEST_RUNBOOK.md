# Pi Testnet Soroban Event Inbox

## Scope

A bounded server-side raw-event ingestion worker for an explicit allowlist of Pi Testnet Soroban contracts. The project name `Testnet1` is an alias for the canonical Pi Testnet network identity; it is not a separate chain.

The worker verifies Horizon and Soroban RPC network identity, configured passphrase, expected Soroban protocol, RPC health and ledger retention before it creates or advances any cursor. It stores raw events in a service-role-only inbox with a unique network/contract/event key and a durable cursor per contract.

It does **not** decode XDR, project accounting states, verify settlement digests, prove transaction finality, sign or submit transactions, transfer Pi, mint tokens, or declare a period settled.

## Required Edge Function secrets/configuration

- `PI_TESTNET_HORIZON_URL`: defaults to `https://api.testnet.minepi.com`; only the approved Pi Testnet Horizon host is accepted.
- `PI_TESTNET_SOROBAN_RPC_URL`: defaults to `https://rpc.testnet.minepi.com`; only the approved Pi Testnet RPC host is accepted.
- `PI_TESTNET_NETWORK_PASSPHRASE`: exact network passphrase, verified against both Horizon and Soroban RPC. The current Pi Testnet passphrase is `Pi Testnet`.
- `PI_TESTNET_PROTOCOL_EXPECTED`: explicit Soroban RPC protocol target; the current integration profile targets 28. A protocol change requires compatibility review and regression checks.
- `PI_TESTNET_CONTRACT_IDS`: comma-separated list of deployed, allowlisted Soroban contract IDs. Do not add IDs from source manifests until contract instance, code hash and initialization read-back are verified.
- `PI_TESTNET_START_LEDGER`: positive start ledger at or after the relevant deployment and within the RPC retention window.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: Supabase project configuration; the service key remains server-side.
- `PIRC_EVENT_INGEST_SECRET`: high-entropy secret sent in the `x-pirc-ingest-secret` header.
- Optional `PIRC_EVENT_PAGE_LIMIT`: defaults to 100 and is clamped to 1–500.

The legacy singular `PI_TESTNET_CONTRACT_ID` is accepted for a single-contract deployment. Prefer the plural allowlist for the integrated registry.

Apply migration `20261108130000_pirc_soroban_event_inbox.sql` before deploying the function. The cursor table's primary key is `(network_id, contract_id)`, so each allowlisted contract has an independent durable cursor.

## Network identity gate

Before any cursor or event operation, the function:

1. Requires HTTPS and exact allowlisted endpoint hosts; redirects, credentials and URL query/hash components are rejected.
2. Reads Horizon root and Soroban `getNetwork`, `getHealth`, and `getLatestLedger`.
3. Requires Horizon and Soroban passphrases to match the configured Pi Testnet passphrase.
4. Requires the Soroban RPC protocol to equal the configured expected protocol and Horizon's supported protocol to be at least that target.
5. Requires healthy RPC status and valid oldest/latest ledger bounds.

Any mismatch stops ingestion. The function does not fall back to Stellar public Testnet or Pi Mainnet.

## Invocation

POST to `/functions/v1/pirc-soroban-event-ingest` with the `x-pirc-ingest-secret` header. Schedule one invocation at a time for this project until a database lease/lock is implemented. Multiple allowlisted contracts are processed sequentially in one invocation; each has its own cursor.

## Idempotency and recovery

- A failed inbox insert does not advance that contract's cursor.
- Duplicate events are ignored by the database unique key.
- A crash after insert but before cursor update safely replays the same event.
- Keep raw event JSON and topic values for deterministic future decoding.
- Monitor the oldest available RPC ledger; if a stored cursor falls behind node retention, stop and perform explicit backfill/reconciliation rather than silently skipping.
- Treat RPC cursor and event IDs as opaque strings.
- If one contract fails after another contract has been processed, the completed contract's cursor remains valid; retry is safe because inbox writes are idempotent.

## Release gate for asset synchronization and settlement

Before an asset can be activated in PiDEX, its contract must have:
- a verified Pi Testnet network identity;
- deployment transaction and contract ID;
- deployed WASM code hash read-back matching the reviewed artifact;
- initialization, issuer/admin and token metadata read-back;
- total supply and wallet balance read-back;
- successful transfer/approval authorization tests;
- event fixtures and deterministic XDR decoding.

Before a settlement projection can be marked final, implement and test the canonical contract event decoder, fetch transaction status, read the contract's authoritative state, and reconcile the settlement digest. An observed event alone is not settlement finality.

Until those gates pass, this worker is only a raw event inbox and PiDEX remains simulation-only.
