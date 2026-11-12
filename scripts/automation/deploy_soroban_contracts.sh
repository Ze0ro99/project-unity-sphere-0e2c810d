#!/usr/bin/env bash
# DEPRECATED AND BLOCKED.
# This legacy script mutates contract source files, deploys every discovered Cargo package
# to Stellar public Testnet, retries network writes, and pushes changes directly to main.
# Do not re-enable. Use the reviewed Pi Testnet allowlist + read-only preflight workflow
# until a separately approved, network-pinned deployment controller is implemented.
set -euo pipefail
echo "BLOCKED: legacy bulk Soroban deployment is disabled."
echo "Reason: source mutation, unrestricted package iteration, non-Pi network defaults, and direct main push."
echo "No files were modified. No network requests or transactions were submitted."
exit 1
