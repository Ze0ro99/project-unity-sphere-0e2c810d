# Release Evidence Record

Copy this file for each candidate release and fill every field. Use `NOT RUN`, `NOT AVAILABLE`, or `BLOCKED` rather than leaving ambiguous blanks.

## Release identity

- Release/tag:
- UTC date:
- Release owner:
- Independent reviewer:
- Scope and excluded scope:

## Source revisions

| Repository | Branch | Commit SHA | Working tree / diff reference |
|---|---|---|---|
| PiRC | | | |
| SmartContracts | | | |
| Unity Sphere | | | |

## Toolchain and dependencies

- Rust toolchain:
- Soroban SDK:
- Python version:
- Node version:
- Lockfile hashes:
- SBOM reference:

## Build and test evidence

| Check | Command/workflow | Exact commit | Result | Evidence URL |
|---|---|---|---|---|
| PiRC reference tests | | | | |
| Economic golden vectors | | | | |
| Soroban workspace tests | | | | |
| Schema validation | | | | |
| API tests | | | | |
| Frontend build | | | | |
| Security scan | | | | |

## Contract/network evidence

- Network name and passphrase fingerprint:
- RPC endpoint identity:
- Contract crate:
- Contract ID:
- Deployment transaction hash:
- Deployment ledger:
- WASM SHA-256:
- Readback code hash:
- Admin/operator readback:
- Functional test transaction hashes:
- State/event reconciliation:

## Economic and oracle evidence

- Asset ID and atomic scale:
- Period ID:
- Revenue source and evidence hash:
- Deductions and evidence references:
- Distributable amount:
- Allocation digest:
- Oracle feed ID, sources, quorum and freshness:
- Reserve auditor, report hash, scope and as-of time:
- Limitations / exceptions:

## Runtime compatibility

- Host application and exact version:
- OS/runtime:
- Package/build checksum:
- Permission manifest:
- Test scenarios and outcomes:
- Crash/log evidence:
- Compatibility status: NOT RUN / PASS / FAIL

## Security and operations

- Threat model:
- Independent review:
- Workflow permissions review:
- Secret-handling review:
- Rollback/pause procedure:
- Incident contact/rotation:
- Known vulnerabilities:

## Final disposition

- [ ] PROPOSED
- [ ] IMPLEMENTED
- [ ] CI-VERIFIED
- [ ] TESTNET-VERIFIED
- [ ] AUDITED
- [ ] MAINNET-VERIFIED
- [ ] BLOCKED

Rationale:
Open blockers:
Approver:
Approval timestamp:

A status box may be checked only when its evidence fields are complete and independently reviewable.
