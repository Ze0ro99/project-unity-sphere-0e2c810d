# PiDEX Sovereign Matrix & PiRC Ecosystem Hub

This repository contains application, API, integration, UI, deployment and reference-contract work associated with the proposed PiRC ecosystem. It is a community research and engineering repository; it is not an official Pi Network product or endorsement.

## Cross-repository integration

The `integration/sovereign-hybrid-ecosystem` branch is the review target for the proposed integration architecture.

- [PiRC](https://github.com/Ze0ro99/PiRC): normative standards, proposals, economic definitions and governance.
- [SmartContracts](https://github.com/Ze0ro99/SmartContracts): Soroban contract implementations, interfaces and contract tests.
- Unity Sphere: applications, APIs, network adapters, asset metadata, UI and operations.

## Seven-layer model

The source proposal in `assets/js/token_layers.js` defines Root/Red Governance, Sacral/Orange 3141, Solar/Yellow 31140, Heart/Green PiCash 3.14, Throat/Blue Banking 314, Third Eye/Indigo 314159 and Crown/Purple mined Pi. The existing `LIVE_MATRIX_REGISTRY.csv` instead lists Purple, Gold, Yellow, Orange, Blue, Green and Red contract IDs. This mismatch is documented in [Seven-Layer Source Mapping](docs/SEVEN_LAYER_SOURCE_MAPPING.md) and must be resolved through a versioned mapping proposal before the registry is treated as canonical.

## Asset registry and calculations

- [Machine-readable PiRC-207 registry](assets/registry/pirc207-layer-registry.json)
- [Exact integer unit helpers](assets/js/pirc207-layer-math.mjs)
- [Unit tests](tests/unit/pirc207-layer-math.test.mjs)
- [Asset Registry API](docs/api/ASSET_REGISTRY_API.md) — local read-only FastAPI routes under `/v1`.
- [PiRC standards coverage matrix](docs/PI_RC_STANDARDS_COVERAGE_MATRIX.md)
- Known layer logos are provisional `DRAFT` badges; no issuer logo has been verified.

Contract IDs sourced from repository files are marked UNVERIFIED until network-specific deployment transaction, code hash, issuer/admin and readback evidence are attached. Missing logos remain null rather than being fabricated.

## Verification and financial boundaries

A repository entry, logo, address string, deployment workflow or “ACTIVE” label is not independent proof of on-chain deployment. Pi Cash and Pi Bank are proposed software modules, not official Pi services or licensed banking products. No deposit, insurance, yield or redemption claim is made. OUSD is not represented as USD-backed or redeemable without an identified issuer, enforceable redemption terms, verified reserves, custody evidence, independent attestations and legal review.

## Security

The default-branch tree contains tracked `.env`-style files. Treat any real credential ever committed publicly as compromised: rotate it, review provider logs, remove it from Git history under an approved procedure, and store replacements in a secret manager. The integration branch adds ignore rules and a Gitleaks workflow; these do not by themselves remove existing tracked files or erase history. See [Security Remediation](docs/security/SECURITY_REMEDIATION.md).

## Contribution status vocabulary

Use PROPOSED, SPECIFIED, IMPLEMENTED, TESTED, TESTNET_VERIFIED, AUDITED and MAINNET_VERIFIED. Every transition requires linked evidence. Do not use “official”, “live”, “complete” or “mainnet-ready” without verifiable evidence.
