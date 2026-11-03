# Integration and API Truth Policy

## Network boundaries
Keep Pi Mainnet, Pi Testnet, Pi Testnet 2, Stellar Mainnet and Stellar Testnet as separate named environments. Each environment must pin its network passphrase, Horizon URL, Soroban RPC URL (if supported), contract registry and asset registry. Never use a generic fallback that silently changes network context.

## Horizon versus Soroban RPC
Horizon account endpoints resolve account StrKeys (G...). Soroban contract IDs (C...) are not account IDs and must not be validated by `/accounts/{id}`. A Horizon 404 for a C... identifier is expected to be inconclusive. Contract verification requires the correct Soroban RPC and contract-data/instance proof. If the selected Pi environment does not expose Soroban RPC, return `UNVERIFIABLE_ON_TARGET_NETWORK`, not `NOT_DEPLOYED`.

## Asset and logo registry
Every asset record must include:
- `asset_id`, `symbol`, `name`, `network_id`, `asset_type`
- issuer account or contract ID, canonical decimals and supply model
- verified metadata URI and logo hash
- verification state and evidence reference
- price source, timestamp, confidence and freshness
- deployment transaction and code hash when applicable

Do not infer asset legitimacy from logo, ticker, address shape or an arbitrary registry row. Unknown or unverified assets must be visibly marked and excluded from default trade routes. Never substitute a generated logo for canonical issuer metadata.

## PiDEX execution modes
The current inspected `src/lib/exchange.ts` seeds pseudo-random local candles and client-side exchange state. Until wallet authorization, transaction signing, network submission, finality tracking, settlement reconciliation and indexer evidence are implemented, this is SIMULATION mode. Simulated orders, fills, balances and transaction hashes must never be presented as live trades.

## Market data
The UI invokes Supabase Edge Function `market-index`. Live mode requires a deployed function, configured venue adapters, credentials stored server-side, source timestamps, quote normalization, outlier rejection, quorum, freshness and observability. If no trusted result exists, render unavailable rather than a stale or seeded price.

## API error contract
Return stable machine-readable errors with request IDs:
- `NETWORK_MISMATCH`
- `UNSUPPORTED_CAPABILITY`
- `RPC_UNAVAILABLE`
- `RESOURCE_NOT_FOUND`
- `INVALID_STRKEY`
- `CONTRACT_STATE_UNVERIFIABLE`
- `STALE_ORACLE_DATA`
- `NO_ORACLE_QUORUM`
- `ASSET_UNVERIFIED`
- `SETTLEMENT_PENDING`
- `SETTLEMENT_FAILED`

A 404, timeout, RPC transport failure, unsupported endpoint and invalid identifier are different states and must not be collapsed into one message.

## Pi SDK and payments
Pi SDK authentication and payment callbacks are not proof of settlement by themselves. Server-side approval/completion must validate the payment identifier, user, amount, memo, metadata and transaction ID, and reconcile the chain transaction before marking the order settled. Never trust client-supplied access tokens or payment completion claims without server-side validation.

## Secret handling
Never commit private keys, seed phrases, service-role keys, oracle credentials or production tokens. Vite `VITE_*` variables are bundled into browser code and must be treated as public. Audit tracked `.env` files and rotate any exposed credentials. Keep only sanitized `.env.example` templates in Git.

## Protocol compatibility
Record network protocol version, Soroban SDK version, Rust toolchain, WASM target and host-function availability separately. “Forward compatible” is not a test result. For v28, require an explicit CI/testnet matrix proving compilation, deployment, invocation, resource budgets and storage behavior on the named environment.
