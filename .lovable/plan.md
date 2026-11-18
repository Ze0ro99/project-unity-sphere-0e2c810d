# Pinework Nexus — read-only audit and staged completion plan

Nothing was changed during this audit. Branch observed: `edit/edt-19349356-…` (isolated Lovable edit branch). Remote: Lovable internal git; the GitHub mirror and its sync branch are not visible from here (UNKNOWN).

## 1. Verified findings (checked this turn)

| Area | Finding |
|---|---|
| Project identity | `supabase/config.toml` project_id = `iirymtunobrpjlxxnuad` (this app's Lovable Cloud). Browser code in `src/lib/portal-feed.ts` and `src/lib/ousd-status.ts` targets a **different** project `naeuosudklqsgeghafkw`. **Mismatch flagged:** the "only ousd-public-status and pirc-portal-feed" project is the external one, not this app's Cloud. |
| `.env` | Missing from the working tree (blank-screen risk previously fixed via `vite.config.ts` fallbacks). |
| Function code in repo | `market-index`, `pi-payments`, `pirc-events-feed`, `pirc-portal-feed`, `pirc-soroban-event-ingest`. `pi-payments` and `pirc-soroban-event-ingest` have `verify_jwt = false`. |
| Pi auth | `pi-payments` verifies `Pi.authenticate()` access token via `api.minepi.com/v2/me`. `src/lib/piOAuth.ts` is a separate Pi Sign-in (OAuth) flow. |
| Payment kill-switch | `PI_PAYMENTS_ENABLED` appears only in `PiRC-Alpha-Hub/server.ts` and a docs file — **not enforced in `pi-payments`**. |
| `complete` action | `accessToken` is optional on `complete`; ownership relies on Pi Platform payment lookup only. |
| DB tables (live) | 9 public tables. `pirc_soroban_event_inbox` / `_cursors` from migration `20261108130000` **do not exist** in this database (migration not applied). |
| Identity mapping | `service_orders` RLS compares `user_uid` to `auth.jwt()->>'sub'` (Cloud auth user), while orders are keyed by Pi UID. Pi-only users have no Cloud JWT, so these policies cannot match them. |
| Tests | Node test files in `tests/` (evidence, portal-feed, canonical-feed, protocol, pi-signin, ippr, amm, etc.); no single `npm test` aggregating all; Python/Rust tests are not run by npm. |

## 2. Unknown (not verifiable read-only from here)
- Which functions are actually deployed on `iirymtunobrpjlxxnuad` vs the external project.
- Whether `PI_TESTNET_*` env values and `PIRC_EVENT_INGEST_SECRET` exist (not in the secret list shown: only PI_API_KEY / PI_NETWORK_API_KEY are).
- Pi Testnet network passphrase, Soroban RPC availability on `rpc.testnet.minepi.com`, and any deployed contract IDs.
- Real Pi Browser auth/payment behavior; GitHub main state and parity of PiRC / SmartContracts / Unity Sphere schemas.

## 3. Staged plan

**Stage A — Payment safety (code only, `supabase/functions/pi-payments/index.ts`)**
- Enforce `PI_PAYMENTS_ENABLED` (default off): `approve`/`complete` return 503 `payments_disabled`; `health` reports the flag.
- Require `accessToken` on `complete`; verify `/me` uid equals payment `user_uid`, payment `amount`/`memo`/`metadata.order_id` match stored order, network = Testnet, and `transaction.txid` equals submitted txid and `verified=true`.
- Idempotency: reject re-complete of already completed payment; record events in `service_payment_events` via service role.
- Tests: `tests/pi-payments-guard.test.mjs` (pure validator module extracted to `pi-payments/guards.ts`).

**Stage B — Identity mapping (migration, needs your approval)**
- Add `public.pi_identities(pi_uid text pk, auth_user_id uuid null, username, verified_at)`; RLS: service role write, owner read.
- Replace `service_orders` policies with Pi-UID ownership enforced server-side (orders created/read only through the function after `/me` verification); keep Cloud-auth path for site accounts.
- Tests: ownership tests extending existing auth tests.

**Stage C — Soroban ingestion (migration + function, needs approval)**
- Apply `20261108130000` inbox/cursor migration to this Cloud DB (service-role only, unique `(network_id, contract_id, event_id)`).
- Ingest gate: require `PIRC_EVENT_INGEST_SECRET` header, Horizon passphrase + protocol identity check before any write, single poller lock per cursor, stop when no contract IDs configured.
- Tests: cursor advance, duplicate event idempotency, identity mismatch → UNKNOWN/no write.

**Stage D — Registry & evidence (frontend)**
- `src/lib/evidence.ts` + EvidenceBadge: registry entries are SIMULATED unless a contract ID returns a fresh closed-ledger read-back; remove remaining "deployed/live" copy in PiDEX, PiGold, Oracle, Testnet, Repository.
- Tests: extend `tests/evidence.test.mjs`, `tests/gateway-claims.test.mjs`.

**Stage E — Schema/API/economic parity**
- Add `schemas/` JSON Schemas (order, payment event, soroban event, registry entry, IPPR quote) and a parity test comparing constants (denomination, IPPR ×10,000,000 model, fees) against `src/lib/*`. Cross-repo comparison needs the canonical files supplied or readable from GitHub.

**Stage F — Test runner**
- Add `npm test` running all safe Node tests; leave Python/Rust as optional documented commands.

## 4. Acceptance criteria
- With flag off, approve/complete never call Pi `/approve` or `/complete`.
- `complete` without token, wrong uid, mismatched txid/amount → 4xx, no state change.
- Pi-only user sees only own orders; other users get none.
- Duplicate Soroban events insert once; cursor monotonic; identity mismatch writes nothing.
- No screen shows VERIFIED/ACTIVE/live liquidity without fresh read-back evidence.
- Build passes; `npm test` green.

## 5. User-controlled actions (I will not do these)
- Set `PI_PAYMENTS_ENABLED`, `PIRC_EVENT_INGEST_SECRET`, `PI_TESTNET_*` secrets.
- Approve each migration (Stages B, C) and function deployment.
- Pi Developer Portal: app sandbox/Testnet setting, validation key, payment wallet.
- Decide which backend project is canonical for the event feed (this Cloud vs `naeuosudklqsgeghafkw`).
- Any Testnet contract deployment, publishing, Vercel/Netlify, GitHub main merges. Mainnet stays disabled.
