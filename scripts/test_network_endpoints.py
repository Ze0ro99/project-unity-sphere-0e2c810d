#!/usr/bin/env python3
"""Read-only connectivity smoke tests for Pi Testnet and Stellar Testnet."""
from __future__ import annotations

import json
import os
import sys
from typing import Any

import httpx

from api.network_adapters import check_pi_testnet

STELLAR_HORIZON = os.getenv("STELLAR_TESTNET_HORIZON_URL", "https://horizon-testnet.stellar.org").rstrip("/")
STELLAR_RPC = os.getenv("STELLAR_TESTNET_RPC_URL", "https://soroban-testnet.stellar.org").rstrip("/")
TIMEOUT = float(os.getenv("NETWORK_SMOKE_TIMEOUT_SECONDS", "15"))


def rpc_probe(client: httpx.Client, endpoint: str) -> dict[str, Any]:
    results: dict[str, Any] = {}
    for method in ("getHealth", "getLatestLedger"):
        try:
            response = client.post(
                endpoint,
                json={"jsonrpc": "2.0", "id": method, "method": method, "params": {}},
            )
            response.raise_for_status()
            payload = response.json()
            if payload.get("error") or payload.get("result") is None:
                results[method] = {"ok": False, "error": str(payload.get("error", "missing result"))[:300]}
            else:
                results[method] = {"ok": True, "result": payload["result"]}
        except (httpx.HTTPError, ValueError) as exc:
            results[method] = {"ok": False, "error": str(exc)[:300]}
    return {
        "url": endpoint,
        "reachable": all(item.get("ok") for item in results.values()),
        "methods": results,
    }


def horizon_probe(client: httpx.Client, endpoint: str) -> dict[str, Any]:
    try:
        response = client.get(endpoint + "/")
        response.raise_for_status()
        return {"url": endpoint, "reachable": True, "http_status": response.status_code}
    except httpx.HTTPError as exc:
        return {"url": endpoint, "reachable": False, "error": str(exc)[:300]}


def main() -> int:
    pi = check_pi_testnet()
    with httpx.Client(timeout=TIMEOUT, follow_redirects=True) as client:
        stellar = {
            "network_id": "stellar-testnet",
            "network_passphrase": "Test SDF Network ; September 2015",
            "horizon": horizon_probe(client, STELLAR_HORIZON),
            "soroban_rpc": rpc_probe(client, STELLAR_RPC),
        }

    report = {
        "pi_testnet": pi,
        "stellar_testnet": stellar,
        "scope": "READ_ONLY_ENDPOINT_HEALTH_AND_LEDGER_READBACK",
        "not_proven": [
            "contract deployment",
            "contract source or code-hash identity",
            "issuer authorization",
            "audit completion",
            "token reserves or redemption",
        ],
    }
    print(json.dumps(report, indent=2, sort_keys=True))

    pi_rpc_ok = bool(pi.get("identity_verified"))
    stellar_ok = bool(stellar["horizon"]["reachable"] and stellar["soroban_rpc"]["reachable"])
    if not pi_rpc_ok or not stellar_ok:
        print("Pi Testnet identity or one of the separate testnet read-only probes failed.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
