# Branch Intake and Risk Review — 2026-11-03

Status: selective source review. This is not an exhaustive line-by-line audit of all 577 branch references and does not authorize merging or deployment.

## Integration principles

- Keep all original branches and commit history intact.
- Integrate unique, reviewed application logic; do not merge whole branches solely because their names sound relevant.
- Preserve the PiRC-207 seven-color proposal mapping: Red, Orange, Yellow, Green, Blue, Indigo, Purple, in that order.
- Keep the separate Unity Sphere registry order and identifiers unchanged. Gold remains an unresolved registry entry; it is not an alias for Indigo.
- Keep all workflow and deployment changes disabled until their permissions, secret handling, destructive operations and release gates are reviewed.

## Reviewed branch deltas

| Repository | Branch | Compare result against integration | Review decision |
|---|---|---|---|
| PiRC | feat/economic-dashboard | 1 unique commit, 4 changed files | Economic simulator concept is represented in the application integration branch. Its dashboard claims must be reduced to the actual deterministic simulation implementation. |
| PiRC | feature/micar-eu-institutional-compliance | 4 unique commits, 2 changed files | Do not copy its PiRC-207 registry JSON as-is: issuer string contains an invalid Base32 digit zero, it uses a non-canonical RPC endpoint, and it retains the Gold/Indigo mismatch. Preserve the branch for further standards review. |
| PiRC | economics/adaptive-utility | 0 unique commits relative to integration; branch is behind | No distinct commit to merge in this comparison. |
| PiRC | feature/ecosystem-tokenomics-and-sdk | 0 unique commits relative to integration; branch is behind | No distinct commit to merge in this comparison. |
| Unity Sphere | feat/live-micro-denomination | 3 unique commits, 3 new files | Integrate the source-mapped proposal values and exact atomic-unit conversion only. Do not assume external venues list a separately traded micro-Pi asset. |
| Unity Sphere | economics/adaptive-utility | 195 unique commits, 300 changed files | Do not merge wholesale. The reviewed master-orchestrator workflow deletes source directories, checks out all remote branches into one working tree, requests production environment permissions, and includes signing and Testnet transaction logic. |
| Unity Sphere | feature/eternal-sync-pipeline | 186 unique commits, 300 changed files | Do not merge wholesale. Its workflow family overlaps the same broad orchestration/deployment pattern and requires file-by-file security review. |
| Unity Sphere | feat/economic-dashboard (already ported) | Simulation module exists in integration | Corrected the market quote / IPPR unit mismatch and relabelled collateral and emission values as simulation outputs. |
| SmartContracts | feature/auto-integration-pirc-214 | 1 unique commit, 4 changed files | Reference scaffold only; not a substitute for the canonical Oracle V2 contract or a quorum implementation. |

## Specific unsafe automation found

The reviewed Unity Sphere branch economics/adaptive-utility contains a master-orchestrator workflow that:
- runs on pushes to main;
- requests contents:write and a production environment;
- removes directories including contracts, economics, security, docs and extensions before harvesting branch content;
- checks out every remote branch into the same working tree, which can overwrite files nondeterministically;
- uses repository secrets for issuer/distributor signing and submits transactions;
- attempts token payments and liquidity-pool operations;
- writes a generated asset TOML and pushes commits to main.

This workflow is not safe to merge or activate. It must be replaced by explicit, reviewed, least-privilege workflows with manual approval, environment-scoped secrets, dry-run mode, allowlisted contract manifests, idempotency, transaction simulation, and protected deployment environments. No automatic all-branch harvesting or all-contract deployment is permitted.

The reviewed deploy-contracts workflow also loops through every Cargo.toml and deploys any produced WASM. It has no allowlisted release manifest, no per-contract review gate, and no robust deployment verification. Do not enable it.

## Changes safely represented in the integration branch

- Added PiRC economic-system blueprint with value taxonomy, provenance, revenue-funded distribution constraints, and explicit research-only treatment of the GCV / sovereign ratio.
- Added a separate PiRC-207 proposal-value module without contract IDs; it does not overwrite the registry source.
- Added exact seven-decimal Pi stroop conversion helpers using integer arithmetic. Stroops are atomic accounting units, not a separate exchange-traded asset.
- Corrected the economic dashboard so a PI/USD quote is not multiplied by 10,000,000 without unit evidence. The scenario index is now separate from the venue quote.
- Added a simulation circuit-breaker behavior that sets modeled emission to zero when the modeled threshold is breached.
- Updated dashboard language to avoid presenting model outputs as actual reserves, collateral, solvency, or live issuance.
- Hardened PIRC-103 balance arithmetic and PIRC-260 asset registration/ownership edge cases in the SmartContracts integration branch.

## Remaining evidence required

- Complete branch-by-branch diff and duplicate-head review across all refs.
- Rust workspace formatting, unit tests, WASM builds and security analysis.
- Frontend typecheck/build and API integration tests.
- Oracle quorum, stale-data, replay, deviation and cross-chain proof tests.
- Verified deployment transactions, contract IDs and code hashes per network.
- Independent security review and legal/compliance approval before any production financial capability is enabled.
