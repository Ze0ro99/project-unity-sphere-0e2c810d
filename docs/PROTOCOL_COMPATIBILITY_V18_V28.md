# Stellar Protocol V18 and V28 Compatibility Evidence

## Executive clarification

In this repository, **V18 refers to Stellar Protocol Version 18**, not a Pi transaction-velocity algorithm or a mechanism that accelerates token circulation.

The primary source is `stellar-protocol/core/cap-0038.md`, titled *Automated Market Makers*, marked Final and assigned Protocol Version 18. It introduced constant-product liquidity-pool ledger entries and deposit/withdraw operations. The repository also contains CAP-39, titled *Not Auth Revocable Trustlines*, which is marked Rejected; it must not be presented as an adopted protocol feature.

The 30 bps fee in `contracts/pidex_amm/src/lib.rs` is a parameter of this PiDEX reference AMM. CAP-38's protocol introduction does not mean every AMM implementation must charge 30 bps, nor does it define a Pi velocity multiplier.

## Protocol evidence matrix

| Version | Repository evidence | What can be stated | What is not established |
|---|---|---|---|
| V18 | CAP-38 final proposal | Stellar Protocol 18 introduced native constant-product liquidity pools | No Pi-specific velocity mechanism |
| V18 | CAP-39 rejected proposal | The document is present as a rejected proposal | It is not an adopted feature |
| V21–V23 | PiDEX deployment docs declare SDK 22.x compatibility | These are documented compatibility targets | No runtime test evidence is attached in this repository |
| V25 | BN254 feature documentation | The code has a feature flag and a planned host-function path | The actual pairing host function is not implemented |
| V26 | SDK pin and forward-compatibility comments | SDK 22.x is the declared build dependency | No protocol V26 integration test is supplied |
| V27 | WASM byte-stability comments | The source claims ABI/WASM stability | No reproducible comparison artifact or protocol test is supplied |
| V28 | UI previously labeled it forward-compatible; i18n says release notes awaited | V28 is mentioned in project planning | No V28 compatibility test, host-function binding or deployment evidence is supplied |

## PiDEX implications

The AMM reference contract now:
- uses a 30 bps local fee parameter;
- applies `min_out` slippage protection;
- uses checked arithmetic in reserve/share transitions;
- ratio-matches deposits to avoid unintended pool donations;
- supports proportional withdrawals;
- exposes an admin pause;
- supports a verified-commitment gate for a transparent swap.

The verified-commitment gate does not hide amounts, assets, addresses, balances or events. It is not shielded settlement.

## BN254 implications

The previous `groth16_bn254_verify` placeholder returned `true`, which could incorrectly accept a proof when the feature was enabled. The integration branch removes that stub and makes the `bn254` feature return `HostFunctionUnavailable` until a real host binding and tests exist.

The default commitment mode verifies an Ed25519 attestation from a configured trusted signer and records a commitment hash. It is not decentralized proof verification and is not a privacy layer.

## V28 release gate

A V28 compatibility claim requires:
1. authoritative protocol specification and runtime feature set;
2. correct Soroban SDK/toolchain target;
3. successful WASM build against the intended host interface;
4. integration tests against a V28-compatible local or test network;
5. contract deployment/readback and transaction evidence;
6. independent review of protocol-gated features.

Until these are available, the UI must show V25–V28 as UNVERIFIED. Do not infer support from the absence of protocol-gated calls or from a forward-compatibility comment.
