#!/usr/bin/env bash
set -Eeuo pipefail

cat <<'NOTICE'
DEPRECATED / FAIL-CLOSED

This legacy orchestrator is disabled because it:
- attempted dual-network deployments in one run;
- used secret names as literal secret values;
- continued after RPC health-check failure;
- parsed CLI output with tail -1 without validating the returned contract ID;
- invoked a root initializer with an untyped comma-separated argument;
- included an unsafe generated-source fallback instead of requiring reviewed build artifacts.

No deployment, signing, invocation, minting, or transfer is performed here.

Use scripts/testnet/verify-pi-testnet-account.sh for read-only account/RPC checks.
Contract deployment requires a separate reviewed release procedure, verified WASM hashes,
explicit operator approval, and a protected signing environment.
NOTICE

exit 2
