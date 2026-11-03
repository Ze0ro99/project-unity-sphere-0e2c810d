# Soroban Economic Settlement Adapter Mapping

**Status:** Interface handoff specification only. No live endpoint or network transaction is implemented by this document.

## Contract dependency

The current reference contract is in the companion SmartContracts repository at `contracts/economic_settlement`. Its crate exposes:

- `initialize(admin)`
- `set_operator(operator, enabled)`
- `propose_period(operator, period_id: BytesN<32>, asset_id, collected_revenue, deductions, policy_version, input_digest)`
- `approve_period(approver, period_id)`
- `record_allocation(operator, period_id, participant, amount, evidence_hash)`
- `settle_period(operator, period_id, settlement_digest)`
- `get_period(period_id)`
- `get_allocation(period_id, participant)`

The contract is a state/accounting registry in this first slice. It does not move tokens or verify external accounting evidence.

## Canonical identifier and digest rules

The API's human-readable `period_id` must map deterministically to Soroban's fixed-width period key:

```text
period_key = SHA256(UTF8("PIRC-PERIOD-V1\n" + canonical_period_id))
```

Canonical period IDs are trimmed, case-sensitive UTF-8 strings matching the request schema. The server must reject non-canonical values rather than silently normalize them.

The input digest commits to the canonical accounting bundle:

```text
input_digest = SHA256(canonical_json({
  schema_version,
  period_id,
  network,
  contract_id,
  asset_id,
  collected_revenue_atomic,
  deductions_atomic,
  policy_version,
  source_evidence_refs,
  allocation_manifest_digest
}))
```

The settlement digest commits to the exact finalization context:

```text
settlement_digest = SHA256(canonical_json({
  domain: "PIRC-SETTLEMENT-V1",
  network,
  contract_id,
  period_key,
  input_digest,
  allocation_manifest_digest,
  allocated_total_atomic
}))
```

Canonical JSON must use UTF-8, lexicographically sorted object keys, no insignificant whitespace, integer-only amount fields and no floating-point numbers. Hashes are commitments, not proof that referenced evidence is true.

## Orchestration sequence

1. Validate the request schema, authentication, configured network and exact expected contract ID.
2. Resolve accounting inputs server-side from auditable sources. Never accept revenue, deductions, allocations, eligibility, price or reserve values from the browser.
3. Read contract state. If the period key already exists, reconcile it; do not blindly submit again.
4. Prepare and persist the canonical input bundle and digest before signing.
5. Submit `propose_period` using an authorized operator.
6. Require a distinct admin authorization for `approve_period`.
7. Submit each unique participant allocation with an evidence hash. Enforce the contract distributable limit and reconcile the sum.
8. Submit `settle_period` only when `allocated_total == distributable`.
9. Wait for final transaction status and read back the period. Only return `settled` if the on-chain state is Settled and the digest matches.
10. Persist transaction hashes, ledger sequence, network, contract ID, period key, schema/policy versions and read-back snapshot.

## API state mapping

| API state | Contract state / evidence | User-visible meaning |
|---|---|---|
| `proposed` | Proposed + proposal transaction final | Inputs recorded; approval pending |
| `approved` | Approved + approval transaction final | Admin approved; allocation pending |
| `settling` | Approved + allocation/finalization submitted | Pending finality/read-back |
| `settled` | Settled + matching digest read-back | Finalized accounting record |
| `failed` | Definitive failed transaction or validation | No successful transition |
| `unknown` | Timeout, RPC ambiguity or missing read-back | Reconciliation required; do not retry automatically |

## Idempotency and recovery

- API idempotency key maps to a durable request record; it is not substituted for the on-chain period key.
- A duplicate period key must trigger read-and-reconcile, not a second proposal.
- If a submission times out, query transaction hash/status and read contract state before retry.
- If the contract is Proposed or Approved, resume only the missing authorized transition.
- If the contract is Settled with a different digest, stop and raise a critical reconciliation incident.
- A correction must use a separately governed adjustment period; never mutate a settled period.

## Release gates

- ABI and SDK client generation reviewed against the pinned Soroban SDK.
- Canonicalization/hash test vectors shared between API and contract clients.
- Operator/admin key separation demonstrated.
- Duplicate, timeout, stale-read, partial-allocation and replay tests pass.
- Final transaction status and state read-back demonstrated on a named Testnet.
- Independent contract and API security review completed.

No deployment, custody, Pi redemption, market-price guarantee, reserve backing or Pi Core Team endorsement is implied.
