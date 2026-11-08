# Unity Sphere Release Readiness Checklist

This checklist is the release gate for the Unity Sphere portal. It deliberately separates source-code validation from external service configuration and live deployment evidence.

## 1. Current repository baseline

- Application: React + TypeScript + Vite.
- Default branch: `main`.
- Localization locales: `en`, `ar`, `zh`, `id`, `fr`, `es`, `de`, `pt`.
- The locale coverage audit is available through `npm run audit:i18n`.
- Use `npm run audit:i18n -- --strict` to fail when any locale is missing an English dictionary key.
- Dictionary parity is not the same as complete page translation: hard-coded text in route components must also be migrated into locale dictionaries and reviewed.

## 2. Localization acceptance criteria

- [ ] Every visible user-facing string on every route is sourced from the shared localization layer, except product names, protocol identifiers, hashes, addresses, code, and standards names that must remain canonical.
- [ ] All eight locales contain every user-facing dictionary key used by the application.
- [ ] Interpolation placeholders are identical across locales.
- [ ] Arabic applies RTL at the document and component levels; identifiers, amounts, hashes, and addresses remain LTR.
- [ ] Locale selection survives reload, a new tab, and a browser session.
- [ ] Language selection works at mobile and desktop widths.
- [ ] Long labels, validation errors, empty states, loading states, dialogs, and responsive navigation are checked for clipping and overflow.
- [ ] A fluent reviewer checks French, Spanish, German, and Portuguese terminology before production.

## 3. Pi Platform and wallet acceptance criteria

- [ ] Pi SDK initialization is tested in the official Pi Browser and the Pi Developer Sandbox.
- [ ] Authentication requests only the scopes actually required by the app.
- [ ] Authentication failure, cancellation, unavailable SDK, and expired session have explicit UI states.
- [ ] Connect/authenticate never initiates a payment.
- [ ] Any future payment has a separate user action, explicit amount, item description, memo, server-side validation, and completion/cancellation handling.
- [ ] Access tokens and privileged credentials are never exposed in client bundles, logs, or repository files.
- [ ] No Mainnet payment or transaction is used as a test fixture.

## 4. Network separation and evidence

- [ ] Mainnet Horizon and Testnet/Soroban endpoints are configured explicitly and independently.
- [ ] A failed request never silently falls back between networks.
- [ ] UI labels identify the network used for each result.
- [ ] Mainnet ledger reads are not presented as Soroban contract execution or settlement proof.
- [ ] Exchange quotes are labelled off-chain, timestamped, and not presented as executable liquidity or a canonical oracle.
- [ ] PiDEX local order book, balances, fills, and liquidity remain visibly labelled as simulation until a real settlement path is implemented and audited.
- [ ] Soroban ingestion validates network passphrase, contract ID, event type, cursor, and idempotency key.
- [ ] Raw event ingestion is not treated as finality, accounting settlement, or proof of ownership.
- [ ] Before settlement projection is enabled, decode canonical XDR, fetch transaction status, read canonical contract state, and reconcile a deterministic settlement digest.

## 5. Smart-contract release gates

For each contract and each target network, record:

- [ ] Network name and passphrase.
- [ ] Contract ID and deployment transaction hash.
- [ ] Deployed WASM hash compared with the reviewed build artifact.
- [ ] Initialization state and required storage entries.
- [ ] Admin, issuer, upgrade, and emergency-pause authority.
- [ ] Required authorization checks and negative tests.
- [ ] Arithmetic bounds, replay protection, idempotency, and pause behavior.
- [ ] Test evidence for success, failure, boundary, and adversarial cases.
- [ ] Independent security review status and unresolved findings.
- [ ] A rollback or pause procedure.

A contract address, repository source file, deployment workflow, or successful frontend build does not prove that a contract is deployed correctly or audited.

## 6. Security, privacy, and operations

- [ ] Only publishable client configuration is exposed through `VITE_*` variables.
- [ ] Service-role keys, signing keys, ingestion secrets, and private API credentials remain server-side.
- [ ] Supabase Row Level Security policies are reviewed for every exposed table.
- [ ] Edge Functions enforce authentication, authorization, input validation, rate limits, and bounded payload sizes.
- [ ] Logs exclude access tokens, secrets, private user data, and full payment payloads.
- [ ] Dependency and secret scans pass on the exact release commit.
- [ ] Workflows use least-privilege permissions, pinned actions where practical, concurrency limits, and path filters to avoid unnecessary CI spend.
- [ ] Mainnet deployment and financial actions require a separate, explicit release approval.

## 7. Build and browser verification

- [ ] TypeScript check passes.
- [ ] Production Vite build passes.
- [ ] Unit and integration tests pass.
- [ ] Localization audit passes in strict mode.
- [ ] Secret scan passes.
- [ ] Desktop and mobile route smoke tests pass for all routes in `src/App.tsx`.
- [ ] Pi Browser authentication and app navigation pass.
- [ ] Network outage, slow response, empty data, malformed payload, and RPC rate-limit states are tested.
- [ ] Published Lovable build hash is recorded and matches the approved Git commit.
- [ ] Pi Browser listing is independently checked after publication; listing verification status is recorded separately from app availability.

## 8. Release evidence record

For every release, attach:

- Git commit SHA and pull request URL.
- CI workflow run URLs and conclusions for that exact SHA.
- Locale audit output.
- Browser/device test matrix and results.
- Pi SDK and Supabase health checks with secrets redacted.
- Per-network contract deployment evidence and WASM hashes.
- Published Lovable build identifier.
- Pi Browser listing URL and current verification status.
- Explicit approval for any Mainnet-facing action.

Do not mark a gate complete based only on documentation, a simulated UI, a source-code reference, or an earlier commit's CI result.
