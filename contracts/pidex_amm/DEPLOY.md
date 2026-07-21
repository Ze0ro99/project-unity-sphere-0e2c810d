# PiDEX AMM — Deploy & Verification Runbook

Standards: PiRC-101, PiRC-207, PiRC-215, PiRC-227, PiRC-251, PiRC-800.
Protocols: Soroban SDK 22.x — compatible with Stellar protocol v21–v23 and
forward-compatible with v25–v28 (no protocol-gated host functions used).

## 1. Build
```bash
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release -p pidex_amm
```
Artifact: `target/wasm32-unknown-unknown/release/pidex_amm.wasm`.

## 2. Deploy (Stellar Testnet — canonical Soroban target)
```bash
stellar keys generate --global deployer --network testnet --fund
WASM_HASH=$(stellar contract install --network testnet --source deployer \
  --wasm target/wasm32-unknown-unknown/release/pidex_amm.wasm)
CID=$(stellar contract deploy --network testnet --source deployer --wasm-hash $WASM_HASH)
stellar contract invoke --id $CID --source deployer --network testnet -- \
  initialize --admin $(stellar keys address deployer) \
             --token_a <PiRC207_LAYER_ID> --token_b <BASE_PI_SAC>
```

## 3. Pi Network compatibility
Pi Mainnet / Testnet / Testnet 2 run Stellar-Core Horizon and do **not** yet
expose Soroban RPC. Once Pi enables Soroban (tracked by PiRC-260), re-run
step 2 against Pi's RPC endpoint — the WASM is byte-identical.

## 4. ZK / BN254 (PiRC-800)
Attach a Groth16 verifier contract (bn254 pairing) via
`set_zk_verifier(<verifier_cid>)`. Verifier is deployed separately from the
`bn254_verifier` crate and shares the same protocol matrix.

## 5. Post-deploy checks
- `get_reserves` returns `(0, 0, 0)`.
- `deposit` then `swap` with `min_out` enforced; invariant `k' >= k` holds.
- `pause(true)` blocks swaps (PiRC-251 circuit breaker).
