# Sovereign Economic Application Map

**Status:** Application reference architecture. Proposed modules are not evidence of live financial services.

## Service map

```mermaid
flowchart TB
  subgraph UX["Experience"]
    P[Pioneer Portal]
    M[Merchant Portal]
    T[Treasury / Governance Console]
    D[Economic Dashboard]
  end
  subgraph APP["Application Services"]
    G[API Gateway]
    PAY[Payment Intent]
    REG[Asset Registry]
    Q[Quote / PiDEX Adapter]
    ID[Identity & Policy]
    ECON[Economic Engine]
  end
  subgraph EVID["Evidence & Risk"]
    OR[Oracle Ingestion]
    PR[Provenance Resolver]
    RISK[Risk / Circuit Breaker]
    REC[Reconciliation]
    OBS[Observability]
  end
  subgraph EXEC["Execution"]
    SC[SmartContracts Adapter]
    NET[Network Gateway]
    CHAIN[Configured Pi / Stellar Network]
  end
  P --> G
  M --> G
  T --> G
  D --> G
  G --> ID
  G --> PAY
  G --> REG
  G --> Q
  G --> ECON
  Q --> OR
  REG --> PR
  ECON --> RISK
  PAY --> SC
  ECON --> SC
  SC --> NET
  NET --> CHAIN
  CHAIN --> REC
  OR --> REC
  PR --> REC
  REC --> OBS
  RISK --> OBS
```

## Data and trust rules

- Every API response carries request ID, environment, network domain, data source, freshness and verification state.
- Market quote, internal reference, simulated price, collateral estimate, reserve and redeemable liability are distinct typed fields.
- A contract ID is not proof of issuer identity, code hash, audit, reserves or redemption.
- A market chart is not proof of an order book, pool, liquidity or completed trade.
- A successful transaction submission is not finality; read back ledger state and reconcile.
- Unsupported capability returns a stable typed error (for example `UNSUPPORTED_CAPABILITY`), never a fabricated success.
- Secrets and signing authority remain server-side in a separately controlled signer/relayer; no private key or seed phrase reaches the browser.

## Dual-value user journey

```mermaid
sequenceDiagram
  actor User
  participant UI as PiDEX UI
  participant API as Quote API
  participant OR as Oracle Adapter
  participant POL as Policy Firewall
  participant SC as Settlement Adapter
  User->>UI: Select asset and operation
  UI->>API: Request quote
  API->>OR: Fetch market observations
  OR-->>API: Observations with source and timestamp
  API->>POL: Compare external quote with internal policy
  POL-->>API: Allowed quote, capped quote, or rejection
  API-->>UI: Typed quote and explanation
  User->>UI: Confirm operation
  UI->>SC: Submit with idempotency key
  SC-->>UI: Pending transaction reference
  SC->>SC: Wait for finality and read-back
  SC-->>UI: Final, failed, or unknown status with evidence
```

## Economic dashboard semantics

| Display | Required label |
|---|---|
| Exchange quote | Venue, pair, timestamp, depth and source |
| Internal reference | Policy version and effective period |
| Sovereign ratio | Scenario/index only; not a redemption rate |
| Simulated supply / emissions | SIMULATED |
| Reserve estimate | ESTIMATE until independently attested |
| Verified reserve | Custodian, liability scope, timestamp and attestation |
| Payment state | Pending / final / failed / unknown |
| Contract state | Network, contract ID, code hash and read-back status |

## Operational gates

1. Read-only mode by default for new adapters.
2. Explicit environment allowlist and network passphrase check.
3. Dry-run and transaction simulation before write operations.
4. Human approval and multisig for treasury or supply-critical actions.
5. Idempotency, rate limits, circuit breakers and bounded retries.
6. Reconciliation job with alerting on state drift.
7. Separate preview, staging, Testnet and production configuration.
8. No automatic harvesting of branches, deployment of every WASM, or unrestricted signer workflow.
