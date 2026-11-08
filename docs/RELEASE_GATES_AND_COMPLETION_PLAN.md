# Unity Sphere Release Gate and Completion Plan

**Document language:** English  
**Release state:** BLOCKED — integration source is not equivalent to a verified deployment.  
**Target:** Pi Testnet (project alias: Testnet1). Mainnet writes remain disabled.

## 1. Purpose

This document defines the release gates for the Unity Sphere application, Pi Platform wallet integration, PiDEX, Soroban event ingestion, the seven-layer asset registry, and the external portal surfaces. It is intentionally evidence-driven. A successful frontend build does not establish that a wallet, contract, payment rail, oracle, or published portal is operational.

## 2. Repository and release baseline

- Repository: https://github.com/Ze0ro99/project-unity-sphere-0e2c810d
- Default branch: `main`
- Active integration pull request: https://github.com/Ze0ro99/project-unity-sphere-0e2c810d/pull/52
- Integration branch: `integration/pirc-testnet1-wallet-pidex-2026-11-08`
- Related standards repository: https://github.com/Ze0ro99/PiRC
- Related contract repository: https://github.com/Ze0ro99/SmartContracts
- All source identifiers, code comments, API schemas, tests, operational runbooks, and engineering documentation must be authored in English.
- The application locale feature may render supported end-user languages. Locale translations are product content and are not a reason to write source code or engineering documentation in another language.

## 3. Current evidence

The latest inspected integration branch check set passed:
- Frontend build
- Python/API tests
- Deno static check for the Soroban event inbox
- Publish-artifact build
- Secret scans

The static publish workflow's actual publish step was skipped. These checks do not prove that Lovable or the Pi Browser listing is serving this commit.

The latest recorded read-only Pi Testnet probe verified the network identity and protocol profile, but found zero of seven registered layer contract instances. This is a deployment blocker, not a UI defect.

The integration manifest currently records:
- Pi wallet identity connection implemented, but live signing is not enabled.
- PiDEX AMM source present, but no verified deployed assets or active on-chain liquidity.
- Soroban event inbox performs raw event ingestion only; it does not decode XDR or reconcile canonical settlement state.
- OUSD is a test-only reference with no peg, reserves, or redemption.
- PiRC-2 has an ABI mismatch and is not Testnet-deployed.
- Several PiRC modules remain reference-only, partial, or pending security review.

## 4. Mandatory release gates

### Gate A — English engineering baseline and localization integrity

- [ ] Keep all source code, identifiers, comments, API contracts, tests, workflows, and engineering documentation in English.
- [ ] Keep English as the default application locale.
- [ ] Complete every user-facing dictionary key for each advertised locale.
- [ ] Require interpolation placeholder parity across locales.
- [ ] Move visible hard-coded route text into the shared localization system or explicitly mark canonical names, hashes, addresses, and code as non-translatable.
- [ ] Verify every route at mobile and desktop sizes, including RTL behavior and LTR numeric identifiers.
- [ ] Obtain fluent review for each advertised locale.
- [ ] Keep incomplete locales visible as unavailable/disabled in the selector until every English baseline key, interpolation placeholder, and route label has been translated and reviewed.

The current integration branch has 166 English, Arabic, Chinese, and Indonesian keys, but only 42 keys in each of French, Spanish, German, and Portuguese. The latter four locales are partial and must not be advertised as fully translated. The release gate fails on this condition.

### Gate B — Pi identity and payment safety

- [ ] Test authentication in Pi Developer Sandbox.
- [ ] Test authentication separately in the official Pi Browser.
- [ ] Verify UID, wallet address, token expiry, cancellation, retry, and logout behavior.
- [ ] Keep wallet connection separate from payment authorization.
- [ ] Require an explicit payment action, exact amount, item/order binding, server-side validation, and verified completion.
- [ ] Do not store access tokens, signing keys, or provider secrets in browser storage or client bundles.
- [ ] Do not infer Soroban signing capability from Pi Platform authentication or a returned wallet address.

### Gate C — Testnet identity and protocol

- [ ] Configure the exact Pi Testnet Horizon and Soroban RPC endpoints server-side.
- [ ] Verify both endpoints report the same expected network passphrase.
- [ ] Verify RPC health, latest ledger, retention bounds, and protocol compatibility.
- [ ] Never silently fall back to Mainnet or public Stellar Testnet.
- [ ] Keep Testnet and Mainnet records, cursors, balances, contract IDs, and credentials separate.
- [ ] Record a timestamped read-only probe and the exact commit/configuration used.

### Gate D — Contract packaging and deployment proof

For every contract:
- [ ] Build a reproducible WASM artifact from a pinned source commit and toolchain.
- [ ] Record artifact SHA-256 and on-chain WASM hash.
- [ ] Record network passphrase, contract ID, deployment transaction hash, and ledger.
- [ ] Read back contract instance, initialization state, storage, admin/issuer authority, pause state, and upgrade authority.
- [ ] Run positive, negative, boundary, replay, authorization, arithmetic, and pause tests against the deployed instance.
- [ ] Confirm the deployed ABI matches the client and event decoder.
- [ ] Complete independent security review before enabling value-bearing operations.

No source file, registry row, account response, or workflow definition is deployment evidence. Do not deploy until the reviewed artifact and authorized Testnet signer are available.

### Gate E — Asset registry and seven-layer synchronization

- [ ] Verify every layer's canonical asset/contract ID and issuer against Testnet.
- [ ] Verify decimals, metadata hash, source transaction, ledger sequence, and deployed code hash where applicable.
- [ ] Reconcile registry records against on-chain state.
- [ ] Preserve explicit states for missing, unverified, frozen, retired, and verified assets.
- [ ] Never treat logos, market prices, repository manifests, or Horizon account existence as proof of balances or reserves.

### Gate F — PiDEX and economic accounting

- [ ] Keep simulation balances and simulated fills visibly marked as simulation.
- [ ] Enable trading only after deployed AMM and token contracts, wallet signing, liquidity, slippage bounds, and settlement readback are verified.
- [ ] Use integer atomic units and explicit decimals; never use floating-point settlement arithmetic.
- [ ] Preserve market observations, internal utility reference units, merchant quotes, and settled amounts as separate values.
- [ ] Apply oracle freshness, source quorum, deviation bounds, circuit breakers, and quote expiry.
- [ ] Never mutate historical transactions or balances when market prices move.
- [ ] Reconcile deposits, swaps, withdrawals, fees, refunds, and ledger events idempotently.

### Gate G — Soroban event ingestion and settlement

- [ ] Retain the durable cursor and idempotency key per network and contract.
- [ ] Decode canonical XDR using the pinned ABI/spec.
- [ ] Verify transaction success/finality and event contract/topic identity.
- [ ] Read canonical contract state and compare a deterministic settlement digest.
- [ ] Quarantine malformed, unknown, replayed, or mismatched events.
- [ ] Publish a settlement projection only after all checks pass.
- [ ] Monitor ingestion lag, cursor gaps, retries, and reconciliation failures.

### Gate H — External payment rails

- [ ] Integrate QR/NFC, card, bank, and digital wallet methods only through approved provider adapters.
- [ ] Use hosted/tokenized card capture; do not collect or store PAN, CVV, PIN, or track data.
- [ ] Treat biometrics as local device authentication, never as a payment rail or stored biometric template.
- [ ] Verify signed webhooks, idempotency, authorization/capture, settlement reports, refunds, disputes, and chargebacks.
- [ ] Complete provider, jurisdiction, PCI, privacy, and legal reviews before enabling a rail.

### Gate I — Supabase, Lovable, and Pi Browser

- [ ] Verify Edge Function deployment version and health.
- [ ] Review Row Level Security policies and server-side secrets.
- [ ] Test event-ingestion authentication, rate limits, replay protection, and bounded payloads.
- [ ] Publish the approved commit through Lovable and record the served build identifier.
- [ ] Independently test all routes inside Pi Browser.
- [ ] Record PiNet listing verification state separately from application availability.
- [ ] Do not claim official Pi verification unless the listing itself reports verified status.

## 5. Release-gate automation

Run locally:

```bash
npm run audit:i18n -- --strict
PI_NETWORK_PASSPHRASE='<Pi Testnet passphrase from a protected secret store>' npm run gate:release
npm run build
```

The manually triggered GitHub Actions workflow `Unity Sphere Release Readiness Gate` runs the same fail-closed release gate and reads `PI_NETWORK_PASSPHRASE` only from the protected repository Actions secret of the same name. Never put the passphrase in the manifest, source tree, client bundle, logs, or command history. It is expected to fail until locale parity, deployment evidence, and all feature status requirements are satisfied. Do not weaken the gate to obtain a green badge.

## 6. Current blockers and required evidence

| Area | Current state | Required evidence |
|---|---|---|
| French/Spanish/German/Portuguese | Partial dictionaries | Complete translations and route review |
| Pi wallet | Identity binding implemented | Pi Browser/Sandbox runtime evidence |
| Testnet1 network | Read-only identity verified | Fresh probe at release commit |
| Seven-layer contracts | 0/7 instances found in last recorded probe | Contract IDs, deployment transactions, WASM/state readback |
| PiDEX AMM | Source/tests present; not deployed | Deployed AMM, verified assets, liquidity and swap tests |
| Soroban inbox | Raw events only | XDR decode, finality, canonical state and digest reconciliation |
| PiRC-2 | ABI mismatch; not deployed | Canonical ABI alignment and deployed-instance tests |
| Supabase | Source functions present | Deployment and RLS/secret health evidence |
| Lovable | Publish not evidenced by GitHub checks | Served commit/build ID |
| Pi Browser listing | Must be checked independently | Current listing status and route smoke tests |
| Payment providers | Specifications only | Provider contracts, sandbox tests, settlement and compliance evidence |

## 7. Safety boundary

This integration work must remain read-only against Mainnet. Do not use Mainnet funds, production payment credentials, production signing keys, or live customer biometric/card data for testing. Any future Mainnet deployment, asset issuance, custody, payment capture, or value-bearing trading requires a separate explicit approval and an independently reviewed release plan.

## 8. Completion rule

The release is complete only when every mandatory gate has linked evidence tied to the same approved commit and environment. A successful build, green secret scan, Pi login, Horizon response, event ingestion cursor, or source-level contract test alone is insufficient.
