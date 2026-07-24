# BN254 / Groth16 Verifier — Deploy & Activation Runbook

Standard: **PiRC-800**. Protocols: Soroban v22 (Stellar v21–v23) with a
byte-stable ABI forward to **v25, v26, v27, v28**.

## Modes

| Mode           | Build flag         | When to use                                        |
| -------------- | ------------------ | -------------------------------------------------- |
| Commitment     | *(default)*        | Today, on any protocol. Off-chain Groth16 + ed25519 attestation. |
| On-chain BN254 | `--features bn254` | The moment target protocol enables BN254 pairing host fns. |

## 1. Build

```bash
cargo build --target wasm32-unknown-unknown --release -p bn254_verifier
# or, once BN254 host fns are live:
cargo build --target wasm32-unknown-unknown --release -p bn254_verifier --features bn254
```

## 2. Deploy to Stellar Testnet (Pi Testnet when Soroban ships)

```bash
stellar keys generate --network testnet deployer --fund
WASM=target/wasm32-unknown-unknown/release/bn254_verifier.wasm
stellar contract optimize --wasm "$WASM"
CID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/bn254_verifier.optimized.wasm \
  --source deployer --network testnet)

stellar contract invoke --id $CID --source deployer --network testnet -- \
  initialize --admin $(stellar keys address deployer) \
             --attestor <ATTESTOR_ED25519_PUBKEY_HEX>
stellar contract invoke --id $CID --source deployer --network testnet -- \
  set_vk --vk <SERIALIZED_GROTH16_VK_HEX>
```

## 3. Wire into PiDEX AMM

```bash
stellar contract invoke --id <PIDEX_CID> --source deployer --network testnet -- \
  set_zk_verifier --verifier $CID
```

## 4. In-place upgrade to on-chain BN254 (protocol v25+)

The WASM ABI, storage keys, and entrypoints are stable across modes, so
activation is a redeploy of the new WASM under the same contract address:

```bash
stellar contract invoke --id $CID --source deployer --network testnet -- \
  update_current_contract_wasm --hash $(stellar contract install \
    --wasm target/wasm32-unknown-unknown/release/bn254_verifier.optimized.wasm \
    --network testnet --source deployer)
```

No storage migration, no re-init, no client redeploy — commitment history
is preserved.

## 5. GitHub Actions

`.github/workflows/deploy-stellar-testnet.yml` builds + deploys both
PiDEX AMM and this verifier with a single manual dispatch. Flip the
`bn254_feature` input to `true` when protocol upgrades enable BN254.
