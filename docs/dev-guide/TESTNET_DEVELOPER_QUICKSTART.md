# PiRC Testnet Developer Quickstart

**Status:** Source-integrated capability discovery API. Runtime deployment and app registration are not yet verified.

## 1. Network profile

Use the explicit Pi Testnet profile:

- Network ID: `pi-testnet1`
- Display name: `Pi Testnet`
- Project alias: `Testnet1`
- Horizon: `https://api.testnet.minepi.com`
- Soroban RPC: `https://rpc.testnet.minepi.com`
- Network passphrase: `Pi Testnet`

Do not substitute Stellar Public Testnet endpoints. Mainnet writes are disabled in this integration.

## 2. Discover capabilities

The API exposes read-only catalog routes:

- `GET /v1/developer/capabilities`
- `GET /v1/developer/capabilities/{capability_id}`

Example:

```ts
const response = await fetch(
  `${API_BASE_URL}/v1/developer/capabilities`,
  { headers: { Accept: "application/json" } },
);

if (!response.ok) {
  throw new Error(`Capability discovery failed: ${response.status}`);
}

const catalog = await response.json();
// Render capability status exactly as returned.
// Do not enable a write action based on catalog presence.
```

The catalog is metadata for discovery and integration planning. It does not issue API keys, register an application, grant wallet permissions, or authorize contract calls.

## 3. Current capability boundaries

| Capability | Current state | Permitted use |
|---|---|---|
| Asset registry | Source implemented; runtime unverified | Read repository metadata and verification status |
| Pi wallet identity | Implemented; Pi Browser runtime test required | Pi Platform authentication and wallet-address binding |
| Economic engine | Client-side simulation only | Clearly labeled model scenarios |
| PiDEX AMM | Source present; tests pending; no deployed pool | Local/test simulation only |
| Soroban settlement | Manual Testnet deployment gate | Testnet-only after protected signer and explicit approval |
| Soroban events | Raw ingestion only | Store raw events; do not infer settlement |
| Developer app registration | Not implemented | No self-service credentials |
| RAW contract factory | Proposed specification only | No arbitrary contract deployment |

## 4. Pi wallet integration

Use the official Pi SDK inside Pi Browser or Pi Sandbox. Request only the scopes required by the feature. The current Unity Sphere wrapper verifies the access token server-side with Pi Platform `/me` and binds the returned wallet address.

Important distinctions:

- `username` and `wallet_address` authentication does not grant Soroban signing.
- Pi Wallet submission requires a pre-signed XDR; the SDK does not build or sign Soroban transactions.
- Never put a private key, seed phrase, Pi API key, or deployer secret in browser code.
- Native Test Pi balance is a read-only account lookup. It is not a custom asset balance or proof of contract deployment.

## 5. Economic and PiDEX integration

The client-side economic module is a simulation engine. Its outputs are not authoritative prices, collateral, reserves, issuance, balances or settlement outcomes.

Before enabling a live PiDEX action, the integration must have:

1. A verified Pi Testnet contract ID and deployed WASM code hash.
2. A read-back of pool reserves, fee configuration and asset metadata.
3. Integer atomic-unit arithmetic and checked rounding.
4. A supported wallet authorization and transaction-submission path.
5. Finality confirmation, event decoding and state reconciliation.
6. App-scoped authorization, rate limits, quotas and auditable request IDs.

A quote, simulation fill, UI balance or raw event is not a settled trade.

## 6. Testnet deployment

The canonical settlement deployment workflow is manual-only. It requires the dedicated `PI_TESTNET_DEPLOYER_SECRET` in the protected GitHub Environment named `pi-testnet`, successful build/tests, and explicit workflow input approval.

The issuer account listed in the PiRC registry is not a contract ID and its public address is not a signing secret. Do not ask developers to share seeds or use a shared deployer key.

## 7. Application onboarding still required

A production developer platform needs a persistent application registry with:

- verified owner identity and per-app client identity;
- separate Testnet credentials and revocation;
- explicit capability grants and contract allowlists;
- rate limits, quotas and fee caps;
- versioned schemas, ABI and SDK releases;
- per-app audit logs and request idempotency;
- isolated test data and webhook subscriptions;
- deployment approval and code-hash readback.

Until that service is implemented and deployed, application registration and write capabilities remain disabled. Developers may use the read-only catalog and repository documentation to prepare integrations, but must not claim that an app is linked or authorized.

## 8. Evidence required for release

For each enabled capability, publish the network, contract ID, deployment transaction, WASM hash, initialized-state readback, authorization test results, event/finality evidence, timestamp and reviewer. Unknown evidence remains `UNVERIFIED`.
