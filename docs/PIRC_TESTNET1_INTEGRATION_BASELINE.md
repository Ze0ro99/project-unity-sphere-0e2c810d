# PiRC Cross-Repository Testnet1 Integration Baseline

**Status:** Integration baseline and release gate. This document does not claim that contracts are deployed, wallets can sign Soroban transactions, assets are synchronized on-chain, or PiDEX trades settle on-chain.

## 1. Repository ownership

| Repository | Source of truth | Integration responsibility |
|---|---|---|
| [PiRC](https://github.com/Ze0ro99/PiRC) | Normative proposals, standards, economic rules, governance, schemas, network profiles and release gates | Versioned standards, canonical schemas, feature acceptance criteria and branch intake |
| [SmartContracts](https://github.com/Ze0ro99/SmartContracts) | Soroban contract source, ABI, storage, authorization, events, contract tests and reproducible WASM | Canonical contract implementations and testnet deployment evidence |
| [Unity Sphere](https://github.com/Ze0ro99/project-unity-sphere-0e2c810d) | Portal, Pi SDK integration, APIs, network adapters, PiDEX UI, asset registry views, event ingestion and operations | Consume pinned schemas/ABIs and expose evidence-backed workflows |

Do not copy every PiRC branch into application code. The PiRC branch census and implementation traceability matrix require unique-head deduplication, risk review, owner mapping, tests and coordinated PRs. Preserve branch history; accept compatible changes selectively.

## 2. Network profile: Pi Testnet (project alias Testnet1)

The PiRC profile defines these endpoint references:

- Horizon: `https://api.testnet.minepi.com`
- Soroban RPC: `https://rpc.testnet.minepi.com`

Testnet1 is a project alias for the Pi Testnet profile, not a separate chain identity. The runtime must verify the live Horizon and Soroban network passphrase and protocol version against operator-supplied configuration. A successful HTTP response is connectivity only.

Required server-side configuration:

| Variable | Required behavior |
|---|---|
| `PI_NETWORK` | Must equal `testnet`; all other values block writes |
| `PI_HORIZON_URL` | Approved Pi Testnet Horizon endpoint |
| `PI_SOROBAN_RPC_URL` | Approved Pi Testnet Soroban RPC endpoint |
| `PI_NETWORK_PASSPHRASE` | Exact verified passphrase; no guessed default |
| `PI_PROTOCOL_EXPECTED` | Explicit compatibility target; PiRC profile initially specifies 28 |
| `PI_CONTRACT_ID_*` | Network-specific, allowlisted contract IDs |
| `PI_SIGNER_PROVIDER` | Isolated signer provider; never browser storage |
| `PI_SIGNER_CREDENTIAL_REF` | Secret-manager reference, never the secret value |
| `PI_DEPLOYMENT_ALLOWLIST` | Explicit contract package allowlist |

The updated `api/network_adapters.py` now:
- refuses non-Testnet configuration and non-approved endpoint hosts;
- queries Horizon root plus Soroban `getNetwork`, `getHealth`, and `getLatestLedger`;
- requires the configured passphrase to match both Horizon and Soroban RPC;
- checks the Soroban RPC runtime protocol against the exact target and requires Horizon's supported-protocol capability to be at least that target (Horizon's supported maximum is not treated as the active Soroban runtime version);
- reports `reachable_unverified`, `identity_mismatch`, `degraded`, or `verified` rather than treating reachability as identity proof;
- remains read-only and never signs, submits, deploys, mints, burns, or transfers.

The adapter is not considered operationally verified until its tests pass and the deployed environment contains the required configuration. If Pi Testnet does not expose the configured Soroban RPC methods, the system must remain blocked rather than silently using Stellar public Testnet or Pi Mainnet.

### Live read-only probe — 2026-11-08

The PiRC focused validation workflow verified the configured Pi Testnet identity:
- Horizon and Soroban RPC were reachable.
- Both passphrase checks matched the explicit test value `Pi Testnet`.
- Soroban RPC reported a healthy status and protocol 28.
- Horizon reported supported protocol 29.
- Latest ledger observed: `27,596,965`.

The same read-only run queried the seven contract IDs currently listed by the Unity asset registry. Every one returned `NOT_FOUND` on this Pi Testnet profile:

| Registry key | Contract ID | Readback |
|---|---|---|
| root | `CC6WMAHKOPWY6HW46VNKTAV4DZZLRTTNMYLDEKCAICQGMCWV5PZYNTBO` | NOT_FOUND |
| sacral | `CB7T6TDSZ5B2MQI7NI4EG6ZASYPRMJ3XVUWS6BON4Z64OBMUJ4ZD6GKF` | NOT_FOUND |
| solar | `CANLSQUPUZYKE3S2HAIGXAHMOQWE4FVX5DS7GTL42BVKSNHLFVMQSDFF` | NOT_FOUND |
| heart | `CBPG33E7RUX6MGU65IMM4HXCAGLA4OZRBOUWKQSBTIZWE2RD52VGWDT4` | NOT_FOUND |
| throat | `CAMSQZTSCTF3MG4UEIAWKRZNSX7LLKGKXMVBEQO2ETVPGS3CINM7JBQD` | NOT_FOUND |
| crown | `CCGEMIEAZFJSBTRL5VGJJAUGPJI3B7UQ3BTAB2OQGW73JMWLS57YVVA4` | NOT_FOUND |
| gold-unmapped | `CD3UAUN4FU3VHPMLOZWFQWJ2UBUUBBD37SZ7WBEGJQACJ7YF6QVE2SYG` | NOT_FOUND |

This is direct evidence that these seven registry references are not deployed contract instances on the verified Pi Testnet at the time of the probe. They must not be shown as active token contracts, wallet balances, reserves or tradable assets. The registry must keep them UNVERIFIED until canonical contracts are deployed and read back. The probe does not establish that no other assets exist on the network.

## 3. Pi account and wallet connection

The Pi SDK integration now requests `username` and `wallet_address` for normal connection. The browser sends only the access token to the backend; the Edge Function verifies it through Pi Platform `/me` and returns the server-verified UID, username and wallet address when present. It defers the `payments` scope until the user explicitly starts a payment. The connection state is shared between the global header and PiDEX so both surfaces display the same authenticated account and verified wallet address.

Important capability boundary:
- A verified Pi Platform account and returned `wallet_address` bind a Pioneer to an address.
- They do not expose the user's private key and do not authorize arbitrary Soroban transaction signing.
- Pi Platform payments use the separate `Pi.createPayment` and server approval/completion lifecycle.
- The PiDEX UI therefore displays the connected address but continues to label order entry, balances, fills and liquidity as local simulation until a real wallet-signing and settlement adapter is independently implemented and verified.

The Pi SDK's `wallet_address` permission and payment scopes are defined in the [official Pi Client SDK reference](https://developers.minepi.com/docs/api-reference/SdkReference).

## 4. PiDEX execution boundary

Current components and status:

| Component | Current source | State | Remaining proof |
|---|---|---|---|
| PiDEX order entry, balances, fills and LP state | `src/lib/exchange` | Local simulation | Must be replaced or backed by verified on-chain reads/writes |
| Price, order-book and trade observations | Netlify market functions | Off-chain venue data | Source timestamps, venue availability, normalization and clear non-executable quote labels |
| PiDEX AMM | `contracts/pidex_amm` in Unity Sphere | Soroban reference contract | Canonical ownership in SmartContracts, compile/test, deploy, token addresses, code hash and readback |
| PiDEX core subscription gate | `contracts/pidex_core` | Previously returned unconditional success | This branch changes the stub to fail closed and adds a denial test; actual PiRC-2 cross-contract call remains unimplemented |
| PiRC-2 subscription | SmartContracts reference contracts | Contract/interface compatibility unresolved | Pin the canonical ABI, contract ID and SDK, then test cross-contract authorization |
| Wallet address | Pi SDK `wallet_address` scope | Account-to-address binding | Does not sign Soroban transactions |
| Settlement | SmartContracts canonical settlement contract | Not end-to-end verified | Shared golden vectors, transaction, event decode, contract readback and digest reconciliation |

**Do not enable live PiDEX orders, deposits, withdrawals, swaps or LP operations** until the wallet signing path, deployed AMM, token contracts, liquidity, slippage checks, authorization, and read-back reconciliation all pass Testnet acceptance tests.

## 5. PiRC standards intake and mapping

PiRC is the normative source. The application must pin a specific schema and standards revision for each capability rather than infer behavior from branch names.

Priority integration domains:

1. PiRC-101 monetary/base-pair rules and integer denomination.
2. PiRC-207 registry, seven-layer taxonomy, token lifecycle and issuer metadata.
3. PiRC-208 AI capability boundaries and anomaly observations.
4. PiRC-209 identity and verifiable credential interfaces.
5. PiRC-210 cross-ledger portability and bridge safety.
6. PiRC-211 risk analytics and cross-chain risk controls.
7. PiRC-211.5 compliance and eligibility controls.
8. PiRC-212 governance and proposal execution.
9. PiRC-213/224 RWA tokenization and provenance.
10. PiRC-214 oracle observation, freshness and quorum semantics.
11. PiRC-215/227 AMM, liquidity, slippage and market integrity.
12. PiRC-216/238 risk and liquidation controls.
13. PiRC-218/240 yield and treasury rules.
14. PiRC-220/252 treasury and reserve accounting.
15. PiRC-222/246 custody and escrow controls.
16. PiRC-225 proof-of-reserves attestation.
17. PiRC-231/232 lending and liquidation.
18. PiRC-233/234 synthetic assets.
19. PiRC-244/245 CBDC and settlement batching.
20. PiRC-254/255 circuit breakers and catastrophic recovery.
21. PiRC-260 registry/keeper coordination.
22. PiRC-800 proof/attestor capability boundaries.

This is a prioritized intake map, not a claim that all listed standards are fully implemented. Every standard still needs a traceability row, implementation owner, tests, ABI/schema pin, network evidence and security review.

### Seven-layer taxonomy conflict

PiRC's main README defines the seven conceptual colors in this order: Red, Orange, Yellow, Green, Blue, Indigo, Purple. The current Unity Sphere layer registry uses a different L0–L6 ordering and contains a separate Gold registry entry, while Indigo has no matching contract in the live matrix registry.

This conflict is preserved, not silently rewritten. A versioned registry migration must:
- identify the normative PiRC registry revision;
- map every old layer ID, color, role, asset key, contract ID and logo;
- classify Gold as unresolved until governance approves a migration;
- retain Indigo as a distinct proposal until an issuer and contract are verified;
- provide backwards-compatible API aliases and migration tests;
- reject assets whose network, issuer or contract identity does not match.

Until this is approved, all layer contract IDs and issuer claims remain `UNVERIFIED`.

## 6. Smart-contract source and ABI gates

The SmartContracts audit records substantial repeated Rust source templates across numbered crates. Directory counts are not implementation coverage. Only independently implemented, tested and reviewed modules may be treated as functional contracts.

The repository contains an economic settlement implementation and a separate alternate crate. The event-consumer specification identifies `contracts/pirc_economic_settlement` as the canonical settlement ABI. Unity Sphere must pin that crate's exact commit and generated interface; it must not integrate the alternate `contracts/economic_settlement` by assumption.

Before any contract is activated:
- pin the exact source commit and Soroban SDK/toolchain;
- compile and run unit, property and adversarial tests;
- export and compare contract spec/ABI with the Unity adapter;
- build reproducible WASM and record SHA-256;
- deploy only an allowlisted crate to the verified Pi Testnet;
- record deployment transaction, contract ID and code hash;
- read back instance, code hash, initialized state, admin and issuer;
- run positive and negative authorization tests;
- independently review findings and remediation.

## 7. Event and asset synchronization

The current `pirc-soroban-event-ingest` function is a bounded raw-event inbox. It stores events and advances a durable cursor; it does not decode XDR or prove settlement finality.

The next event pipeline must:
1. validate the network identity and configured contract ID;
2. preserve raw event payloads and source cursor;
3. decode only the canonical contract ABI;
4. quarantine unknown topics, malformed XDR and mismatched contract IDs;
5. verify transaction status and successful finality;
6. call the canonical contract read method;
7. compare persisted state and settlement digest with event data;
8. update a versioned projection idempotently;
9. expose reconciliation status and lag metrics.

Asset synchronization must be network-scoped. Each asset record needs the network ID, asset/contract ID, issuer, decimals, metadata hash, source transaction, ledger sequence, code hash where applicable, verification timestamp and evidence state. Repository registry metadata, logos, CEX prices and a Horizon account response must never be promoted to a verified token balance or reserve.

## 8. Protocol and upgrade compatibility

- Stellar Protocol 18 / CAP-38 refers to native constant-product AMM ledger functionality; it is not a Pi token-velocity multiplier.
- Protocol V28 support remains unverified until the exact target runtime, SDK, WASM, host functions and Testnet execution are exercised.
- Pi protocol version, Soroban SDK version, contract interface version, schema version and application release version must be tracked independently.
- Every upgrade requires a compatibility matrix, reproducible artifacts, migration tests, rollback plan and testnet readback.
- No automatic Mainnet promotion is permitted.

## 9. Current branch changes and tests

This integration branch contains:
- fail-closed Pi Testnet network identity checks in `api/network_adapters.py`;
- unit tests for verified, missing-passphrase, invalid-network and endpoint-host cases;
- shared Pi account state across the header and PiDEX;
- Pi wallet address permission for normal connection and deferred payment permission;
- a PiDEX wallet identity panel with explicit disclosure that it does not enable Soroban signing;
- a fail-closed PiDEX core subscription placeholder instead of unconditional trade authorization;
- a denial test for that placeholder.

These changes are source edits only until CI and deployment evidence are available. They do not deploy contracts or activate Testnet trading.

## 10. Release gates

- [ ] TypeScript build and frontend tests pass on this exact commit.
- [ ] Python adapter unit tests pass in the deployed API runtime.
- [ ] Pi Developer Sandbox authentication returns a verified UID and wallet address.
- [ ] Real Pi Browser authentication is tested separately with sandbox disabled.
- [ ] Pi payment flow is tested separately and only after explicit user action.
- [ ] Pi Testnet Horizon and Soroban network identity both match the configured passphrase and protocol.
- [ ] Every required contract compiles, passes tests and is deployed with matching WASM readback.
- [ ] Seven-layer registry migration is approved and all asset IDs/issuers are reconciled.
- [ ] PiDEX uses real verified token contracts and a supported wallet signing flow.
- [ ] AMM deposits/swaps/withdrawals pass Testnet tests with slippage and invariant checks.
- [ ] PiRC-2 subscription checks use the canonical deployed ABI; no unconditional authorization path remains.
- [ ] Event decoding, transaction finality, state readback and digest reconciliation pass replay tests.
- [ ] PiDEX simulation labels are removed only after on-chain execution is proven.
- [ ] Lovable deployment commit and Pi Browser listing are checked independently.
- [ ] Mainnet remains disabled and requires a separate explicit release approval.
