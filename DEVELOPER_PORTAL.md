# PiRC Developer Portal

## Purpose

This portal describes the current integration contract for applications that want to discover PiRC assets, display verified Testnet status, and prepare user-authorized operations. It distinguishes implemented behavior from architecture proposals and deployment evidence.

## Current network scope

- Supported validation target: **Pi Testnet**.
- Network passphrase: `Pi Testnet`.
- Soroban RPC: `https://rpc.testnet.minepi.com`.
- Testnet assets have no real-world monetary value. Testnet evidence must not be presented as Mainnet deployment or production liquidity.

## Integration lifecycle

1. Register the application and its requested asset/pool references.
2. Resolve contract identifiers only through the canonical asset registry.
3. Validate the registry against `schemas/asset-contract-registry.schema.json`.
4. Confirm network identity and read contract state using read-only RPC methods.
5. Verify contract ID, WASM hash, interface version, authorization policy, deployment transaction, and independent readback evidence.
6. Run deterministic simulations and contract tests against the exact artifacts.
7. Require explicit human approval before any Testnet signing or deployment action.
8. After an approved deployment, record transaction evidence and independently read back the deployed state.

An absent, stale, mismatched, or incomplete record is `UNKNOWN` or `UNVERIFIED`, never `ACTIVE`.

## Asset and product listings

A product listing is descriptive application data. Listing a product does not automatically tokenize it, create a token, transfer ownership, establish a lien, or prove legal title. Any asset tokenization requires a separately reviewed contract, issuer authorization, provenance evidence, legal review, and explicit transaction approval.

## Rewards and incentives

There is no assumed or automatic 5,000-token onboarding reward. Rewards may be shown only when a versioned policy, funded source, eligibility evidence, authorized contract, and confirmed ledger event exist. A proposed reward or accounting allocation is not a token transfer.

## Payments and external rails

The repository does not establish automatic Visa/card conversion, payment-provider connectivity, or an automatic swap into a native token. Any card or fiat integration requires an identified payment provider, KYB/merchant onboarding, applicable PCI and regulatory controls, an explicit quote, user authorization, and independently verified settlement evidence.

A displayed exchange rate is informational unless it is backed by a current, policy-compliant oracle observation. A quote must disclose its source, timestamp, asset pair, fee, slippage limit, and expiry. Missing or stale pricing must fail closed.

## Identity, compliance, and audit claims

Application logs may record event source, timestamp, product reference, and transaction identifiers. Logging alone does not establish AML compliance or satisfy a jurisdiction's legal requirements. KYC/KYB, AML, privacy, consumer-protection, and reporting obligations must be assessed with the relevant licensed providers and qualified counsel.

Never expose private keys, validation credentials, signing material, or secret environment values in the portal, client bundle, registry, or repository.

## PiGold and liquidity boundaries

PiGold is specified as a non-custodial route coordinator over independently accounted pair-specific pools. It is not a shared custody wallet, a pooled reserve, an issuer, or an automatic cross-layer conversion rail. Each pool retains its own contract identity and reserve-accounting identifier.

The existing pair-specific `pidex_amm` contract is a pool adapter candidate; it is not by itself a multi-asset coordinator. Economic settlement records accounting allocations and does not, by itself, execute token transfers.

## Implementation status

The registry schema and PiGold architecture document are specifications. They do not prove that a PiGold coordinator, asset, pool, payment gateway, reward contract, or application integration has been deployed. Only independently verifiable Testnet readback evidence may advance a registry entry to `verified`.

## Developer checklist

- [ ] Use the canonical registry; do not hardcode contract addresses by symbol.
- [ ] Keep each asset and pool's reserves and accounting identifiers isolated.
- [ ] Use integer atomic units and versioned basis-point policies.
- [ ] Enforce eligibility gates before applying weighted allocation.
- [ ] Use independent oracle sources, median aggregation, freshness and deviation limits.
- [ ] Preserve minimum-output, slippage, and expiry checks for routes.
- [ ] Keep accounting proposals separate from signed transactions and confirmed ledger events.
- [ ] Never enable Mainnet actions from a Testnet validation path.
