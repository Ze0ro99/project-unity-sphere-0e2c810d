# Payment Rails Adapter Contract

**Status:** Integration contract and release requirements. This document does not claim that card, QR, NFC, bank, biometric, or third-party wallet providers are connected or enabled.

## 1. One intent model, multiple independent rails

All payment methods create the same server-owned `PaymentIntent`. A rail adapter may authorize or capture value with its own provider, but it cannot directly mutate a Pi wallet balance, mint an asset, change IPPR/QWF, or mark a Soroban settlement as final.

Supported adapter categories:

| Rail | Adapter responsibility | Required proof before enabling |
|---|---|---|
| Pi Platform payment | Pi SDK `createPayment`; server-side approval and completion | Verified Pi UID, payment ID, amount, memo, metadata, txid, server completion and chain reconciliation |
| QR | Encode a short-lived payment-intent reference or provider-native payload | Signature/provider validation, intent expiry, exact amount/currency, replay protection |
| NFC / contactless | Invoke an approved wallet/terminal provider token flow | Device/provider cryptogram or signed provider result; never trust an NFC UID alone |
| Visa / Mastercard / other cards | Redirect to hosted checkout or use PSP tokenization | PCI-scoped PSP, tokenized payment method, 3-D Secure/SCA where required, signed webhooks, capture and settlement reports |
| Bank transfer / open banking | Create a provider/bank payment request and reconcile incoming funds | Bank/provider reference, verified payer/beneficiary, settled status, return/reversal handling |
| Third-party digital wallets | Use each provider's approved SDK/API adapter | Provider transaction ID, signed webhook, amount/currency match, settlement reconciliation |
| Biometric / passkey | Local user authentication and transaction confirmation only | WebAuthn/passkey/device authentication plus explicit transaction details and user consent |

Biometrics are not a payment rail. Do not collect, upload, store, or place biometric templates or raw face/fingerprint data on-chain. A local biometric unlock may authorize a passkey operation, but the provider or blockchain transaction still requires its own verifiable settlement evidence.

## 2. Canonical PaymentIntent

The server creates and owns the intent. Minimum fields:

- `intent_id`: opaque, unique identifier.
- `idempotency_key`: unique per client action and provider operation.
- `user_id` / verified Pi UID where applicable.
- `merchant_id`, `order_id`, `description`.
- `network_id`: explicit `pi-testnet` or a separately approved production network.
- `asset_id`, `amount_atomic`, `asset_decimals`.
- `fiat_currency`, `fiat_amount_minor`, `fx_quote_id`, `fx_quote_expires_at` when a fiat rail is used.
- `rail`, `provider`, `provider_reference`.
- `status`, `created_at`, `expires_at`, `updated_at`.
- `authorization_reference`, `capture_reference`, `chain_tx_hash`, `ledger_sequence` when applicable.
- `evidence_digest`, `policy_version`, `correlation_id`.

Amounts use integer atomic/minor units. No floating-point amount is accepted for authorization, capture, refund, conversion, or settlement. A quote binds the exact asset, currency, amount, rate source, fees, expiry, and provider; changing any field requires a new intent or quote.

## 3. State machine

Allowed lifecycle:

`created -> requires_action -> authorized -> capture_pending -> captured -> settlement_pending -> settled`

Terminal or exception states:

`failed`, `canceled`, `expired`, `refunded`, `partially_refunded`, `disputed`, `chargeback`, `unknown`, `reconciliation_required`.

Rules:

1. Browser callbacks are observations, not proof of payment.
2. Verify provider signatures and transaction status server-side.
3. Match provider reference, intent, user, merchant, amount, currency, order, and expiry exactly.
4. Enforce idempotency at both API and provider-operation boundaries.
5. A timeout becomes `unknown` or `reconciliation_required`; do not automatically create a second charge.
6. A card authorization is not a capture; a capture is not a bank payout; a provider webhook is not chain finality.
7. Refunds, reversals, chargebacks, and disputes create linked compensating records. Never rewrite the original transaction.
8. A Pi Platform payment completes only through the documented server approval/completion lifecycle.
9. A Soroban settlement is `settled` only after successful transaction finality, canonical contract read-back, and digest match.

## 4. Rail-specific security

### Cards

- Use a PCI-compliant hosted checkout or provider tokenization.
- Do not receive or store PAN, CVV, PIN, magnetic-stripe data, or raw cardholder credentials.
- Store only provider-issued opaque tokens and minimal display metadata.
- Verify 3-D Secure/SCA outcomes and signed provider webhooks.
- Reconcile captures, fees, settlement batches, refunds, chargebacks, and payout delays.

### QR and NFC

- QR/NFC payloads reference an expiring intent; they are not proof of payment or asset ownership.
- Include a nonce, expiry, network, merchant, amount, currency/asset, and intent reference.
- Reject replayed, expired, altered, wrong-network, or wrong-merchant payloads.
- Never infer authorization from a successful scan, NFC tag read, or device proximity.

### Bank and third-party wallets

- Verify signed callbacks and provider-side status by querying the provider API.
- Handle asynchronous settlement, returns, reversals, partial payments, fees, and payer-name mismatches.
- Keep provider settlement records separate from Pi chain transactions.

### Biometric and passkey confirmation

- Use platform WebAuthn/passkey APIs where available.
- Bind confirmation to a human-readable transaction summary and cryptographic challenge.
- Never store biometric templates or use biometric matching as proof that a blockchain transfer settled.
- Provide a non-biometric recovery path and explicit consent.

## 5. Conversion and Pi settlement boundary

- External fiat/card capture does not automatically become Pi.
- A PI/USD or PI/USDT market observation is not a conversion instruction, wallet balance, reserve, or redemption right.
- Any fiat-to-Pi or Pi-to-fiat conversion requires an explicitly authorized, legally permitted provider, a fresh quote, fees, limits, user approval, and independent settlement evidence.
- IPPR is an economic reference index; it must not be multiplied into a card amount or used to alter wallet balances.
- Payment rails cannot bypass the four economic gates or the canonical Soroban settlement adapter.
- Testnet payment simulations must be labelled `SIMULATION`; no real card or bank charge is permitted in Testnet.

## 6. Required provider configuration

Each adapter requires server-side configuration and an explicit enablement record:

- provider name and environment (sandbox/test/production);
- merchant/account identifier;
- API credential reference in a secret manager (never the credential value);
- webhook endpoint and signature-verification key reference;
- supported currencies, countries, methods, limits and settlement windows;
- idempotency and retry policy;
- refund, dispute and chargeback capabilities;
- provider contract, licensing/jurisdiction review and PCI/privacy assessment;
- monitoring, reconciliation and emergency-disable procedure.

No provider is enabled by adding a UI option or environment variable alone. The default state is disabled.

## 7. Acceptance tests

- duplicate client requests do not create duplicate provider charges;
- invalid, unsigned, replayed, expired and mismatched webhooks are rejected;
- authorization is not reported as capture or settlement;
- capture is not reported as bank payout or Pi chain finality;
- provider timeout enters `unknown` and reconciles before retry;
- partial refunds and chargebacks preserve original history;
- QR/NFC payload replay and wrong-merchant attempts fail;
- biometric cancellation and passkey failure do not create a payment;
- Pi Platform approval/completion validates UID, amount, memo, metadata and txid;
- no card, bank, biometric, or wallet secret appears in browser bundles, logs, database projections, or contract storage.

## 8. Current enablement status

The repository contains Pi Platform payment lifecycle requirements and QR/NFC flow documentation. No verified Visa/Mastercard PSP, bank, third-party wallet, QR-acquirer, NFC terminal, or biometric payment-provider connection is established by this document. All external rails remain disabled until provider credentials, sandbox evidence, webhook verification, reconciliation tests, legal review, and production approvals are supplied.
