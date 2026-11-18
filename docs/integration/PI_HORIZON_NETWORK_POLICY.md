# Pi Horizon Network Selection Policy

The Horizon client helpers default to Pi Testnet 1. This prevents a caller that omits a network argument from silently reading Mainnet.

- Default for fetchLatestLedgers, fetchLatestTx, fetchRoot, fetchAccount and fetchIssuedAssets: https://api.testnet.minepi.com
- Mainnet reads must pass HORIZON_MAINNET explicitly at the call site and be labelled as Mainnet in the UI.
- Testnet1 reads must pass HORIZON_TESTNET explicitly where the network matters for clarity.
- A failed Testnet request must never trigger an automatic Mainnet fallback.
- Writes and signing are not implemented by these read-only Horizon helpers.

Run the network-default regression test with the repository's Node test command.