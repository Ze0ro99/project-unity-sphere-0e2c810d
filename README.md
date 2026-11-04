# PiDEX Sovereign Matrix & PiRC Ecosystem Hub

PiDEX is the application and integration workspace for the proposed PiRC ecosystem. This is a community engineering project; it is not an official Pi Network product, exchange, wallet, bank or endorsement.

## Cross-repository ownership

| Repository | Owns |
|---|---|
| [PiRC](https://github.com/Ze0ro99/PiRC) | Standards, specifications, economic models, governance and release requirements |
| [SmartContracts](https://github.com/Ze0ro99/SmartContracts) | Soroban contract source, interfaces, storage models and contract tests |
| Unity Sphere (this repository) | PiDEX UI, application services, network adapters, APIs, asset metadata, monitoring and operations |

The integration review branch is `integration/sovereign-hybrid-ecosystem`. Original feature branches remain source material; branch names alone do not prove implementation or testing.

## Seven-layer proposal model

The source proposal in `assets/js/token_layers.js` defines:

1. Red / Root — Governance (GOV).
2. Orange / Sacral — 3141 utility reference.
3. Yellow / Solar Plexus — 31,140 utility reference.
4. Green / Heart — PiCash / 3.14 proposal.
5. Blue / Throat — institutional / banking proposal.
6. Indigo / Third Eye — 314159 premium reserve proposal.
7. Purple / Crown — mined Pi and fractions.

These are proposal/UI semantics, not official Pi Network token classes, guaranteed exchange prices or a claim that all seven are deployed assets. The existing contract matrix also contains Gold without a corresponding chakra layer. The mismatch is preserved and explicitly marked; Gold is not silently renamed Indigo.

## Asset registry API

The local read-only FastAPI router is mounted under `/v1`:

- `GET /v1/health`
- `GET /v1/networks/pi-testnet/health` — probes the configured Testnet Horizon and Soroban RPC endpoints.
- `GET /v1/assets/{network}/{assetId}/verification` — checks for a contract-instance ledger entry where a contract ID exists.
- `GET /v1/assets`
- `GET /v1/assets/{assetKey}`
- `GET /v1/assets/{assetKey}/logo`
- `GET /v1/assets/{network}/{assetId}`
- `GET /v1/assets/{network}/{assetId}/logo`
- `GET /v1/assets/{network}/{assetId}/verification`

The network-scoped registry recognizes `pi-testnet` and configures the documented Testnet endpoints (`https://api.testnet.minepi.com` for Horizon and `https://rpc.testnet.minepi.com` for Soroban RPC). The network-health route probes reachability at request time. The verification route performs a contract-instance readback; this does not prove the code hash, issuer, audit or economic claims. Logos are provisional color badges, not issuer-approved marks. All unknown evidence remains null or `UNVERIFIED`.

## OUSD status

OUSD is included as a **test-only stable-asset proposal record** to complete interface and schema coverage. No contract address, issuer, decimal precision, reserves, custody, market price, USD peg or redemption promise is asserted. Minting, redemption, transfers and market listing must remain disabled until the issuer, legal claim, reserve evidence, custody, mint/burn controls, independent attestations, redemption terms and security review are complete.

## PiDEX safety boundary

The current PiDEX page includes a local exchange simulation. A market card, chart, token logo, registry entry or contract address is not proof of a live order book, pool, on-chain swap or available liquidity. Before enabling live actions, require verified network identity, contract IDs, WASM/code hashes, token decimals, RPC readback, transaction simulation, slippage controls, pause controls and monitored testnet transactions.

## Development

Frontend:

```bash
npm install
npm run build
```

API:

```bash
python -m pip install -r requirements.txt
uvicorn api.main:app --reload
```

API tests (install `requirements-dev.txt`):

```bash
pytest tests/unit/test_asset_registry.py
```

Vercel deployment configuration is provided in `vercel.json`. Confirm the actual deployment URL and test every route after deployment; a successful local build does not prove a hosted API is reachable.

## Standards and evidence

Use explicit lifecycle states: PROPOSED → SPECIFIED → IMPLEMENTED → TESTED → TESTNET_VERIFIED → AUDITED → MAINNET_VERIFIED. Every transition requires reproducible evidence. Never mark an asset ACTIVE or verified solely because its contract ID appears in a repository file.

See `docs/api/ASSET_REGISTRY_API.md`, `assets/registry/pirc207-layer-registry.json` and the cross-repository PiRC/SmartContracts audit documents.


## Integration governance

- [Branch Intake and Risk Review](docs/integration/BRANCH_INTAKE_AND_RISK_REVIEW_2026-11-03.md)

## Economic API and release evidence
- [Economic settlement API contract](docs/integration/ECONOMIC_ENGINE_API_CONTRACT.md)
- [Soroban settlement adapter mapping](docs/integration/SOROBAN_SETTLEMENT_ADAPTER_MAPPING.md)
- [API/contract traceability matrix](docs/integration/API_CONTRACT_TRACEABILITY.md)
- [Settlement request schema](schemas/v1/economic-settlement-request.schema.json)
- [Pi Testnet1 verification runbook](docs/operations/TESTNET1_VERIFICATION_RUNBOOK.md)
- [Release evidence template](docs/operations/RELEASE_EVIDENCE_TEMPLATE.md)

## Integrated economic application architecture
- [Sovereign Economic Application Map](docs/architecture/SOVEREIGN_ECONOMIC_APPLICATION_MAP.md)
- [Economic User and Operations Flows](docs/architecture/ECONOMIC_USER_AND_OPERATIONS_FLOWS.md)

The maps distinguish external quotes, internal references, simulated values, reserve evidence and redeemable liabilities. They describe proposed application behavior and do not imply live exchange, payment, custody or banking capability.

## Omni Developer Studio and Physical Economy
- [Omni Developer Studio, PiDEX and Physical Economy Architecture](docs/architecture/OMNI_DEVELOPER_STUDIO_PIDEX_AND_PHYSICAL_ECONOMY.md)
- [Omni Capability Registry and Branch Intake](docs/integration/OMNI_CAPABILITY_REGISTRY_AND_BRANCH_INTAKE.md)

These documents define governed feature generation, RAW evidence, physical asset lifecycle, internal basket valuation, CEX/DEX market data, PiDEX arithmetic, OUSD role, oracle trust and cryptographic migration. The legacy floating-point PiDEX engine is simulation-only; do not use it for settlement.

## Unified economic and execution workflows

Unity Sphere is the application and integration plane. PiRC owns standards and economic policy; SmartContracts owns Soroban contract execution; Unity Sphere owns the Pi Developer Studio, APIs, RAW workflows, market-data adapters, PiDEX application, internal utility accounting, OUSD workflows and operations.

### Application transaction path

`User / Merchant / Agent → Identity + Policy → Typed Quote → Oracle / Registry Validation → User Approval → Network Adapter → Contract Execution → Finality Read-back → Merchant / Treasury Reconciliation → Evidence + Monitoring`

The application must distinguish a submitted transaction from a finalized transaction. UI state changes to paid/settled only after network-specific finality and read-back evidence.

### Pi Developer Studio and governed feature generation

`Capability Discovery → Versioned Catalog → Schema Composer → Approved Template → Build + Tests + Fuzz + SBOM → Sandbox Simulation → Human / Governance Review → Testnet Deployment → Code Hash + State Read-back → Registry`

Each capability carries a stable ID, semantic version, schema version, owning repository, supported network, asset scope, permissions, risk class, dependencies, evidence requirements, conformance tests and rollback plan. AI agents may discover, draft, generate from approved templates, test and open PRs. They cannot self-approve, merge protected branches, access production secrets or sign/deploy arbitrary production transactions.

### RAW and physical-asset evidence

The RAW workflow records asset identity, issuer, legal-right type, jurisdiction, title/custody references, inspection, valuation, device attestations, dispute status and evidence hashes. Physical-device claims must be signed by provisioned keys and verified against certificate/revocation state, nonce, expiry and replay policy. Hashes and QR/NFC identifiers are not proof of ownership or possession. A RAW factory is production-capable only after authorized template deployment, idempotent retry handling, registry authorization and contract code/state read-back.

### Internal utility and external markets

USD is a reporting numeraire, not an automatic redemption promise. Internal utility should use verified goods/services, fulfilment, inventory, quality and a versioned basket policy:
`I_t = sum(w_i * (verified_offer_i,t / base_offer_i)) / sum(w_i)`
`U_internal,t = U_0 * I_t`

CEX observations require venue, pair, bid/ask depth and executable VWAP. DEX observations require verified pool, reserves, fee, route, ledger/block, price impact and slippage. Composite prices require independent sources, liquidity filters, freshness, outlier policy and confidence. Do not substitute a CEX last trade or DEX mid-price for an executable quote.

### PiDEX integer settlement

For a constant-product pool:
`dx_net = floor(dx * (D-F) / D)`
`dy = floor(dx_net * reserve_out / (reserve_in + dx_net))`

All settlement uses integer atomic units, checked arithmetic, explicit rounding, minimum output, expiry, slippage limits and atomic state transitions. The legacy floating-point engine remains simulation-only until integer parity tests and network verification pass.

### OUSD internal stability model

OUSD must be explicitly classified as an internal unit of account, basket-backed utility credit or USD-redeemable liability. A governed basket unit can reduce exposure of internal goods/services prices to CEX volatility, but it does not create a USD peg or cash redemption right. A redeemable liability requires a legal issuer, segregated reserves, custody, daily reconciliation, independent attestations, disclosed redemption and insolvency treatment:
`ReserveCoverage = eligible_reserves_after_haircuts / outstanding_redeemable_liabilities`

The current OUSD reference remains test-only. Do not enable production issuance or redemption without verified issuer, reserve, custody, legal and security evidence.

### Oracle and network adapters

Each observation must bind asset pair, quote unit, integer value/scale, source, sequence, timestamp, expiry, key ID, signature and evidence hash. Verify signature, freshness, replay protection, source independence, quorum, deviation and liquidity policy. Chainlink availability is chain-specific; EVM feeds are not automatically callable from Soroban. A dedicated adapter/relayer must preserve signed evidence and be independently reviewed.

### Value, provenance and decimal invariants

Internal reference, merchant quote, external market price, accounting mark, collateral mark and redeemable liability are separate types. Do not use a generic `price` field or silently convert between them. Provenance classes such as MINED, MIGRATED, PURCHASED, EARNED, BRIDGED and ISSUED are evidence labels, not protocol-enforced properties of fungible balances.

For `d` decimals, `atomic_amount = display_amount * 10^d`. Increasing decimal precision changes granularity only; it does not multiply purchasing power or economic value. Distribution may use `B_i = D_t * w_i / sum(w_j)`, where `D_t = max(0, collected_reconciled_revenue - verified_costs - required_reserves)`. Apply eligibility first and deterministic remainder allocation so atomic units are conserved.

### Release and operational truth

Use evidence-backed states: `PROPOSED → SPECIFIED → IMPLEMENTED → TESTED → TESTNET_VERIFIED → AUDITED → PRODUCTION_VERIFIED`. Pending, queued, skipped, cancelled and rate-limited checks are not successful. Preserve environment separation, least privilege, secrets scanning, protected branches, pause controls, idempotency, incident response and reproducible build evidence. Never change Vercel or Netlify configuration merely to bypass a rate limit or pending check without an approved change.
