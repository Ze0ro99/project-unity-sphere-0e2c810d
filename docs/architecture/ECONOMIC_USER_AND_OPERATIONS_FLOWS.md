# Economic User and Operations Flows

## A. Merchant payment

```mermaid
flowchart TD
  A[Merchant creates invoice] --> B[Payment intent with expiry]
  B --> C[Customer scans QR / NFC]
  C --> D[Identity, asset and network checks]
  D --> E[Quote and fee disclosure]
  E --> F[Customer approval]
  F --> G[Authorized transaction submission]
  G --> H{Finality observed?}
  H -->|Yes| I[Read-back and reconcile]
  H -->|No| J[Pending / unknown; do not mark paid]
  I --> K[Receipt and merchant reconciliation]
```

## B. Internal reference to external quote

```mermaid
flowchart LR
  A[Internal reference schedule] --> C[Typed comparison]
  B[External market quote] --> C
  C --> D{Fresh, same asset, same network, quorum?}
  D -->|No| E[No conversion]
  D -->|Yes| F[Apply liquidity haircut, caps, fees and eligibility]
  F --> G{Redemption legally and fully backed?}
  G -->|No| H[Display indicative quote only]
  G -->|Yes| I[Proceed only under issuer redemption terms]
```

A displayed internal reference is not a user cash balance. A displayed external quote is venue-specific. A ratio between them must never silently create a 1:many conversion.

## C. Incident / pause path

```mermaid
stateDiagram-v2
  [*] --> NORMAL
  NORMAL --> DEGRADED: stale oracle / RPC errors / drift
  DEGRADED --> PAUSED: risk threshold or integrity failure
  PAUSED --> INVESTIGATING
  INVESTIGATING --> RECOVERY_REVIEW
  RECOVERY_REVIEW --> NORMAL: evidence + authorized approval
  RECOVERY_REVIEW --> PAUSED: unresolved
```

## D. Scale without monetary dilution

```mermaid
flowchart TB
  A[More useful services] --> B[More verified transactions]
  B --> C[Higher collected revenue]
  C --> D[Costs and reserves funded]
  D --> E[Risk-adjusted distributable surplus]
  E --> F[Fair capped allocation]
  F --> G[Reinvestment in merchants, infrastructure and utility]
  G --> A
  H[Liquidity / concentration / compliance limits] -. guardrails .-> E
```

## Operational invariants

- Do not show success before network finality and read-back.
- Do not convert a simulation to a live quote by changing a label.
- Do not claim a token burn when only an internal ledger entry is retired.
- Do not allow treasury write actions from a public UI without privileged authorization.
- Preserve a trace from UI request to API request ID, policy version, contract event and ledger transaction.
