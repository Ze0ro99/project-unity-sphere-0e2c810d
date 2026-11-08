# Unity Sphere Portal, Pi Network, and Integration Status

## Application entry points

- Lovable application: https://project-unity-sphere.lovable.app
- Pi Browser listing: https://paralleleconomy5658.pinet.com
- Source repository: https://github.com/Ze0ro99/project-unity-sphere-0e2c810d

The application is a React/Vite frontend. Lovable publishing and Pi Browser listing are separate distribution surfaces; publishing a new GitHub commit does not by itself prove that either surface has deployed that commit.

## Language behavior

The shared locale provider supports English, Arabic, Chinese, Indonesian, French, Spanish, German, and Portuguese. The selected locale is persisted in local storage, detected from the browser language on first visit, synchronized across same-origin tabs, and applied to the document `lang` and `dir` attributes. The language selector is visible on mobile.

Arabic uses RTL layout. Numeric identifiers, hashes, and contract addresses are isolated as LTR content within RTL pages.

Translation coverage is not yet complete across every visible page:
- English, Arabic, Chinese, and Indonesian have the existing shared 128-key dictionary.
- French, Spanish, German, and Portuguese currently cover the shared navigation, gateway/compliance shell, wallet control, and footer; untranslated page-level content falls back to English.
- A complete page-by-page translation and native-language review remains a release requirement. Do not describe these four new locales as fully translated until that pass is complete.

All source identifiers, code comments, API contracts, tests, and engineering documentation remain in English.

## Network and execution boundaries

| Surface | Current behavior | What it does not prove |
|---|---|---|
| Pi Platform SDK | Loads the official Pi SDK and requests Pi authentication in the client | Does not prove the user is authorized for every app capability or that a payment completed |
| Pi Mainnet Horizon | Read-only ledger, transaction, account, and network reads | Does not provide Soroban contract event consensus or execute trades |
| Pi market index | Off-chain public exchange quotes aggregated by a Supabase Edge Function | Not an on-chain oracle, executable quote, or guaranteed liquidity |
| PiDEX order engine | Local in-browser simulation for orders, balances, fills, and liquidity | No on-chain order, deposit, withdrawal, or AMM swap is executed |
| Pi Testnet Soroban inbox | Server-side bounded raw-event ingestion with durable cursor and idempotent storage | No XDR decoding, settlement projection, finality proof, signing, or transaction submission |
| Smart contracts | Contract references and deployment runbooks are present in source | A registry address or a Horizon account check alone does not prove deployed code, correct WASM hash, authority, or audit status |

Horizon network selection is explicit. A failed Mainnet request must not silently switch to Testnet, and Testnet evidence must never be presented as Mainnet evidence.

## Security controls

- Pi wallet connection must not trigger a payment. A payment must be a separate, explicit user action with a known product, amount, memo, and server-side allowlist.
- Pi access tokens and server API keys remain server-side where required; do not put secrets in frontend environment variables or commit them to Git.
- The Soroban event inbox is service-role-only and requires a high-entropy ingestion secret.
- An observed event is evidence for later reconciliation, not proof of settled accounting.
- No Mainnet deployment or financial transaction is part of the portal localization work.

## Release gates

1. Build and static security checks pass on the proposed commit.
2. Verify the selected locale on every route at desktop and mobile widths, including a fresh browser profile and a second tab.
3. Test Pi authentication in the Pi Browser and the Pi Developer Sandbox separately.
4. Verify Supabase function deployment and health without exposing service-role credentials.
5. Verify the configured Pi Testnet Soroban RPC network, passphrase, contract ID, retention window, and event cursor.
6. Decode canonical contract events, fetch transaction status, read the contract's canonical settlement state, and compare the on-chain settlement digest before enabling any settlement projection.
7. Verify contract code hash, initialization state, admin/issuer authority, and deployment evidence for each contract.
8. Publish through Lovable and confirm the published build hash/version. Confirm the Pi Browser listing independently.

## Known external listing status

The public PiNet page currently displays the listing status as **Unverified**. Availability inside Pi Browser is not the same as Pi Core Team verification, KYB approval, or endorsement.
