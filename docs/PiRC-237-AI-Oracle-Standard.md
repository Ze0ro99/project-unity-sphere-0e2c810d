# PiRC-237 — AI Market Intelligence Oracle

Status: DRAFT SPECIFICATION / REFERENCE IMPLEMENTATION INTEGRATION. This is a community proposal, not an official Pi Network standard.

## 1. Purpose
Define a controlled interface for publishing model-derived volatility and sentiment observations for a named asset. The contract records provenance metadata and bounded values. It does not itself train a model, establish that a model is unbiased, or prove a zero-knowledge statement.

## 2. Source baseline
- Solidity reference: `contracts/PiRC237AIOracle.sol`.
- Soroban source: `contracts/soroban/src/ai_oracle.rs` (legacy file; source was malformed and contained duplicate/incomplete contract definitions in the inspected default branch).
- Canonical reference implementation added on the integration branch: `Ze0ro99/SmartContracts/contracts/pirc_237_ai_oracle`.

The original Solidity source explicitly leaves ZK proof verification as a placeholder. The original Soroban source emits an event without persisting the observation or validating the proof. Neither is a complete verified AI oracle.

## 3. Data model
Each observation contains:
- asset/feed identifier;
- volatility index in parts per million (0..1,000,000);
- sentiment score in parts per million (0..1,000,000);
- monotonically increasing sequence per asset;
- ledger timestamp;
- authorized updater address;
- model version string;
- proof hash commitment.

The proof hash is a commitment/reference only. It is not a verified ZK proof and must not be displayed as proof verification.

## 4. Authorization
An admin initializes the contract and maintains an updater allowlist. Every updater submission requires address authorization. Admin and updater roles must be separate operational identities. Key rotation and emergency revocation must be supported by governance policy.

## 5. Validation
- Reject scores outside [0, 1,000,000].
- Reject non-increasing sequence numbers for the same asset.
- Use the ledger timestamp rather than a caller-provided timestamp.
- Include model version and proof hash in the stored record.
- Do not accept a feed unless its asset ID, unit, model version and data source are registered by the off-chain policy layer.

## 6. Oracle pipeline
Approved data source → model execution → signed observation → model/version policy check → authorized updater → contract validation → persistent record → downstream risk/market consumers.

Production use additionally requires multiple independent data sources, source freshness, quorum, deviation bounds, model evaluation, adversarial manipulation testing, replay protection and a dispute process.

## 7. Consumer safety
Consumers must check observation age, sequence, model version, source policy and score scale. A missing or stale observation must fail closed. Do not infer a USD price, solvency, collateral coverage or purchasing power from sentiment/volatility values.

## 8. Acceptance criteria
1. Unauthorized updater rejected.
2. Admin-only updater changes.
3. Score boundaries accepted; out-of-range values rejected.
4. Sequence replay and rollback rejected.
5. Ledger timestamp recorded.
6. Model version and proof hash persisted.
7. Consumer query returns the latest record.
8. Unit and adversarial tests pass.
9. Independent review completed before deployment.

## 9. Status
The integration-branch Soroban reference stores authorized, bounded, monotonic observations. It does not perform ZK verification, multi-source aggregation, model execution or market-price formation. Those remain separate requirements.
