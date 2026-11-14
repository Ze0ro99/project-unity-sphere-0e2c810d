# PiDEX AMM — Canonical Build and Testnet Deployment Runbook

**Canonical source:** [SmartContracts `contracts/pidex_amm`](https://github.com/Ze0ro99/SmartContracts/tree/main/contracts/pidex_amm). The canonical crate was merged by [PR #1108](https://github.com/Ze0ro99/SmartContracts/pull/1108) on 2026-11-08 (merge commit `2bca4658f58dc097085f1956d87a5f7f3b756a05`). The merged source is authoritative; this Unity Sphere copy is a historical application-repository mirror.

Contract changes must be reviewed and merged in SmartContracts first. Unity Sphere adapters must pin the exact SmartContracts commit and generated contract specification. Do not deploy from the mirror. The merge of source code is not deployment evidence.

## Scope

The canonical Soroban contract is a transparent constant-product AMM reference with a 30 bps fee parameter, ratio-matched liquidity deposits, proportional withdrawals, checked arithmetic, pause control, and minimum-output slippage protection.

Stellar CAP-38 / Protocol 18 introduced native constant-product liquidity-pool ledger functionality. It does not define a Pi velocity multiplier, and the AMM's 30 bps fee is a contract parameter rather than a network-wide protocol fee.

## Build and test

From the SmartContracts repository root, using the canonical source in `main`:

```bash
cargo test --manifest-path contracts/pidex_amm/Cargo.toml
cargo build --manifest-path contracts/pidex_amm/Cargo.toml --target wasm32-unknown-unknown --release
sha256sum target/wasm32-unknown-unknown/release/pidex_amm.wasm
```

## Current verification status (2026-11-08)

- PR #1108 is merged and the canonical crate exists in SmartContracts `main`.
- The original PR check set included a workspace test failure in the unrelated `pirc-test-asset` allowance test; the stale assertion expected total supply 375 after a 100-unit transfer and a 25-unit burn. The corrected expectation is 475 because transfers do not reduce total supply.
- The SmartContracts reference-contract workflow did not previously include `pidex_amm` in its focused test matrix. [PR #1114](https://github.com/Ze0ro99/SmartContracts/pull/1114) adds the AMM and test-asset crates to that test/build gate; deployment remains separate.
- No Pi Testnet AMM deployment, token pair, liquidity pool, or live trade is established by the merged source PR.

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
