# Economic Engine API Contract

## Ownership boundary

- PiRC owns normative economic rules and the canonical reference vectors.
- SmartContracts owns authorization, state transitions, replay protection, and on-chain settlement.
- Unity Sphere owns request validation, display, read-only projections, and API orchestration.
- Client-supplied distributable amounts, prices, reserve ratios, eligibility, or settlement outcomes are never authoritative.

## Proposed endpoint

`POST /v1/economics/settlements`

The endpoint is disabled unless an explicitly configured settlement contract and network are available. It must not silently fall back to a developer account or a public default contract ID.

### Request

```json
{
  "schema_version": "1.0.0",
  "period_id": "2026-11",
  "expected_contract_id": "configured-contract-id",
  "idempotency_key": "unique-client-generated-key"
}
```

The request selects a period; it does not supply trusted accounting totals or allocations. The server resolves the authoritative ledger inputs from configured, auditable sources and checks the contract state before proposing a transaction.

### Response

```json
{
  "status": "proposed",
  "period_id": "2026-11",
  "network": "testnet",
  "contract_id": "configured-contract-id",
  "transaction_hash": null,
  "settlement_id": null,
  "evidence": []
}
```

A proposal is not a successful settlement. Return `settled` only after a transaction is confirmed on the configured network and a read-back confirms the expected period state.

## Security requirements

- No hard-coded signer identity; no signing key in the web process.
- Explicit network and contract configuration; reject missing or malformed values.
- Require authenticated operator authorization for transaction submission.
- Use idempotency keys and contract-side period replay protection.
- Enforce request size and timeout limits; redact secrets from logs.
- Keep quote/display APIs read-only. Do not execute settlement from page loads or background GET requests.
- Never label an asset, reserve, issuer, peg, or redemption as verified without independent evidence.
- Test stale state, duplicate requests, unavailable RPC, rejected transaction, timeout after submission, and read-back mismatch.
