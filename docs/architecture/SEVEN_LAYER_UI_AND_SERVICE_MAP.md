# Seven-Layer UI and Service Map

| Layer | UI module | Backend/service | User-visible state |
|---|---|---|---|
| L1 Blue | Network status | network-gateway | Network, environment, RPC health and finality |
| L2 Green | Pi Cash | pi-cash-api | Payment intent, quote, settlement and refund |
| L3 Gold | Pi Bank/Treasury | treasury-api | Reserve evidence, liabilities, approvals; no bank/deposit claims |
| L4 Orange | PiDEX/Asset Explorer | pidex-api, asset-registry-api | Verified assets, logos, issuer and liquidity status |
| L5 Red | Economic Dashboard | economic-engine | Formula, inputs, units, timestamp and scenario label |
| L6 Violet | Oracle Monitor | oracle-ingestion | Sources, quorum, freshness, deviation and confidence |
| L7 Charcoal | Governance/Security | identity-policy, audit service | Roles, proposals, audit trail and incident status |

Use accessible design tokens and textual labels. Unknown or unverified values must be shown as such, never marked verified by default.