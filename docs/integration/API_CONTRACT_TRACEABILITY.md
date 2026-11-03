# API and Contract Traceability Matrix

**Status:** Design and source audit. Rows do not imply runtime integration unless evidence is linked.

| Capability | PiRC requirement/schema | Contract owner | Unity Sphere component | Current evidence state | Acceptance evidence still required |
|---|---|---|---|---|---|
| Asset metadata registry | PiRC-207 + asset provenance schema | Registry V3 | `api/asset_registry.py` | PARTIAL | Testnet contract ID, issuer readback, metadata hash match |
| Oracle observation | Oracle observation schema + Oracle execution spec | Oracle V2 | Network/oracle adapter | PARTIAL | Signature verification, quorum, freshness, replay integration |
| Reserve attestation | Asset/reserve schemas | Proof-of-Reserves V2 | Registry/API evidence view | PARTIAL | Independent auditor report, scope, freshness, custody evidence |
| Economic reference | Economic engine spec + golden vectors | Proposed settlement contract | Economic API boundary spec | SPECIFIED | Contract implementation, API adapter, CI parity |
| Settlement request | `economic-settlement-request.schema.json` | Settlement contract | Proposed `POST /v1/economics/settlements` | SCHEMA/DESIGN | Request handler, auth, idempotency, transaction/readback |
| Seven-layer display | Seven-layer registry v1 | No asset contract implied | `assets/js/token_layers.js` | PROPOSAL | Versioned registry source, mapping review, accessibility tests |
| Provenance | Asset provenance schema | Registry + evidence verifier | Asset registry API | PARTIAL | Network/address/code/metadata verification bundle |

## Integration invariants

1. API output never promotes a repository claim to verified chain state.
2. Client-supplied prices, reserve values, eligibility, or distributable totals are informational only and cannot authorize settlement.
3. Every amount carries asset ID, integer atomic amount, and scale.
4. Every transaction request binds network ID, contract ID, schema version, and idempotency key.
5. Every successful response requires final transaction status and contract readback.
6. An ambiguous timeout after submission is represented as `UNKNOWN_PENDING_RECONCILIATION`, not blindly retried as a new payment.
7. API errors use stable machine-readable codes and do not leak secrets or signer details.

## Required integration tests

- Schema rejection for unknown fields and malformed IDs.
- Authentication and operator role enforcement.
- Idempotency replay returns the original request state.
- Missing contract/network configuration fails closed.
- RPC unavailable before submission does not create a transaction.
- RPC timeout after submission enters reconciliation state.
- Rejected transaction is reported as rejected, not success.
- Confirmed transaction with mismatched readback is quarantined.
- API and contract period/asset/amount fields reconcile exactly.
- UI renders PROPOSED, UNVERIFIED, PENDING, SETTLED, FAILED, and UNKNOWN distinctly.
