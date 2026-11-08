# Soroban Settlement Event Consumer

**Status:** Implementation contract and acceptance specification. No live event listener, database projection, or Testnet read-back is claimed by this document.

## Ownership

- SmartContracts is authoritative for settlement state and emits the contract events.
- Unity Sphere owns event ingestion, durable cursoring, idempotent projection, read-back verification, and application APIs.
- PiRC owns normative accounting policy and shared economic vectors.
- The browser is never an authority for settlement inputs, event order, finality, or settlement status.

## Source ABI

Consume only the canonical `pirc-economic-settlement` contract at `contracts/pirc_economic_settlement` in `Ze0ro99/SmartContracts`. Do not infer compatibility from the excluded `contracts/economic_settlement` alternate crate.

The consumer recognizes these exact topic pairs and data shapes:

| Topic 1 | Topic 2 | Data | Event kind |
|---|---|---|---|
| `period` | `proposed` | `(period_id: BytesN<32>, distributable: i128)` | `period_proposed` |
| `period` | `approved` | `period_id: BytesN<32>` | `period_approved` |
| `alloc` | `recorded` | `(period_id: BytesN<32>, participant: Address, amount: i128)` | `allocation_recorded` |
| `period` | `settled` | `(period_id: BytesN<32>, settlement_digest: BytesN<32>, distributable: i128)` | `period_settled` |

Unknown topics, malformed XDR, missing tuple members, unexpected contract IDs, or unknown networks must be quarantined as unrecognized evidence. Never coerce them into a successful settlement event.

## Normalized event envelope

Every ingested event is normalized into this application-owned record:

```json
{
  "schema_version": "1.0.0",
  "network": "pi-testnet",
  "network_passphrase": "configured-network-passphrase",
  "contract_id": "configured-contract-id",
  "ledger_sequence": 0,
  "transaction_hash": "hex-or-base64-transaction-hash",
  "event_index": 0,
  "event_id": "stable-source-event-id-or-derived-key",
  "topic_1": "period",
  "topic_2": "proposed",
  "event_kind": "period_proposed",
  "period_id": "64-character-hex",
  "payload": {},
  "observed_at": "RFC3339 timestamp",
  "verification_status": "observed"
}
```

The example values are placeholders, not deployed network identifiers. Store the original RPC event payload alongside the normalized record so decoding can be audited and replayed.

## Durable cursor and idempotency

1. Poll Soroban RPC for events using a persisted cursor; do not use an in-memory-only cursor.
2. Validate configured network passphrase and exact contract ID before accepting an event.
3. Derive a stable deduplication key from the source event ID when available. Otherwise use the tuple `network + contract_id + ledger_sequence + transaction_hash + event_index`.
4. Insert the raw event and deduplication key in one database transaction. Enforce a unique constraint on the deduplication key.
5. Update the durable cursor only after the event is durably stored. A crash between storage and cursor update must safely replay the same event.
6. Process stored events asynchronously; retries must not create duplicate period, allocation, or settlement projections.
7. Keep raw observation status separate from contract-state verification status.

Never deduplicate only by `period_id`: a single period legitimately emits multiple lifecycle and allocation events.

## State projection rules

- `period_proposed`: record the observed proposal and distributable amount; keep status `proposed`.
- `period_approved`: mark approval observed; verify the current period state before projecting `approved`.
- `allocation_recorded`: store the participant allocation idempotently and reconcile the running total against the period's distributable amount.
- `period_settled`: mark `settlement_observed`, not `settled`, until a read-only `get_period(period_id)` call confirms `Settled`, the stored digest matches the event digest, and the final transaction is successful.

The contract read-back is authoritative for current state. Events are an ingestion and notification stream, not a substitute for state reconciliation.

## Failure handling

- RPC timeout or unavailable endpoint: retain the last durable cursor and retry with bounded backoff.
- Duplicate event: treat as successful no-op after verifying the stored source event key.
- Invalid XDR or unexpected topic: quarantine; do not advance a success projection.
- Event references an unknown period: persist as pending reconciliation; do not invent the missing proposal.
- Settlement event digest differs from contract read-back: stop projection and raise a critical incident.
- Missing or expired contract state: report `unknown` and request explicit reconciliation; do not automatically resubmit transactions.
- Reprocessing must be deterministic and safe after process restart.

## Required storage model

At minimum, persist:

- `soroban_event_inbox`: source identity, network, contract, ledger, transaction, event index, topics, raw payload, normalized payload, observed time, decode status, unique idempotency key.
- `soroban_event_cursor`: network, contract, last durable cursor, updated time.
- `settlement_period_projection`: period key, current observed state, distributable, allocated total, input digest, settlement digest, last verified ledger.
- `settlement_allocation_projection`: period key, participant, amount, evidence hash, source event key.

Apply row-level access controls. Browser roles may read only the approved projection fields; only the service role may write inbox, cursor, or reconciliation state. Never expose signer secrets or raw authentication tokens in event payloads or logs.

## Acceptance tests

- Replaying the same event twice creates one inbox row and one projection effect.
- Restarting after inbox insert but before cursor update safely replays the event.
- Two allocations for different participants are both retained; duplicate source event is not applied twice.
- An unknown topic is quarantined without mutating period state.
- A settlement event with a mismatched digest never becomes `settled`.
- RPC timeout preserves the last durable cursor.
- Read-back mismatch moves the projection to `unknown` or `reconciliation_required`.
- No test or consumer path sends token transfers, mints, burns, redeems, or performs custody actions.

## Deployment gate

Before enabling the consumer, pin the exact SmartContracts commit and generated ABI, add database migrations and unique constraints, add deterministic decoder tests using recorded fixtures, verify read-only RPC access, and demonstrate end-to-end event replay plus contract read-back on Pi Testnet. Until then, the consumer remains specified but unimplemented.
