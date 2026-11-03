# Asset Registry API Contract

Status: implemented as a local read-only FastAPI router on the integration branch. A deployed URL and live Pi Testnet verification are not claimed until deployment and readback checks pass.

## Canonical routes

The FastAPI application mounts this router under `/v1`.

- `GET /v1/health` — local registry health; does not imply RPC availability.
- `GET /v1/networks/pi-testnet/health` — probes the configured Pi Testnet Horizon and Soroban RPC endpoints.
- `GET /v1/assets` — seven proposal layers, the unmatched Gold record, and the OUSD test proposal.
- `GET /v1/assets/{assetKey}` — legacy key, symbol or contract-ID lookup.
- `GET /v1/assets/{assetKey}/logo` — provisional SVG badge.
- `GET /v1/assets/{network}/{assetId}` — network-scoped lookup.
- `GET /v1/assets/{network}/{assetId}/logo` — network-scoped SVG badge.
- `GET /v1/assets/{network}/{assetId}/verification` — explicit verification evidence state.

Only `pi-testnet` is currently accepted as a registry network label. The configured endpoints are `https://api.testnet.minepi.com` (Horizon) and `https://rpc.testnet.minepi.com` (Soroban RPC), with the `Pi Testnet` passphrase. The network-health route probes reachability; it does not verify any individual contract.

## Asset identifiers

Lookup accepts the registry key (for example `heart`), a known symbol (for example `OUSD`), or an exact repository contract ID. Unknown IDs remain 404; no address is fabricated or silently reassigned.

## Seven-layer mapping

The source UI has seven layer colors, while the contract CSV lists Purple, Gold, Yellow, Orange, Blue, Green and Red. The source Chakra proposal uses Indigo instead of Gold. This mismatch remains explicit: Gold is retained as `gold-unmapped`, Indigo remains without a contract ID, and no mapping is silently changed.

## Logo policy

Served SVG files are provisional color badges for interface continuity. They are not issuer-approved logos, asset authentication, contract deployment evidence or endorsement. PiDEX must show verification state separately from the logo.

## OUSD

OUSD is a `TEST_STABLE_ASSET_PROPOSAL` record only. Contract ID, issuer, decimals, supply, reserves, custody, redemption terms and market price are null. Minting, transfer, trading and redemption remain disabled. No USD peg, reserve backing or redeemability is claimed.

## Error model

Errors use a typed `detail.code`:

- `ASSET_NOT_FOUND` / `LOGO_NOT_FOUND`: no matching local record or logo.
- `NETWORK_UNSUPPORTED`: network is not configured.
- `REGISTRY_UNAVAILABLE`: local registry is missing or invalid.
- `LOGO_ASSET_UNAVAILABLE`: registered logo file is missing.

A local metadata lookup is not a chain readback. Never turn an upstream 404 into a fabricated success. The network-health route is a connectivity probe only; contract IDs still require contract-specific readback.

## Deployment

The frontend uses Vite and the API uses FastAPI. `api/index.py` exposes the ASGI application for serverless hosting, root `requirements.txt` declares the runtime dependency, and `vercel.json` routes `/v1/*` to the Python function. Verify the actual Vercel deployment after pushing this branch; configuration alone does not prove that hosted routes are available.

## PiDEX requirements

1. Load token metadata and logos from the network-scoped routes.
2. Display `UNVERIFIED` until network-specific contract readback, issuer/admin and code-hash evidence are recorded.
3. Keep simulated order books and local demo balances clearly labeled.
4. Do not enable swaps, deposits, withdrawals or mint/burn based only on registry metadata.
