# PiGold Liquidity Coordinator and Asset Registry

## Status and scope

This document defines the integration boundary for the PiGold coordinator. It is an architecture and control specification, not evidence that a coordinator or any pool is deployed. The canonical registry schema is `schemas/asset-contract-registry.schema.json`.

The supported target in this specification is **Pi Testnet** only. Network identity, contract deployment, code hash, and contract state must be independently read back before any entry can be marked `verified`.

## Core responsibilities

PiGold is a routing and coordination layer across independently accounted liquidity pools. It is not:
- a replacement token for the seven ecosystem layers;
- a shared custody wallet or omnibus reserve;
- an automatic mint, burn, bridge, or cross-layer conversion mechanism;
- proof that an asset is liquid, redeemable, or backed.

The coordinator selects an eligible pair-specific pool, checks policy and route constraints, and delegates the requested operation to that pool. The coordinator must not claim custody of pool reserves or combine their balances.

## Isolation invariants

1. Every pool has its own contract identity and `reserve_accounting_id`.
2. A reserve balance may satisfy only one pool's accounting obligation at a time.
3. No pool may spend another pool's reserves.
4. Each asset keeps its own issuer, contract, authorization policy, and deployment evidence.
5. A route must fail closed if any pool, asset, contract version, or evidence record is missing, stale, suspended, or mismatched.
6. No cross-layer transfer, mint, burn, or wrapping is performed implicitly.
7. The router cannot upgrade pool contracts or change asset authorization policies.
8. Oracle prices are advisory inputs only until source independence, freshness, deviation limits, and solvency gates pass.

## Registry lifecycle

- `proposed`: design-only; no deployment claim.
- `unverified`: an identifier may be recorded, but deployment and state have not been independently confirmed.
- `verified`: requires a contract ID, 64-character WASM hash, deployment transaction hash, timestamped readback, and readback method.
- `suspended`: excluded from routing immediately; retain historical evidence.

A UI must never translate an absent or incomplete record into `ACTIVE`. Missing evidence is `UNKNOWN`, not success.

## Route acceptance

Before returning a quote or executing a route, the coordinator must verify:
- the registry network is exactly `pi-testnet` with passphrase `Pi Testnet`;
- every referenced asset and pool is `verified`;
- pool contract IDs and WASM hashes match the registry;
- asset pair direction and fee policy are valid;
- slippage and minimum-output constraints are satisfied;
- each reserve accounting identifier is unique within the route;
- the caller satisfies the pool's authorization policy.

The route planner must reject cycles, duplicate pools, duplicate reserve identifiers, unsupported assets, and any route that reuses a reserve in more than one leg.

## PiDEX compatibility

The existing `pidex_amm` contract is a pair-specific constant-product AMM. It can be treated as a pool adapter, not as the multi-asset coordinator itself. Multi-hop routing requires a separate coordinator interface and explicit route plan. No adapter may infer an asset or pool address from a symbol alone; all resolution must pass through the registry.

## Economic settlement boundary

The economic settlement contract records period inputs and allocations. Accounting records are not token transfers. A route or settlement UI must distinguish:
- proposed allocation;
- approved accounting allocation;
- submitted transaction;
- confirmed ledger event;
- independently read-back final balance.

Only the last two states provide chain evidence, and they must be linked to transaction and ledger identifiers.

## Deployment gate

No deployment workflow may be enabled until all of the following exist:
1. a reviewed allowlist of contract IDs and WASM hashes;
2. an explicit Pi Testnet network identity check;
3. an isolated Testnet signer with least privilege;
4. manual environment approval;
5. simulation and contract tests for the exact artifacts;
6. post-deployment RPC readback of contract state and code identity;
7. a rollback/disable procedure and immutable deployment report.

Secrets must never be stored in this registry or committed to Git. Do not use credentials previously exposed in chat; rotate them independently.

## Current implementation gaps

This specification does not create a PiGold router contract, deploy any contract, or establish pool liquidity. Those require implementation and independent tests against the exact contract interfaces. The current pair-specific AMM and accounting contract must not be represented as a complete multi-asset settlement system.


## Seven-asset product taxonomy

The portal product taxonomy contains seven proposed assets:
- PiGold: system coordination, routing policy and consolidated reporting.
- PiBank (blue): banking and institutional workflows.
- PiCash (green): everyday payment utility.
- PiExchange (orange): exchange and market access.
- PiGovernance (red): governance and policy.
- PiPurple (purple): foundational participation and provenance classification.
- PiYellow (yellow): utility and service access.

This catalogue is a product taxonomy, not a deployment or issuance registry. Each component retains its own contract identity, issuer, authorization, supply evidence and reserve accounting. PiGold does not become a custodial parent token and does not own or merge component balances.

## Dynamic purchasing-power model (proposal only)

The portal model is versioned as `pigr-0.1-proposal`. It uses a fresh, trusted external PI/USDT market reference as an anchor, then applies measured evidence factors:

`InternalPP = ExternalSpot × ConfidenceFactor`

`ConfidenceFactor = 0.40 + 0.25L + 0.15U + 0.10V + 0.10S`

Where:
- `L = clamp(unique verified reserves / verified liabilities, 0, 1)`
- `U = clamp(fulfilled utility value / target utility value, 0, 1)`
- `V = clamp(measured 24h turnover / external market value / target velocity, 0, 1)`
- `S = clamp(1 - venue deviation / maximum permitted deviation, 0, 1)`

The displayed 4,000/2,500/1,500/1,000/1,000 bps weights are a proposal only, not an official monetary rule. The computation accepts weights only as an explicit, versioned, governance-approved policy whose integer weights sum to exactly 10,000 bps. A missing or unapproved policy, stale or untrusted quote, fewer than three venues, missing evidence, duplicate reserve-accounting identifiers, or invalid values causes the model to return no result (fail closed).

External market capitalization and internal reference value are displayed separately. They must not be summed as though they were independent assets; doing so can double-count the same underlying Pi supply. Liquidity is summed only across unique reserve-accounting identifiers. Turnover is measured from reconciled activity, not synthetic chart volume.

The dashboard must show `PENDING EVIDENCE` rather than filling gaps with synthetic reserve, utility, supply or price values.


## Legacy seven-layer crosswalk and unresolved mismatch

The portal catalogue is a product taxonomy, not a replacement for the legacy PiRC-207 proposal table. The legacy proposal identifies Red/Root as governance, Orange/Sacral as mid-tier utility, Yellow/Solar Plexus as high-tier utility, Green/Heart as PiCash, Blue/Throat as banking, Indigo/Third Eye as premium reserve, and Purple/Crown as mined Pi/fractions.

The current product catalogue proposes PiGold as a coordination/meta layer and six component roles. Blue, Green, Red, Purple and Yellow are conceptually aligned to the legacy labels, subject to independent contract/asset verification. Orange is not yet aligned: the legacy proposal calls it utility, while this product catalogue proposes exchange/market access. Indigo is not silently renamed to PiGold or PiPurple; it remains an unresolved legacy proposal outside the seven-product catalogue until governance records an explicit migration decision.

No color or symbol is sufficient to bind a contract ID, issuer, reserve, supply, or redemption rule. The registry must retain the original identifiers and mark unresolved mappings as unverified.
