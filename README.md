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
