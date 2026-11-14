#!/usr/bin/env bash
set -Eeuo pipefail

PI_HORIZON_BASE="${PI_HORIZON_BASE:-https://api.testnet.minepi.com}"
PI_SOROBAN_RPC="${PI_SOROBAN_RPC:-https://rpc.testnet.minepi.com}"
PI_ACCOUNT_ID="${PI_ACCOUNT_ID:-GA3ECRFJ6SO5BW6NEIKW3ACJXNG5UNBTLRRXWC742NHUEDV6KL3RNEN6}"

for bin in curl jq; do
  command -v "$bin" >/dev/null 2>&1 || { echo "ERROR: required command not found: $bin" >&2; exit 2; }
done

if [[ ! "$PI_ACCOUNT_ID" =~ ^G[A-Z2-7]{55}$ ]]; then
  echo "ERROR: PI_ACCOUNT_ID is not a valid Stellar/Pi public account address." >&2
  exit 2
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

echo "[1/2] Reading Pi Testnet Horizon account (read-only)..."
http_code="$(curl --silent --show-error --location --output "$tmpdir/account.json" --write-out '%{http_code}' \
  "$PI_HORIZON_BASE/accounts/$PI_ACCOUNT_ID")"
if [[ "$http_code" != "200" ]]; then
  echo "ERROR: Horizon account lookup returned HTTP $http_code." >&2
  exit 1
fi

returned_id="$(jq -r '.account_id // .id // empty' "$tmpdir/account.json")"
if [[ "$returned_id" != "$PI_ACCOUNT_ID" ]]; then
  echo "ERROR: Horizon response account ID does not match requested account." >&2
  exit 1
fi
jq '{account_id, sequence, sequence_ledger, last_modified_ledger, last_modified_time, home_domain, balances}' "$tmpdir/account.json"

echo "[2/2] Checking Pi Testnet Soroban RPC health (read-only)..."
rpc_code="$(curl --silent --show-error --location --output "$tmpdir/health.json" --write-out '%{http_code}' \
  --header 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' "$PI_SOROBAN_RPC")"
if [[ "$rpc_code" != "200" ]]; then
  echo "ERROR: Pi Soroban RPC health request returned HTTP $rpc_code." >&2
  exit 1
fi
jq . "$tmpdir/health.json"
health_status="$(jq -r '.result.status // .status // empty' "$tmpdir/health.json")"
if [[ "$health_status" != "healthy" && "$health_status" != "ok" ]]; then
  echo "ERROR: RPC did not report a healthy/ok status; refusing to continue." >&2
  exit 1
fi

cat <<'NOTICE'

PASS: Pi Testnet account is readable and the Soroban RPC reports healthy.
LIMIT: This script does NOT verify contract instances, WASM/code hashes, token
metadata, issuer authorization, or any of the seven deployment transactions.
It performs no signing, deployment, invocation, minting, payment, or transfer.
NOTICE
