# PiDEX AMM — Build, Test and Deployment Runbook

## Scope and protocol context

This is a Soroban constant-product AMM reference contract with a 30 bps fee, ratio-matched liquidity deposits, proportional withdrawals, checked arithmetic, pause control and minimum-output protection.

Stellar CAP-38 (Protocol 18) introduced native constant-product liquidity-pool ledger entries and operations. The 30 bps value in this contract is its own configured AMM fee; it must not be confused with a protocol-wide fee or a Pi Network velocity setting.

## Build and test

```bash
rustup target add wasm32-unknown-unknown
cargo test --manifest-path contracts/pidex_amm/Cargo.toml
cargo build --manifest-path contracts/pidex_amm/Cargo.toml --target wasm32-unknown-unknown --release
```

## Testnet deployment gates

1. Verify the target network's Soroban RPC endpoint, network passphrase and supported protocol version.
2. Deploy the token contracts and verify their issuer/admin and decimals.
3. Deploy the AMM WASM and record the WASM hash and contract ID.
4. Initialize with two distinct, verified token contract addresses.
5. Test deposits at matching and mismatching ratios; excess amounts must remain with the provider.
6. Test swaps with min_out success and failure cases.
7. Test proportional withdrawal, pause/unpause and invariant preservation.
8. If proof-gated swaps are used, deploy the verifier, configure its address and verify that unknown commitments are rejected.
9. Publish transaction IDs, code hashes, network identity and test results.

## Protocol compatibility status

The source deployment notes previously declared SDK 22.x compatibility with protocol v21–v23 and forward compatibility with v25–v28. This branch does not contain runtime evidence proving those claims. Treat v21–v23 as documented compatibility targets and v25–v28 as unverified until the exact WASM is built and exercised against each target runtime.

Pi Mainnet/Testnet deployment is not assumed. A network must expose the required Soroban RPC and host functions before this contract can be deployed there.

## Proof-gated swap semantics

`swap_with_verified_commitment` checks that the configured verifier has recorded a commitment before executing a normal transparent swap. It does not conceal asset addresses, amounts, balances, events or transfers. It is not shielded settlement or a privacy guarantee.

The BN254 verifier's on-chain pairing feature currently fails closed and is not production-ready.
