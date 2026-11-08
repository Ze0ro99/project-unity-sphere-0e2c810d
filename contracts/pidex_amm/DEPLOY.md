# PiDEX AMM — Canonical Build and Testnet Deployment Runbook

**Proposed canonical source:** [SmartContracts PR #1108 — PiDEX AMM crate](https://github.com/Ze0ro99/SmartContracts/pull/1108) (branch source: [contracts/pidex_amm](https://github.com/Ze0ro99/SmartContracts/tree/integration/pidex-amm-canonical-2026-11-08/contracts/pidex_amm)). The canonical path on main becomes authoritative only after PR #1108 is reviewed and merged.

The Unity Sphere copy is retained as a historical application-repository mirror. Contract changes must be reviewed and merged in SmartContracts first; until PR #1108 merges, the source is proposed and not yet on main. Unity Sphere adapters must pin the exact SmartContracts commit and generated contract specification.

## Scope

The canonical Soroban contract is a transparent constant-product AMM reference with a 30 bps fee parameter, ratio-matched liquidity deposits, proportional withdrawals, checked arithmetic, pause control, and minimum-output slippage protection.

Stellar CAP-38 / Protocol 18 introduced native constant-product liquidity-pool ledger functionality. It does not define a Pi velocity multiplier, and the AMM's 30 bps fee is a contract parameter rather than a network-wide protocol fee.

## Build and test

From the SmartContracts repository root:

```bash
cargo test --locked --manifest-path contracts/pidex_amm/Cargo.toml
cargo build --locked --manifest-path contracts/pidex_amm/Cargo.toml --target wasm32-unknown-unknown --release
sha256sum target/wasm32-unknown-unknown/release/pidex_amm.wasm
```

## Testnet deployment gates

1. Verify the PiRC Testnet1 network profile, exact network passphrase and supported protocol version.
2. Deploy and verify the token contracts; record issuer, decimals and code hash.
3. Build the canonical SmartContracts crate and record the WASM hash.
4. Deploy the AMM through an isolated Testnet-only signer and record the transaction and contract ID.
5. Read back the contract instance and code hash; compare with the reviewed WASM artifact.
6. Initialize with two distinct verified token contract addresses.
7. Test deposits at matching and mismatching ratios; excess amounts must remain with the provider.
8. Test swaps with min_out success and failure cases.
9. Test proportional withdrawal, pause/unpause and invariant preservation.
10. If proof-gated swaps are used, deploy and configure the verifier; unknown commitments must be rejected.
11. Publish transaction IDs, code hashes, network identity and test reports.

## Compatibility and limitations

The previous source notes declared compatibility targets, but runtime evidence for V25–V28 is not established by this repository alone. Treat V28 as UNVERIFIED until the exact WASM is tested against the intended Pi Testnet runtime and its host functions.

The BN254 pairing path fails closed until a real host binding and tests exist. The attestor-backed commitment mode is not decentralized proof verification and is not a privacy layer.

No deployment, liquidity, audit, issuer authorization, wallet-signing capability or live trade execution is implied by this runbook.
