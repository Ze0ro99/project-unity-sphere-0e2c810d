#!/usr/bin/env bash
set -Eeuo pipefail

cat <<'NOTICE'
DEPRECATED / FAIL-CLOSED — pirc_matrix_unifier_and_sync.sh

This legacy script is intentionally disabled. It previously:
- merged remote feature branches automatically with conflict preference (-X theirs);
- rewrote stellarConfig.js with unverified contract IDs and fabricated ACTIVE,
  QWF, solvency and capacity attributes;
- overwrote LIVE_MATRIX_REGISTRY.csv and sovereign_manifest.json with unsupported
  deployment/compliance claims;
- deleted temporary/backup files without a scoped allowlist;
- committed and pushed directly to main;
- reported success even when tests were skipped or failed.

No repository mutation, branch merge, file deletion, commit, push, signing,
contract deployment, minting, transfer or Mainnet action is performed here.

Use reviewed pull requests, evidence-backed registry updates and the dedicated
read-only Testnet verification scripts. Any future migration must be scoped,
reproducible, tested and approved before execution.
NOTICE

exit 2
