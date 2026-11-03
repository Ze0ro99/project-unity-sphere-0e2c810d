# Asset Registry API Contract (Proposed)

Status: IMPLEMENTED as a local read-only FastAPI router on the integration branch. Deployment URL and live chain verification are not claimed.

## Canonical endpoints

Mounted by `api/main.py` under `/v1`. Configure `window.PI_ASSET_REGISTRY_API_BASE` in the frontend when the API is hosted on a separate origin. The registry returns eight records (seven proposal layers plus the unmatched Gold registry entry). Known logo routes return clearly marked provisional SVG badges; they are not issuer-approved logos.


- `GET /v1/health` — service and upstream dependency health.
- `GET /v1/assets?network={network}&status={status}` — paginated asset list.
- `GET /v1/assets/{network}/{assetId}` — canonical asset metadata and verification record.
- `GET /v1/assets/{network}/{assetId}/logo` — logo metadata or binary asset after issuer review.
- `GET /v1/assets/{network}/{assetId}/verification` — deployment and readback evidence.

## Asset response

Required fields: `schema_version`, `asset_id`, `asset_type`, `network_id`, `issuer`, `contract_id`, `symbol`, `name`, `decimals`, `logo_uri`, `metadata_hash`, `deployment_tx`, `deployed_code_hash`, `verification_status`, `verified_at`, `source`, `updated_at`.

Missing evidence must be null and status must be UNVERIFIED. A logo must not be treated as proof of issuer identity.

## Error model

Use JSON errors with `code`, `message`, `request_id`, `network_id` and `retryable`.

- `ASSET_NOT_FOUND` — valid endpoint, no asset record.
- `ENDPOINT_NOT_FOUND` — route is not implemented or wrong base URL.
- `NETWORK_UNSUPPORTED` — requested network is not configured.
- `INVALID_ASSET_ID` — identifier type/format does not match the selected network.
- `UPSTREAM_UNAVAILABLE` — RPC/Horizon dependency failed.
- `UPSTREAM_RESOURCE_NOT_FOUND` — upstream returned a resource-level 404.
- `UNVERIFIED_ASSET` — record exists but deployment/issuer evidence is incomplete.
- `STALE_VERIFICATION` — evidence exceeds the configured freshness window.

Never turn an HTTP 404 into a fabricated success response or a hard-coded ACTIVE status.

## Network separation

Pi Horizon, Pi Soroban RPC, Stellar Horizon and Stellar Soroban RPC are distinct adapters. Store network passphrase, endpoint, address type and contract ID per environment. Do not use an account endpoint to validate a Soroban contract ID. No endpoint should be considered active until a health/readback test has been run against it.
