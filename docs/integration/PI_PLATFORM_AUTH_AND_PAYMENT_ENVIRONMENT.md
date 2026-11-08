# Pi Platform Integration and Environment Contract

## Official platform flow

- The browser loads the official Pi SDK and initializes it before calling other SDK methods.
- The app authenticates with the username and payments scopes.
- The backend verifies the user access token against GET https://api.minepi.com/v2/me using Bearer authorization.
- The backend uses its server API key (Authorization: Key ...) for payment lookup, approval and completion.
- A User-to-App payment is delivered only after server-side completion succeeds.
- An incomplete payment is recovered only after the authenticated user is verified and the payment's user UID matches.

## Required environment

| Variable | Where | Purpose |
|---|---|---|
| VITE_PI_SANDBOX | Frontend build | true for sandbox; set false only for a deliberately approved production build |
| PI_API_KEY | Server | Pi Platform server API key; preferred name |
| PI_NETWORK_API_KEY | Server | Legacy fallback name; do not define conflicting values |
| PI_PAYMENTS_ENABLED | Server | Explicit kill switch; must be true before payment endpoints execute |
| PI_TESTNET_SOROBAN_RPC_URL | Server/Edge Function | Pi Testnet Soroban RPC endpoint |
| PI_TESTNET_CONTRACT_ID | Server/Edge Function | Deployed test contract address |
| PI_TESTNET_START_LEDGER | Edge Function | Initial event ingestion ledger |
| PIRC_EVENT_INGEST_SECRET | Edge Function | Dedicated secret for scheduled event ingestion |

Never use a Pi Mainnet wallet secret for Testnet deployment. Never expose the Pi server API key, Supabase service-role key, deployer secret, or event-ingestion secret in browser code, logs, commits or chat.

## Payment safety rules

- The backend must verify the Pi access token and compare the verified UID with the payment's user UID before approval, completion or incomplete-payment recovery.
- Completion must verify the payment is approved and reject a transaction ID mismatch.
- Missing server API key or disabled payment flag fails closed. There is no successful mock-payment fallback in the server payment routes.
- The UI Custom Tester is preview-only; real payments are restricted to the server-side product allowlist and exact configured amounts.
- The frontend may hold the Pi access token in memory for the current authenticated session; do not persist it to localStorage.
- Do not mark a purchased entitlement active until Pi's server-side completion endpoint returns success.
- Keep sandbox and production app configuration separate. A sandbox flag alone is not evidence of a production-ready app.

## Go-live gates

1. Register the app in the Pi Developer Portal and confirm its registered URL and environment.
2. Set VITE_PI_SANDBOX=true for sandbox builds. Use false only after the Pi app is approved/configured for production.
3. Configure PI_API_KEY on the server and PI_PAYMENTS_ENABLED=false initially.
4. Test auth, ownership rejection, approval, completion, txid mismatch, duplicate callback and incomplete-payment recovery with Test Pi.
5. Verify server logs contain no access tokens, API keys or wallet secrets.
6. Enable PI_PAYMENTS_ENABLED only after the test flow and entitlement reconciliation pass.
7. Keep Mainnet launch separate from Pi Testnet Soroban contract deployment and from any CEX/DEX integration.

This repository does not assert Pi Core Team approval, Mainnet smart-contract availability, or that any Pi price/reference-value model is redeemable.
