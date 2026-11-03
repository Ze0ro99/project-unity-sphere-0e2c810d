# PiRC-800 Verifier — Deployment and Verification Status

## Current implementation status

The default build implements an **attestor-backed commitment mode**. A trusted Ed25519 attestor signs a domain-separated digest of the submitted proof and length-prefixed public inputs. The contract verifies that signature, records the commitment hash and ledger sequence, and emits a verification event.

This is not on-chain Groth16 verification. It is a single-trusted-attestor design and its security depends on the off-chain verifier, key custody, and attestor rotation/revocation procedures. It does not make PiDEX swaps private.

The `bn254` feature is deliberately **fail-closed** in this revision. It returns `HostFunctionUnavailable` because this repository does not contain a real Soroban BN254 pairing host-function binding. Do not enable it for production or describe it as an active verifier.

## Build

```bash
rustup target add wasm32-unknown-unknown
cargo test --manifest-path contracts/bn254_verifier/Cargo.toml
cargo build --manifest-path contracts/bn254_verifier/Cargo.toml --target wasm32-unknown-unknown --release
```

The feature-gated fail-closed path can be tested with:

```bash
cargo test --manifest-path contracts/bn254_verifier/Cargo.toml --features bn254
```

## Deployment gates

Before any deployment:
1. Verify the exact network, passphrase, RPC endpoint and protocol version.
2. Deploy the default commitment-mode WASM only to an explicitly approved test network.
3. Initialize with a dedicated admin and attestor public key.
4. Rotate and custody the attestor private key outside source control.
5. Test invalid signatures, malformed inputs, replay attempts and key rotation.
6. Publish contract ID, transaction ID, WASM hash and test evidence.
7. Obtain an independent cryptographic and contract security review.

## Not implemented

- Native on-chain BN254 pairing.
- Decentralized or multi-attestor quorum.
- Proof system setup / trusted setup governance.
- Private or shielded AMM settlement.
- Automatic activation on protocol upgrade.

A protocol version number alone does not activate a host function or prove compatibility.
