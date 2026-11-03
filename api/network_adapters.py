"""Read-only Pi Testnet endpoint probes.

These checks confirm service reachability only; they do not prove a particular
contract is deployed, audited, issuer-authorized, or safe to trade.
"""
from __future__ import annotations

import os
from typing import Any

import httpx

HORIZON_URL = os.getenv("PI_TESTNET_HORIZON_URL", "https://api.testnet.minepi.com").rstrip("/")
SOROBAN_RPC_URL = os.getenv("PI_TESTNET_SOROBAN_RPC_URL", "https://rpc.testnet.minepi.com").rstrip("/")
TIMEOUT_SECONDS = float(os.getenv("PI_TESTNET_HTTP_TIMEOUT_SECONDS", "5"))


def _get_horizon(client: httpx.Client) -> dict[str, Any]:
    try:
        response = client.get(f"{HORIZON_URL}/")
        response.raise_for_status()
        return {"url": HORIZON_URL, "reachable": True, "http_status": response.status_code}
    except (httpx.HTTPError, ValueError) as exc:
        return {"url": HORIZON_URL, "reachable": False, "error": str(exc)[:300]}


def _rpc(client: httpx.Client, method: str) -> dict[str, Any]:
    try:
        response = client.post(
            SOROBAN_RPC_URL,
            json={"jsonrpc": "2.0", "id": 1, "method": method, "params": {}},
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("error"):
            return {"ok": False, "error": str(payload["error"])[:300]}
        return {"ok": True, "result": payload.get("result")}
    except (httpx.HTTPError, ValueError) as exc:
        return {"ok": False, "error": str(exc)[:300]}


def check_pi_testnet() -> dict[str, Any]:
    with httpx.Client(timeout=TIMEOUT_SECONDS, follow_redirects=True) as client:
        horizon = _get_horizon(client)
        rpc_health = _rpc(client, "getHealth")
        latest_ledger = _rpc(client, "getLatestLedger")

    rpc_result = rpc_health.get("result") or {}
    rpc_health_ok = rpc_health.get("ok", False) and (
        not isinstance(rpc_result, dict)
        or str(rpc_result.get("status", "healthy")).lower() in {"healthy", "ok"}
    )
    ledger_result = latest_ledger.get("result") or {}
    rpc_ok = rpc_health_ok and latest_ledger.get("ok", False)
    reachable = horizon.get("reachable", False) and rpc_ok

    return {
        "network_id": "pi-testnet",
        "network_passphrase": "Pi Testnet",
        "status": "reachable" if reachable else "degraded",
        "horizon": horizon,
        "soroban_rpc": {
            "url": SOROBAN_RPC_URL,
            "reachable": rpc_ok,
            "health": rpc_health,
            "latest_ledger": ledger_result,
        },
        "contract_verification": "NOT_PERFORMED",
        "notice": "Endpoint reachability is not contract deployment, issuer, code-hash, reserve or audit verification.",
    }


def verify_contract_instance(contract_id: str) -> dict[str, Any]:
    """Check whether a Soroban contract-instance ledger entry exists on Pi Testnet.

    A present instance is deployment evidence only; it does not establish the
    contract's source, issuer authority, audit status, economic claims or safety.
    """
    import re

    if not re.fullmatch(r"C[A-Z2-7]{55}", contract_id or ""):
        return {
            "probe_status": "INVALID_CONTRACT_ID",
            "contract_instance_present": None,
            "error": "Identifier is not a valid-format Soroban contract address.",
        }

    try:
        from stellar_sdk import SorobanServer, xdr
        from stellar_sdk.soroban_server import Durability

        server = SorobanServer(SOROBAN_RPC_URL)
        try:
            key = xdr.SCVal(type=xdr.SCValType.SCV_LEDGER_KEY_CONTRACT_INSTANCE)
            entry = server.get_contract_data(contract_id, key, Durability.PERSISTENT)
        finally:
            server.close()

        present = entry is not None
        return {
            "probe_status": "FOUND" if present else "NOT_FOUND",
            "contract_instance_present": present,
            "rpc_url": SOROBAN_RPC_URL,
        }
    except Exception as exc:
        return {
            "probe_status": "RPC_UNAVAILABLE",
            "contract_instance_present": None,
            "rpc_url": SOROBAN_RPC_URL,
            "error": str(exc)[:300],
        }
