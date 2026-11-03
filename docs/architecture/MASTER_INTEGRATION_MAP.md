# Unity Sphere — Application and Integration Architecture

## Responsibility
Unity Sphere is the application and integration plane: PiDEX UI, proposed Pi Cash workflows, proposed Pi Bank/Treasury console, merchant interfaces, API gateway, network adapters, oracle ingestion and monitoring.

## Service boundaries
- network-gateway: environment-specific Pi and Stellar adapters.
- asset-registry-api: canonical asset metadata and verification status.
- pidex-api: quotes, pools, routes and transaction status; never fabricate prices.
- pi-cash-api: payment intents, merchant invoices and reconciliation.
- treasury-api: reserve reporting by default; privileged actions require multisig.
- oracle-ingestion: source adapters, normalization, freshness and quorum.
- economic-engine: fixed-point quote calculations and simulations.
- identity-policy: authentication, authorization and privacy-preserving claims.

## Seven-layer UI tokens
Use layer.network, layer.payments, layer.treasury, layer.assets, layer.economics, layer.oracle and layer.governance as design tokens. Pair color with text and icons for accessibility; never communicate verification by color alone.

## API behavior
Return typed errors with stable codes and request IDs. Distinguish resource-not-found from unsupported endpoint, wrong network, invalid identifier and RPC transport failure. Cache only with explicit freshness policy. Never use account lookup to validate a Soroban contract ID. Include network and environment in every response. Never expose secrets, private keys or raw identity documents.

## Asset logos
Use trusted, versioned metadata or locally reviewed assets. A logo is not issuer authentication. Display network, issuer/contract, verification state, price source and last-updated time.

## Pi Cash and Pi Bank UX
Pi Cash is a proposed payment application module. Pi Bank is a proposed treasury console, not a licensed bank product. Do not claim insured deposits, guaranteed returns or redeemable USD without legal and technical evidence.

## Observability
Use structured logs with operation IDs and metrics for RPC/API availability, confirmation latency, oracle freshness, failed settlements and reconciliation drift. Never log credentials, seed phrases, private keys or sensitive personal data.
