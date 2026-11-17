# PiRC Project Manifest

**Organization:** PiRC Community Project  
**Status:** SOURCE DECLARED — PI TESTNET CONTRACT VERIFICATION INCOMPLETE  
**Scope:** Repository architecture and integration inventory only. This manifest is not a Pi Core Team endorsement, deployment certificate, or proof of live assets.

## Canonical layer registry

Use [the canonical PiRC-207 layer registry](assets/registry/pirc207-layer-registry.json) as the source for layer labels and evidence state. Preserve the seven canonical color slots separately from the historical Gold packet entry. Gold is not automatically Indigo.

## Pi Testnet evidence

A read-only Pi Testnet probe (GitHub Actions run 43606786908) verified the Pi Testnet network identity at ledger 27701412. The same probe returned NOT_FOUND for all seven supplied layer contract IDs. The repository's SmartContracts Testnet1 deployment manifest currently has null canonical layer contract IDs and deployment_enabled=false.

The Stellar Expert Testnet transaction references recorded in the registry are a separate evidence domain. They were supplied as source evidence and do not establish Pi Testnet deployment or prove the current code hash/initialized state.

## Activation requirements

Do not mark any asset ACTIVE or TESTNET_VERIFIED until each intended Pi Testnet contract has:
- a successful Pi Testnet deployment transaction and ledger sequence;
- contract-instance and deployed WASM/code-hash read-back;
- initialized-state, admin/issuer and authorization read-back;
- decimals, supply and balance read-back;
- reproducible evidence with network ID and timestamp.

A logo, repository address, account snapshot, Stellar Testnet explorer URL, CI pass, or source status is not deployment proof.

## System status

- Seven-layer UI and economic references: IMPLEMENTED / PROPOSAL_REFERENCE_ONLY.
- Seven supplied Pi Testnet layer contract IDs: NOT_FOUND at ledger 27701412.
- Gold-to-Indigo migration: NOT_APPROVED.
- OUSD: PROPOSED_TEST_ONLY; no issuer, contract, reserves, peg or redemption.
- PiDEX pools and liquidity: NOT_VERIFIED; do not enable live swaps or deposits.
- Mainnet writes, signing, minting, burning and payouts: NOT AUTHORIZED.

Lifecycle: PROPOSED → SPECIFIED → IMPLEMENTED → TESTED → TESTNET_VERIFIED → AUDITED → PRODUCTION_VERIFIED. Each transition requires independent, reproducible evidence.
