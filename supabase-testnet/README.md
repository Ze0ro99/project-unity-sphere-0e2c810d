# OUSD Testnet 1 observability

This is a separate Supabase project from the primary app database.

- Project: pirc-unity-sphere-testnet
- Project ref: naeuosudklqsgeghafkw
- Network scope: Pi Testnet 1 only
- Status endpoint: /functions/v1/ousd-public-status
- Writes: none from the public endpoint

The migration creates private service-role-only registries for contract deployment, reserve attestations, liabilities, payout attestations, oracle observations and read-only pool snapshots. The public status endpoint returns only aggregate fields and never exposes beneficiary addresses, evidence hashes, or raw source documents.

The registry is seeded as source_only_not_deployed. It must remain that way until the token and controller contracts are deployed to Pi Testnet 1, their contract IDs and WASM hashes are verified, and a readback confirms the live state.

Reserve verification means an authorized attestor marked a record verified; it is not independent proof of bank funds. The status page must never describe the test token as an official Pi asset, a USD-backed stablecoin, or a guaranteed redemption instrument.

The repository's primary Supabase configuration under supabase/ points to a different project. Do not run a root-level Supabase CLI push against the testnet project. The existing six event-ingestion migrations were applied to this secondary project on 2026-11-14 via the Supabase control plane; this secondary project directory records the new OUSD migration and deployment target separately.


## Deployment verification — 2026-11-18

- The OUSD observability migration was applied to project naeuosudklqsgeghafkw.
- Six private OUSD tables were confirmed present with RLS enabled and service_role-only policies.
- The public aggregate view returned one row for pi-testnet with status source_only_not_deployed, null contract IDs, zero attested reserve, zero liabilities and no token supply readback.
- Edge Function ousd-public-status is ACTIVE (version 1) with verify_jwt=false. This is intentional because it exposes only aggregate status fields and supports GET/OPTIONS; it has no write path and never returns beneficiary addresses or evidence hashes.
- The public endpoint URL is https://naeuosudklqsgeghafkw.supabase.co/functions/v1/ousd-public-status.

No contract was deployed and no reserve or liability was inserted. The source-only status is the correct current result.
