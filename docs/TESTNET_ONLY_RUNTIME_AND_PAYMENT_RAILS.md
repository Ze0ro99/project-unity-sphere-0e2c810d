# Testnet-Only Runtime, Economic Gateways and Payment Rails

**Status:** Source changes in progress; runtime credentials, provider registration, contract deployment and end-to-end settlement remain unverified.  
**Target network:** Pi Testnet (project alias Testnet1).  
**Mainnet writes:** Disabled.

## 1. Network isolation

The browser Pi SDK must be explicitly built with:

- `VITE_PI_NETWORK=testnet`
- `VITE_PI_SANDBOX=true`

If either condition is missing, the Pi SDK wrapper blocks initialization and payment actions. Local preview auto-detection is not a substitute for explicit Testnet configuration.

The server-side `pi-payments` function no longer falls back to `https://api.minepi.com/v2` or legacy `PI_API_KEY` / `PI_NETWORK_API_KEY` secrets. It requires:

- `PI_NETWORK=testnet`
- `PI_PLATFORM_API_URL` set to the verified Testnet Pi Platform API base ending in `/v2`
- `PI_PLATFORM_API_ALLOWED_HOSTS` containing that exact host
- `PI_TESTNET_API_KEY` stored only as a server-side secret

The host and API base are intentionally not guessed from the Horizon endpoint. Until the official Testnet Platform API base and matching Testnet key are confirmed and configured, authentication-dependent Platform API calls and approve/complete actions fail closed. The public Testnet Horizon URL is not automatically assumed to be the Pi Platform API.

## 2. Wallet and settlement boundaries

- Pi SDK authentication, wallet-address permission, payment permission and Soroban transaction signing are separate capabilities.
- A wallet address and read-only Test Pi balance do not provide a signing key or a Soroban transaction submission path.
- A Pi Platform payment callback is not proof of Soroban contract settlement.
- PiDEX order books, balances, fills and LP positions remain simulation data until the canonical AMM, token contracts, signer flow, event decoder and transaction read-back are verified on Testnet1.
- No market quote, IPPR tick, QWF update or gateway status may directly mint, burn, transfer or modify a wallet balance.

## 3. Four economic gateway responsibilities

| Gateway | Inputs | Required checks | Current portal |
|---|---|---|---|
| Market Data | CEX/DEX PI/USD observations | source identity, pair/scale, quorum, freshness, sequence/replay, deviation, depth | Oracle |
| Utility & Commerce | merchant catalogue, inventory, order and fulfilment evidence | merchant identity, product provenance, accepted asset amount, refunds/disputes | PiDEX (simulation until settlement adapter exists) |
| Velocity & Liquidity | reconciled settlement events, average supply, AMM order-book depth | exclude wash/circular/unsettled events; same-asset and same-window liquidity | Economics |
| Solvency & Settlement | reserves, liabilities, network identity, tx XDR, finality and contract read-back | reserve haircuts, coverage, exit queue, authorization, idempotency and reconciliation | Testnet |

The four gateway cards are navigation portals to the corresponding existing application surfaces. They are not claims that four independent backend services have been deployed.

## 4. QR and NFC

QR/NFC carries a signed, expiring payment intent only. It must include schema version, network ID, merchant/app ID, order ID, product/valuation hash, asset ID, exact atomic amount, fee policy, nonce, created/expiry times, callback/deep-link and merchant key ID/signature.

The payer must see merchant, item, quantity, asset, amount and fees before explicit wallet approval. Reject wrong-network intents, expired intents, duplicate nonce/order pairs, invalid signatures, changed amounts and replayed callbacks. Never put a seed phrase, private key or unrestricted payment command in a QR code or NFC tag.

## 5. Card, bank and biometric rails

Visa, Mastercard, Mada, bank transfer and other card/payment-provider rails require separately contracted provider adapters and provider sandbox credentials. They are not enabled by the Pi SDK and are not implemented merely by adding a card icon or a QR payload.

A provider adapter must use hosted fields/tokenization, avoid storing raw PAN/CVV, verify signed webhooks, enforce idempotency, model authorization/capture/refund/chargeback states, and pass provider sandbox tests. PCI DSS scope and applicable local regulatory obligations must be reviewed by the payment provider and merchant.

Biometrics may unlock a local device or satisfy an identity/authentication step. They are not a payment rail, do not replace user consent, and must not be treated as proof of a blockchain signature. Any biometric provider integration requires a separate privacy and security assessment.

All external payment methods must produce a normalized, signed payment-intent/event record. Fiat authorization, Pi Platform payment completion and Soroban settlement remain distinct states and must not be conflated.

## 6. Economic reference and sample

For the supplied simulation snapshot:

- unrounded PI/USD quote: `0.0729555`
- fixed IPPR supply multiplier: `10,000,000`
- IPPR reference: `729,555 USD`
- adaptive QWF: `10,072,123`
- network velocity `L_n`: `0.5115`
- reflexive constraint: `Φ = (L_n × IPPR) / QWF ≈ 0.0370495`

The rounded display quote `0.072956` would yield `729,560`; calculations must use the unrounded accepted quote. The IPPR multiplier is not QWF. QWF is a separately governed adaptive state. The sample is a simulation input, not a live verified QWF or reserve statement.

## 7. Release blockers

1. Verify the official Pi Testnet Platform API base and obtain a Testnet-only API key; configure the exact allowlisted host.
2. Confirm the deployed frontend has `VITE_PI_NETWORK=testnet` and `VITE_PI_SANDBOX=true`.
3. Deploy and read back canonical Soroban contracts with code hash, network identity, issuer authority and test evidence.
4. Connect signed oracle observations and a governed QWF/velocity state feed; do not infer live QWF from market data.
5. Implement event XDR decoding, finality checks, settlement reconciliation and idempotent payment callbacks.
6. Integrate any card/bank/biometric provider only after provider sandbox credentials, compliance review and conformance tests.
7. Keep all Mainnet writes disabled until a separate release and authorization process.

