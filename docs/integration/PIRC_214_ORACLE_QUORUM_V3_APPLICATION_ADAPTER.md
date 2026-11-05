# PiRC-214 Oracle Quorum V3 Application Adapter Contract

**Status:** Integration specification for the experimental SmartContracts Oracle Quorum V3 draft. Not an implementation or deployment claim.

## 1. Ownership and dependency

- PiRC owns feed semantics, economic policy, quorum requirements and acceptance gates.
- SmartContracts owns the Soroban contract state machine and deterministic consensus read.
- Unity Sphere owns source adapters, API normalization, cache policy, user-facing quality states, monitoring and settlement handoff.
- The application must pin the exact contract source SHA, WASM hash, network passphrase, contract ID and feed policy version before enabling a feed.

Reference implementation: https://github.com/Ze0ro99/SmartContracts/pull/1104

## 2. Canonical feed descriptor

Every application feed must be configured with an immutable descriptor:

| Field | Required meaning |
|---|---|
| feed_id | Stable identifier, e.g. PI/USD |
| base_asset_id | Canonical asset identifier |
| quote_asset_id | Canonical quote identifier |
| unit | Exact contract unit string |
| scale | Integer decimal scale for price_atomic |
| network_id | Exact Soroban network/passphrase identifier |
| contract_id | Deployed Oracle Quorum contract |
| quorum | Minimum accepted reporter observations |
| max_age_seconds | Maximum observation age |
| max_deviation_bps | Maximum distance from initial median |
| policy_version | Immutable governance policy version |
| source_manifest | Reporter-to-provider mapping and independence evidence |

Never infer the quote unit or scale from a ticker symbol.

## 3. Adapter responsibilities

1. Validate the requested feed descriptor against the approved registry.
2. Query the exact network and contract; reject a network/contract mismatch.
3. Call the contract consensus read and validate the returned unit and accepted count.
4. Convert integer atomic price to display decimal only at the presentation boundary.
5. Preserve observed_at, accepted_count, rejected_count, policy_version and contract identity with every quote.
6. Cache no longer than the lesser of the configured cache TTL and remaining feed freshness window.
7. Emit telemetry for quorum failures, stale data, RPC failures, unexpected units and policy mismatches.
8. Return a typed failure rather than substituting a single reporter, stale cache, CEX mid-price or another feed.

## 4. API response model

A successful response should normalize to:

~~~json
{
  "status": "AVAILABLE",
  "feed_id": "PI/USD",
  "price_atomic": "101000",
  "scale": 3,
  "unit": "USD_PER_PI",
  "accepted_count": 2,
  "rejected_count": 1,
  "observed_at": 0,
  "policy_version": "1",
  "network_id": "TESTNET_NETWORK_ID",
  "contract_id": "TESTNET_CONTRACT_ID",
  "source": "SOROBAN_ORACLE_QUORUM"
}
~~~

The numeric values above are illustrative fixtures, not live prices or deployed identifiers. Serialize large integer amounts as decimal strings in JSON to avoid JavaScript number precision loss.

## 5. Failure-state mapping

| Contract / transport outcome | Application state | Settlement eligible |
|---|---|---|
| Fresh consensus with accepted_count >= quorum | AVAILABLE | Only after independent policy checks |
| InsufficientQuorum | UNAVAILABLE | No |
| InvalidPolicy / UnitMismatch | CONFIGURATION_ERROR | No |
| RPC timeout / 5xx / malformed response | DEGRADED or UNAVAILABLE | No |
| 401 / 403 | BLOCKED | No |
| 429 | RATE_LIMITED | No |
| Observation outside max age | STALE | No |
| Contract/network identity mismatch | SECURITY_BLOCKED | No |

A displayed fallback may be shown only as a separately labeled, non-settlement informational value with its own source and timestamp. It must never be represented as the quorum result.

## 6. Required conformance tests

- Correct feed ID, unit, scale, network and contract binding.
- Quorum reached with distinct authorized reporter accounts.
- Below-quorum response fails closed.
- Stale and future-dated observations are rejected.
- Duplicate or decreasing per-reporter sequence is rejected.
- Disabled reporter is excluded immediately.
- Outlier rejection and median result match shared golden vectors.
- Integer values above JavaScript's safe integer range round-trip without loss.
- Cache expiry never extends the contract's freshness window.
- RPC 401/403, 429, 5xx, timeout, malformed JSON-RPC and contract errors map to distinct states.
- A failed quorum never triggers automatic settlement, wallet mutation or a market-price fallback.

## 7. Source independence and oracle integrity

The contract quorum counts addresses, not independent organizations. The application must maintain a reviewed source manifest with beneficial ownership, operator, upstream venue, API dependency, key custody and conflict-of-interest disclosures. Multiple reporter wallets operated by one provider count as one source for policy purposes unless an independent reviewer explicitly approves otherwise.

A signed or authorized observation proves key/account control, not price truth. Venue data must be normalized with timestamp, pair, bid/ask, depth, executable notional, venue status and market-quality checks before reporter submission.

## 8. Release gates

- Contract source and test evidence reviewed.
- SmartContracts CI compiles and executes the V3 crate.
- Worst-case resource budget for 32 reporters measured.
- Negative/property/fuzz tests pass.
- Source independence approved by governance.
- Testnet deployment and read-back evidence recorded.
- Application adapter integration tests pass against that exact Testnet deployment.
- Monitoring, incident response, key rotation, pause and rollback procedures reviewed.

No Mainnet endpoint, production signer, automatic conversion, mint/burn or settlement authorization is part of this specification.
