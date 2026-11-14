# Pi Testnet evidence and safe verification

## Evidence currently recorded

The asset registry keeps two evidence domains separate:

1. **Pi Testnet account snapshot supplied by the operator**
   - Account: `GA3ECRFJ6SO5BW6NEIKW3ACJXNG5UNBTLRRXWC742NHUEDV6KL3RNEN6`
   - Horizon endpoint: `https://api.testnet.minepi.com/accounts/GA3ECRFJ6SO5BW6NEIKW3ACJXNG5UNBTLRRXWC742NHUEDV6KL3RNEN6`
   - Snapshot ledger: `27665165`
   - Ledger close time: `2026-11-12T12:28:23Z`
   - Protocol version: `28`
   - Snapshot balance: `430.4171014` native units
   - Status: `USER_SUPPLIED_SNAPSHOT_NOT_INDEPENDENTLY_FETCHED`

2. **Seven deployment transaction hashes supplied with Stellar Expert Testnet URLs**
   - Blue: `CAMSQZTSCTF3MG4UEIAWKRZNSX7LLKGKXMVBEQO2ETVPGS3CINM7JBQD`
   - Gold: `CD3UAUN4FU3VHPMLOZWFQWJ2UBUUBBD37SZ7WBEGJQACJ7YF6QVE2SYG`
   - Green: `CBPG33E7RUX6MGU65IMM4HXCAGLA4OZRBOUWKQSBTIZWE2RD52VGWDT4`
   - Orange: `CB7T6TDSZ5B2MQI7NI4EG6ZASYPRMJ3XVUWS6BON4Z64OBMUJ4ZD6GKF`
   - Purple: `CCGEMIEAZFJSBTRL5VGJJAUGPJI3B7UQ3BTAB2OQGW73JMWLS57YVVA4`
   - Red: `CC6WMAHKOPWY6HW46VNKTAV4DZZLRTTNMYLDEKCAICQGMCWV5PZYNTBO`
   - Yellow: `CANLSQUPUZYKE3S2HAIGXAHMOQWE4FVX5DS7GTL42BVKSNHLFVMQSDFF`

The supplied transaction URLs use `stellar.expert/explorer/testnet`; they are recorded as **Stellar Testnet evidence**, not Pi Testnet deployment evidence. A Pi Testnet account snapshot does not establish that these contracts were deployed on Pi Testnet or that the account deployed them.

## Read-only check

Run:

```bash
bash scripts/testnet/verify-pi-testnet-account.sh
```

Optional overrides:

```bash
PI_ACCOUNT_ID=G... PI_HORIZON_BASE=https://api.testnet.minepi.com PI_SOROBAN_RPC=https://rpc.testnet.minepi.com bash scripts/testnet/verify-pi-testnet-account.sh
```

The script checks only Horizon account readback and Soroban RPC health. It never reads a secret or signs/submits a transaction.

## Contract verification gate

Do not change any asset to `TESTNET_VERIFIED` or `ACTIVE` until all of the following are captured from Pi Testnet:

- successful transaction record and ledger sequence for each deployment;
- contract instance read-back from Pi Testnet Soroban RPC;
- deployed WASM/code hash read-back and comparison to the reviewed build artifact;
- token metadata, decimals, admin/issuer and authorization state;
- reproducible verification timestamp and source endpoint.

Keep Gold as a separate unmapped registry entry until its token-layer semantics are explicitly approved. Do not silently rename Gold to Indigo. Logos are provisional UI badges and are not evidence of issuer identity.

## Legacy deployment script disabled

`ultimate_pi_rpc_orchestrator.sh` is now fail-closed. Its previous behavior used literal secret-name strings as credential values, continued after failed RPC health checks, combined deployments to two networks, parsed unvalidated CLI output, and attempted an untyped root-registry invocation. Do not use the old deployment flow. A future deployment must be a separate reviewed, single-network release with pinned WASM hashes, explicit approval, and isolated signing.
