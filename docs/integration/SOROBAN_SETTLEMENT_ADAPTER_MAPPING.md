# Soroban Economic Settlement Adapter Mapping

**Status:** ABI-aligned integration specification. This document does not claim that a live transaction adapter or event consumer has been deployed.

## Canonical contract dependency

The canonical settlement crate in the companion `Ze0ro99/SmartContracts` repository is:

- Path: `contracts/pirc_economic_settlement`
- Cargo package: `pirc-economic-settlement`
- Contract type: `EconomicSettlement`
- SDK: Soroban SDK 22.0.11

The similarly named `contracts/economic_settlement` directory is an alternate implementation and is excluded from the SmartContracts Cargo workspace. Unity Sphere integrations must bind to the canonical `pirc_economic_settlement` ABI, not the excluded alternate crate.

## Canonical ABI

### PeriodProposal

`propose_period` accepts one `PeriodProposal` struct, not a flat list of accounting arguments:

| Field | Type | Meaning |
|---|---|---|
| `period_id` | `BytesN<32>` | Deterministic period key |
| `asset_id` | `BytesN<32>` | Canonical asset identifier digest |
| `collected_revenue` | `i128` | Gross collected amount in integer atomic units |
| `operating_costs` | `i128` | Approved operating costs |
| `tax_and_statutory` | `i128` | Tax and statutory deductions |
| `refunds_and_due_liabilities` | `i128` | Refunds and due liabilities |
| `reserve_replenishment` | `i128` | Approved reserve allocation |
| `approved_commitments` | `i128` | Previously approved commitments |
| `policy_version` | `u32` | Non-zero policy version |
| `input_digest` | `BytesN<32>` | Commitment to canonical accounting inputs |

The contract calculates deductions with checked addition and computes:

```text
deductions = operating_costs
           + tax_and_statutory
           + refunds_and_due_liabilities
           + reserve_replenishment
           + approved_commitments

distributable = collected_revenue - deductions
```

All amounts are integer atomic units. Negative values, arithmetic overflow, deductions greater than collected revenue, and policy version zero are rejected.

### Entry points

| Entry point | Canonical arguments | Authorization / behavior |
|---|---|---|
| `initialize` | `admin: Address` | One-time; admin authorizes |
| `set_operator` | `operator: Address, enabled: bool` | Admin authorizes; disabled operators are removed |
| `propose_period` | `operator: Address, proposal: PeriodProposal` | Enabled operator authorizes |
| `approve_period` | `period_id: BytesN<32>` | Admin authorizes; no separate approver argument |
| `record_allocation` | `operator, period_id, participant, amount, evidence_hash` | Enabled operator; one allocation per participant |
| `settle_period` | `operator, period_id, settlement_digest` | Enabled operator; requires exact allocation conservation |
| `get_period` | `period_id` | Read-only state lookup |
| `get_allocation` | `period_id, participant` | Read-only allocation lookup |

The contract records accounting state and emits events. It does not transfer Pi, redeem tokens, custody assets, validate off-chain evidence, or independently prove that the accounting inputs are true.

### State and error mapping

Canonical states are `Proposed`, `Approved`, and `Settled`.

| Error code | Error | Meaning |
|---:|---|---|
| 1 | `AlreadyInitialized` | Initialization already completed |
| 2 | `NotInitialized` | Admin is not configured |
| 3 | `Unauthorized` | Caller is not an authorized admin/operator |
| 4 | `PeriodAlreadyExists` | Period key replay |
| 5 | `PeriodNotFound` | Period key is unknown |
| 6 | `InvalidDeductions` | Negative or underfunded accounting inputs |
| 7 | `InvalidState` | Transition is not allowed from current state |
| 8 | `DuplicateAllocation` | Participant already allocated in this period |
| 9 | `AllocationExceedsDistributable` | Allocation exceeds the approved budget |
| 10 | `AllocationNotConserved` | Allocations do not equal distributable amount |
| 11 | `AlreadySettled` | Period was already finalized |
| 12 | `ArithmeticOverflow` | Checked arithmetic failed |
| 13 | `InvalidAllocationAmount` | Allocation is not positive |
| 14 | `InvalidPolicyVersion` | Policy version is zero |

## Canonical identifier and digest rules

The API's human-readable `period_id` maps deterministically to Soroban's fixed-width period key:

```text
period_key = SHA256(UTF8("PIRC-PERIOD-V1\\n" + canonical_period_id))
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
  operating_costs_atomic,
  tax_and_statutory_atomic,
  refunds_and_due_liabilities_atomic,
  reserve_replenishment_atomic,
  approved_commitments_atomic,
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

1. Validate request schema, user authentication, configured network and exact expected contract ID.
2. Resolve accounting inputs server-side from auditable sources. Never accept revenue, deductions, allocations, eligibility, price or reserve values from the browser.
3. Read contract state. If the period key already exists, reconcile it; do not blindly submit again.
4. Persist the canonical input bundle and digest before requesting a signature.
5. Submit `propose_period(operator, PeriodProposal)` using an authorized operator.
6. Require a distinct admin authorization for `approve_period(period_id)`.
7. Submit each unique participant allocation with an evidence hash. Enforce the contract distributable limit and reconcile the sum.
8. Submit `settle_period` only when `allocated == distributable`.
9. Wait for final transaction status and read back the period. Return `settled` only if on-chain state is `Settled` and the digest matches.
10. Persist transaction hashes, ledger sequence, network, contract ID, period key, schema/policy versions and read-back snapshot.

## Contract event mapping

The canonical contract currently emits these events:

| Topics | Data tuple | Projection |
|---|---|---|
| `period, proposed` | `(period_id, distributable)` | Proposal recorded |
| `period, approved` | `period_id` | Admin approval recorded |
| `alloc, recorded` | `(period_id, participant, amount)` | Allocation recorded |
| `period, settled` | `(period_id, settlement_digest, distributable)` | Settlement finalization event |

Events are notifications, not sufficient proof of final state. The consumer must read back `get_period` and compare the settlement digest before projecting a period as settled.

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
- A duplicate period key triggers read-and-reconcile, not a second proposal.
- If submission times out, query transaction hash/status and read contract state before retry.
- If the contract is Proposed or Approved, resume only the missing authorized transition.
- If the contract is Settled with a different digest, stop and raise a critical reconciliation incident.
- A correction uses a separately governed adjustment period; never mutate a settled period.

## Release gates

- ABI and generated SDK client reviewed against the canonical SmartContracts commit.
- Canonicalization/hash test vectors shared between API and contract clients.
- Operator/admin key separation demonstrated.
- Duplicate, timeout, stale-read, partial-allocation and replay tests pass.
- Event consumer persists a durable cursor and idempotency key, and handles replay without duplicate projections.
- Final transaction status and state read-back demonstrated on a named Testnet.
- Independent contract and API security review completed.

No deployment, custody, Pi redemption, market-price guarantee, reserve backing or Pi Core Team endorsement is implied.
