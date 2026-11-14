# Main-Branch Source Audit and Integration Gap Register

Audit scope: the current default-branch trees and selected implementation files in the three named Ze0ro99 repositories. This is a source inspection, not a deployment audit or an independent chain-state verification.

## 1. Repository inventory

| Repository | Branch refs | Unique branch-head commits | Default-branch tree entries | Markdown | Rust | Solidity | YAML |
|---|---:|---:|---:|---:|---:|---:|---:|
| PiRC | 155 | 137 | 35,688 | 5,066 | 3,440 | 1,326 | 734 |
| SmartContracts | 276 | 275 | 603 | 41 | 106 | 0 | 5 |
| Unity Sphere | 146 | 146 | 22,148 | 926 | 678 | 1,017 | 284 |
| **Total** | **577** | **558** | **58,439** | **6,033** | **4,224** | **2,343** | **1,023** |

Tree counts include nested archives, copied workspaces, generated artifacts and backups. They are not counts of unique production modules. The complete branch/head inventory is in [BRANCH_CENSUS.md](../integration/BRANCH_CENSUS.md).

## 2. High-priority findings

### F-01 — SmartContracts contains large-scale repeated contract bodies
The default branch has 106 Rust files but only four distinct Rust blob contents by Git object SHA. One body is repeated across 60 files, another across 25, and another across 20. Representative paths include `contracts/pirc_1/src/lib.rs`, `contracts/pirc_2/src/lib.rs`, `contracts/pirc_101/src/lib.rs`, `contracts/pirc_207/src/lib.rs`, `contracts/pirc_214/src/lib.rs`, `contracts/pirc_225/src/lib.rs` and `contracts/pirc_260/src/lib.rs`.

The inspected identity template is reused by unrelated standard numbers. The inspected asset template is also reused by unrelated standards. For example, the generic asset contract stores caller-supplied metadata, does not enforce the stored Admin role when registering, uses `unwrap()` for a missing owner, and emits no lifecycle events. These are scaffolds, not completed independent implementations of every PiRC standard.

**Required action:** build a requirements-to-contract traceability matrix; retain shared libraries where appropriate, but implement distinct behavior for each standard and add negative-path, authorization, invariant and upgrade tests.

### F-02 — Seven-layer semantic and registry mismatch
The Unity Sphere `assets/js/token_layers.js` defines Root/Red Governance, Sacral/Orange 3141, Solar/Yellow 31140, Heart/Green PiCash 3.14, Throat/Blue Bank 314, Third Eye/Indigo 314159 and Crown/Purple mined Pi. The same repository's `LIVE_MATRIX_REGISTRY.csv` lists Purple, Gold, Yellow, Orange, Blue, Green and Red contract identifiers. There is no Indigo contract entry and no Gold semantic layer in the seven chakra definitions. Therefore the two registries do not map one-to-one.

The source calculation notes define Heart/Throat as 10,000 units per Pi, 1,000 units per PiGCV and 1,000 micro per unit; Crown uses 10,000,000 micro per Pi. The statement that every colored symbol is equivalent to 1 Pi on CEX is not, by itself, a valid conversion or redemption rule for the other four layers.

**Required action:** preserve source constants as proposal metadata; make unsupported conversions explicit; do not infer prices, parity, redemption or interchangeability. Reconcile Gold vs Indigo through a versioned proposal before assigning a token contract or logo.

### F-03 — Repository status labels are not chain verification
`LIVE_MATRIX_REGISTRY.csv`, `.well-known/pi.toml`, `docs/PiRC-207-Registry-Layer-Technical-Specification.md` and the README make ACTIVE, live, official or deployed assertions and include contract/account identifiers. These are repository statements. The inspected files do not provide a complete independent verification record tying each identifier to a network, deployment transaction, deployed WASM hash, admin/issuer, metadata hash and successful readback.

The README's core account string and `assets/js/constants.js` must be normalized and checked character-for-character; the README text and constants file show a visually different character in the account string. Never silently choose one.

**Required action:** every asset must carry network, identifier type (account, contract, token issuer), canonical address, deployment transaction, code hash, metadata URI/hash, last verification time and verification evidence. Until all fields are confirmed, status must be UNVERIFIED.

### F-04 — Fabricated client-side attributes
`assets/js/stellarConfig.js` currently returns hard-coded values such as `qwf_eff: 128`, `phi_solvency: true`, and `ref_capacity: 32779800` from `getTokenAttributes()` without making a network request. This can present simulated values as live attributes.

**Required action:** remove mock values from production paths. Return explicit UNVERIFIED/UNAVAILABLE states until a verified data source is configured; include source, network, ledger/sequence, timestamp and freshness metadata for every live result.

### F-05 — Oracle authorization and data-integrity gaps
The inspected Solidity `contracts/PiRC214Oracle.sol` permits any caller to update an arbitrary asset price and does not validate source identity, quorum, units, staleness, deviation or sequence. The inspected Soroban `contracts/soroban/src/oracle.rs` only emits an event; it does not persist a price, authenticate a reporter, aggregate observations or expose a latest-price query.

**Required action:** reporter allowlist/role management, authenticated submissions, monotonic sequence, ledger timestamp, source and unit identifiers, freshness/deviation bounds, quorum aggregation, circuit breaker, signed evidence and deterministic tests.

### F-06 — Proof-of-reserves authorization and unit semantics
The inspected Solidity `contracts/PiRC225ProofOfReserves.sol` has an unrestricted `setAuditorStatus` function, so any address can authorize itself as auditor. Its reserve-vs-supply comparison does not establish that the quantities use the same asset, decimals, valuation basis or custody scope. `getCollateralGap` casts unsigned values to signed values without an explicit safe bound.

**Required action:** admin/governance-controlled auditor changes, auditor identity and revocation, asset/issuer/custodian identity, common atomic units, independent attestation evidence, freshness, liabilities and encumbrances, safe arithmetic, and explicit UNKNOWN/STALE/INSUFFICIENT states.

### F-07 — Economic models conflict
The repository includes several non-equivalent models:
- `docs/PI-STANDARD-101.md` defines internal value as live market price multiplied by a 10,000,000 QWF.
- `docs/ECONOMIC_PARITY.md` says the design is not a dual-price system and proposes a liquidity-density filter on the multiplier.
- `docs/ECONOMIC_MODEL_FORMAL.md` defines WCF, efficiency factor Phi and a reflexive stable credit recurrence.
- `docs/PiRC-207-Technical-Standard.md` states 1 Mined Pi = 10 GCV Units.
- `docs/audit/PiRC-207-Token-Layer-Color-System-and-Calculation-Mechanism.md` defines the seven color/chakra labels and unit conversions.

These statements cannot be treated as one settled economic rule without a normative precedence decision, dimensional analysis, input definitions, bounds, funding and redemption policy.

**Required action:** publish a versioned economic specification with separate market price, internal reference, merchant quote, collateral value and redeemable cash value. A model parameter is not a price promise or enforceable redemption right.

### F-08 — Cross-network and EVM/Soroban boundary is not fully specified
The repositories contain Solidity/EVM contracts, Soroban Rust contracts, Pi-specific endpoints and Stellar endpoints. Solidity contracts cannot directly call Soroban contracts; an explicit bridge/relayer or verified cross-network adapter is required. The Solidity config includes a zero-address EVM placeholder and stores Soroban-style identifiers as strings. The Pi and Stellar network passphrases, Horizon endpoints and Soroban RPC endpoints must be configured independently.

**Required action:** define network IDs, passphrases, endpoint profiles, address types, finality rules, bridge trust model, replay protection, message expiry and verification. Do not use an account Horizon endpoint to validate a Soroban contract ID.

### F-09 — Public environment files require incident response
The Unity Sphere default-branch tree contains at least 18 tracked `.env`-style files, including a root `.env` and files nested in application/service directories. Their contents were not reproduced in this audit. Treat any real credential ever committed to a public repository as compromised until rotated.

**Required action:** rotate all real credentials; inspect deployment logs and provider audit trails; remove secrets from current tracked files and Git history using an approved history rewrite; invalidate old keys; move runtime secrets to GitHub Actions secrets or a dedicated secret manager; add secret scanning and ignore rules. A new `.gitignore` does not erase previously committed values.

### F-10 — API verification endpoint invokes a local CLI with a fixed profile
The inspected `api/main.py` invokes `soroban contract invoke` using a hard-coded `--network testnet` and `--source alice`. The API key gate is useful but this fixed local identity and implicit CLI configuration are not a production signing/authorization design.

**Required action:** use a dedicated least-privilege service identity, explicit network profile, bounded request schema, safe subprocess arguments, deployment configuration validation, structured errors and audit logs. Never use a developer alias or secret key embedded in source.

### F-11 — Documentation overstates maturity
Some documents say “Official”, “Complete”, “Ready”, “Live”, “100% uptime” or “mainnet transition” while referenced files are placeholders, generic templates, future plans or unverified addresses. Example: the PiRC-214 Soroban source currently emits an event only, while its document describes a complete reference implementation.

**Required action:** use a consistent status vocabulary: PROPOSED, SPECIFIED, IMPLEMENTED, TESTED, TESTNET_VERIFIED, AUDITED, MAINNET_VERIFIED. Every status transition needs evidence links.

## 3. Source-of-truth decisions

1. PiRC owns normative proposal text, standards, economic definitions and threat models.
2. SmartContracts owns Soroban contract implementation, contract interfaces and contract tests.
3. Unity Sphere owns applications, API adapters, UI, asset metadata, indexers, operational configuration and observability.
4. A standard is not “implemented” until the implementation satisfies its acceptance tests.
5. A contract ID is not “live” until the target network, deployment transaction and deployed code hash are independently verified.
6. A logo is not an issuer credential. Display logos only with issuer/network labels and verification status.
7. OUSD remains a proposed/test-only asset until issuer, enforceable redemption, reserve custody, independent attestations, legal review and depeg controls are evidenced.
8. Chainlink is network- and execution-environment-specific. An EVM Chainlink integration is not automatically deployable on Soroban.
9. V18 must be mapped to its exact source proposal and version domain before implementation; do not conflate application, contract, network protocol and economic model versions.

## 4. Release gates

- G0: branch census and commit deduplication.
- G1: standard-to-source-to-contract traceability.
- G2: normative economic and unit definitions resolved.
- G3: code review, unit tests and invariant tests.
- G4: integration tests against explicit testnet profiles.
- G5: secret/dependency/static analysis and independent security review.
- G6: testnet deployment with transaction IDs and code hashes.
- G7: production review and governance authorization.

No G6/G7 status is claimed by this audit.


## 3. Remediation update — 2026-11-14

The following source-level corrections are included in the reviewed follow-up branch:

- Removed hard-coded `qwf_eff`, `phi_solvency`, `ref_capacity` and fabricated `ACTIVE` responses from the browser token-attribute adapter. The adapter now returns `UNVERIFIED` with null attributes until an authoritative read-back exists.
- Removed the misleading client-side list that labeled the seven user-supplied contract IDs as live on both Pi and Stellar. Network endpoints and the Pi public account identity are kept separate from contract registry evidence.
- Normalized registry claim labels to `UNVERIFIED_REPOSITORY_CLAIM`; set `verified_network_id=null` until independent Pi Testnet read-back.
- Corrected the layer catalogue's displayed ratios so it renders the actual per-layer ratio (1 or 10,000 units per Pi) instead of showing 10,000 for every layer.
- Updated labels to say "reference constant" and explicitly disclaim CEX parity, price, redemption and bank-readiness.
- Added a Node test suite for layer ratios and conversion boundaries, and connected it to the focused CI workflow.
- Added provisional local SVG artwork for the seven chakra layers plus a separate Gold-unmapped mark. Artwork is branding only and never a verification signal.

### Still open — cannot be truthfully closed by source edits alone

1. **Pi Testnet contract verification:** each intended Pi contract needs a successful Pi Testnet deployment transaction, instance read-back, WASM/code hash, admin/issuer, metadata and initialized-state evidence. Stellar Testnet transaction links are not Pi Testnet deployment proof.
2. **Gold/Indigo governance decision:** Gold is an unmapped registry entry while Indigo is a separate proposed chakra layer. No contract mapping is assigned until a versioned proposal is approved.
3. **Soroban business logic:** the inspected Unity Sphere Soroban crate currently exports only the identity module from `lib.rs`; the inspected AMM and oracle files are minimal event-emitting scaffolds, not reserve accounting or authenticated oracle implementations.
4. **Cross-repository contract completeness:** the SmartContracts audit found repeated Rust contract bodies and authorization/unit-semantics gaps in the oracle and proof-of-reserves examples. Each standard needs a requirements traceability matrix, role checks, invariants, replay protection, negative-path tests and independent review before deployment.
5. **Live ingestion:** Supabase inbox/cursor tables exist but contain zero events. A trusted server-side worker, bounded pagination, durable cursor/retry behavior and event read-back tests remain required.
6. **Portal wiring/deployment:** the canonical portal feed UI is in an open PR and the deployed Lovable UI is not confirmed to consume the new Supabase project. A green source build does not prove production provider configuration or live synchronization.
7. **Economic policy:** the layer constants and PiGold weights are proposals, not an approved settlement policy. External market price, internal reference, pool NAV, liabilities, utility fulfillment and redeemable cash must remain separate dimensions.

No contract deployment, mint, transfer, signing, or mainnet operation is authorized by this remediation.


### Pi Testnet contract-instance probe — 2026-11-14

A read-only CI probe on GitHub Actions run `43606786908` independently verified the Pi Testnet network identity at ledger `27701412`:
- RPC and Horizon passphrases both matched `Pi Testnet`.
- Soroban RPC protocol was `28`; Horizon supported protocol was `29`.
- RPC health was `healthy`; network identity result was `verified`.

The same probe called contract-instance read-back for all seven supplied contract IDs. Every result was `NOT_FOUND` on Pi Testnet at that ledger. The registry now records this exact result per contract. The supplied Stellar Expert Testnet transaction links remain a separate evidence domain; they do not establish Pi Testnet deployment.

**Operational decision:** do not point PiDEX, token balances, liquidity pools, or the ingestion worker at these seven IDs as if they were Pi Testnet contracts. They remain disabled/unverified for Pi Testnet until valid Pi Testnet deployment transaction hashes and successful contract-instance/code-hash read-back are supplied.
