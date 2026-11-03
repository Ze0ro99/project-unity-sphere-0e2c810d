# Oracle, Chainlink, and Contract Integration Readiness

Status: source-code assessment for the integration branch. This document does not represent a deployment, audit, partnership, or live financial integration.

## Confirmed repository components

| Component | Current source evidence | Readiness |
|---|---|---|
| Unity Sphere Soroban oracle copy | `contracts/soroban/src/oracle.rs` exposes `update_price` and publishes an event | Scaffold only; no persistent feed state, authorization, reporter quorum, freshness checks, deviation guard, or proof verification |
| SmartContracts PiRC-214 Oracle V2 | `Ze0ro99/SmartContracts/contracts/pirc_214_oracle_v2/src/lib.rs` provides one-time initialization, admin-managed reporter allowlist, authenticated updates, positive-price check, monotonic sequence, ledger timestamp and persistent typed feed records | Stronger reference baseline; still single-observation storage, not a quorum oracle. No per-feed max-age/deviation policy, multi-reporter aggregation, signed cross-chain payload verification, explicit persistent-entry TTL extension, or complete adversarial test suite is evidenced |
| Chainlink EVM consumer | `contracts/chainlink_consumer/PiRCChainlinkConsumer.sol` reads AggregatorV3 feeds, checks heartbeat, normalizes decimals, and computes a weighted purchasing-power index | Reference implementation; requires tests, audited configuration, chain-specific feed addresses, deployment, ownership hardening, and monitoring |
| Frontend oracle reader | `src/lib/oracle.ts` reads Ethereum Mainnet Chainlink AggregatorV3 feeds over public RPC and queries centralized exchange endpoints for Pi quotes | Off-chain dashboard reader; not a Pi/Soroban on-chain oracle and not a decentralized quorum |
| Oracle standard | `docs/PiRC-214-Decentralized-Oracle-Network-Standard.md` describes multi-source aggregation and future zk-proof/AI validation | Specification/roadmap; the implementation status label must not be interpreted as proof that all listed controls are implemented |
| API verification endpoint | `api/main.py` invokes the external `soroban` CLI using a configured contract ID and the `alice` testnet identity | Not production-ready on Vercel without a supported signing/deployment architecture; do not expose as a live verification service |

## Required engineering work before activation

1. Define the authoritative feed registry per network: chain ID, asset pair, aggregator address, decimals, heartbeat, deviation threshold, and source provenance.
2. Add explicit access control and persistent storage to the Soroban oracle. Add reporter registration, quorum/threshold rules, monotonic round IDs, timestamp bounds, stale-feed rejection, deviation/circuit-breaker logic, and emergency pause/upgrade policy.
3. Treat `SmartContracts/contracts/pirc_214_oracle_v2` as the preferred Soroban reference baseline over the event-only Unity Sphere copy; reconcile the duplicate implementations and pin the canonical source before application integration.
4. Add per-feed maximum age, deviation limits, reporter quorum/aggregation, replay/domain separation, and Soroban persistent-storage TTL extension to the V2 oracle. Its current monotonic sequence is per feed, but it does not establish independent multi-source consensus.
5. Define a secure cross-chain boundary. Chainlink EVM feeds are not natively callable from Soroban; an authenticated relayer/adapter must verify signed observations or a supported bridge message. Never describe the EVM consumer as a Pi Mainnet deployment.
6. Add unit, fuzz, invariant, integration, and negative tests for stale data, zero/negative answers, decimal extremes, duplicate rounds, replay, unauthorized updates, quorum loss, and source divergence.
7. Pin compiler/toolchain and dependencies. Add reproducible deployment scripts and network-specific manifests. Store deployed contract IDs, code hashes, admin addresses, feed addresses, and verification artifacts as release outputs.
8. Use a multisig or governed admin for production ownership. Document key rotation, incident response, pause authority, and recovery.
9. Keep all external financial actions disabled until a third-party security review and independent on-chain verification are complete.

## Vercel API limitation

The `api/main.py` `POST /verify` route is deliberately disabled and returns `503 UNSUPPORTED_CAPABILITY`. The earlier implementation attempted to shell out to `soroban contract invoke` using the developer profile `alice`, but the checked-in Vercel function does not provision the Soroban CLI, network-pinned RPC client, or secure signer. The unsafe subprocess path has been removed. Do not re-enable this route until a reviewed server-side RPC client, secure signer/relayer, explicit network selection, authorization policy, and integration tests are in place.

## Financial and banking boundary

No bank, custodian, payment institution, fiat settlement rail, reserve account, or redemption partner is established by these source files. Chainlink is an oracle infrastructure provider, not a bank. Any fiat/banking connection requires a separately contracted and licensed provider, jurisdictional review, KYB/KYC, custody controls, reconciliation, and explicit settlement contracts.

## Release gates

- [ ] Canonical Soroban oracle implementation is selected; duplicate event-only copy is retired or explicitly marked legacy.
- [ ] Soroban oracle includes authorization, storage, quorum, replay protection, freshness, deviation checks, and storage TTL management.
- [ ] EVM Chainlink consumer tests pass on the target EVM test network.
- [ ] Oracle-to-Soroban bridge/relayer threat model and verification tests pass.
- [ ] Network-specific feed addresses and heartbeat values are independently confirmed.
- [ ] Contract build, static analysis, fuzzing, and external audit are complete.
- [ ] Testnet deployment IDs and code hashes are recorded and verified.
- [ ] Production deployment is explicitly approved; no testnet ID is reused as a production ID.
- [ ] API verification no longer depends on an unavailable CLI or a hard-coded development identity.
- [ ] UI labels clearly distinguish simulated, off-chain, testnet, and verified mainnet data.


## Follow-up security change (2026-11-03)

- Removed the subprocess invocation and the implicit `alice` developer identity from `api/main.py`.
- The route validates the API key and request shape, then fails closed with a stable `UNSUPPORTED_CAPABILITY` response (HTTP 503).
- Added a regression test asserting that a validly shaped request cannot receive a false verification success when the secure signing capability is absent.
- This change is proposed in a follow-up pull request; it is not considered deployed or validated until CI completes.
