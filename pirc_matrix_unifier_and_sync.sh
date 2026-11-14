#!/usr/bin/env bash
set -euo pipefail

cat <<'NOTICE'
DEPRECATED AND DISABLED: pirc_matrix_unifier_and_sync.sh

This legacy script is unsafe and must not be run. It:
- merges every matching remote branch into main with conflict preference (-X theirs);
- writes synthetic token attributes and labels unverified contract references ACTIVE;
- regenerates registry files with unsupported deployment dates/status claims;
- pushes directly to origin/main.

No branch merge, registry rewrite, deployment, signing, minting, transfer or push is performed.
Use reviewed pull requests, the canonical portal feed, and evidence-backed registry updates instead.
NOTICE

exit 2
