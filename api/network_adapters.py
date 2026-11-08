"""Fail-closed, read-only Pi Testnet1 network identity and contract probes.

Testnet1 is a PiRC project alias for the Pi Testnet profile. It is not a
separate chain identifier. Endpoint reachability alone never marks an asset
or contract as verified.
"""
from __future__ import annotations

import os
from typing import Any
from urllib.parse import urlparse

import httpx

PI_NETWORK = os.getenv("PI_NETWORK", "testnet").strip().lower()
HORIZON_URL = os.getenv(
    "PI_HORIZON_URL",
    os.getenv("PI_TESTNET_HORIZON_URL", "https://api.testnet.minepi.com"),
).rstrip("/")
SOROBAN_RPC_URL = os.getenv(
    "PI_SOROBAN_RPC_URL",
    os.getenv("PI_TESTNET_SOROBAN_RPC_URL", "https://rpc.testnet.minepi.com"),
).rstrip("/")
EXPECTED_PASSPHRASE = (
    os.getenv("PI_NETWORK_PASSPHRASE")
    or os.getenv("PI_TESTNET_NETWORK_PASSPHRASE")
)
EXPECTED_PROTOCOL = os.getenv("PI_PROTOCOL_EXPECTED", "28").strip()
TIMEOUT_SECONDS = float(os.getenv("PI_TESTNET_HTTP_TIMEOUT_SECONDS", "5"))
DEFAULT_ALLOWED_HOSTS = {"api.testnet.minepi.com", "rpc.testnet.minepi.com"}
ALLOWED_HOSTS = {
    host.strip().lower()
    for host in os.getenv("PI_TESTNET_ALLOWED_HOSTS", "").split(",")
    if host.strip()
} or DEFAULT_ALLOWED_HOSTS


def _endpoint_allowed(url: str, expected_host: str) -> bool:
    parsed = urlparse(url)
    return (
        parsed.scheme == "https"
        and parsed.hostname is not None
        and parsed.hostname.lower() == expected_host
        and parsed.hostname.lower() in ALLOWED_HOSTS
        and parsed.username is None
        and parsed.password is None
    )


def _get_json(client: httpx.Client, url: str) -> tuple[bool, dict[str, Any] | None, str | None]:
    try:
        response = client.get(url)
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            return False, None, "Unexpected non-object response"
        return True, payload, None
    except (httpx.HTTPError, ValueError) as exc:
        return False, None, str(exc)[:300]


def _rpc(client: httpx.Client, method: str) -> dict[str, Any]:
    try:
        response = client.post(
            SOROBAN_RPC_URL,
            json={"jsonrpc": "2.0", "id": 1, "method": method, "params": {}},
        )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            return {"ok": False, "error": "Unexpected non-object RPC response"}
        if payload.get("error"):
            return {"ok": False, "error": str(payload["error"])[:300]}
        result = payload.get("result")
        if not isinstance(result, dict):
            return {"ok": False, "error": "RPC response omitted result object"}
        return {"ok": True, "result": result}
    except (httpx.HTTPError, ValueError) as exc:
        return {"ok": False, "error": str(exc)[:300]}


def check_pi_testnet() -> dict[str, Any]:
    """Probe endpoints and independently verify the configured network identity.

    The function is read-only. It does not sign, submit, deploy, mint, or transfer.
    """
    config_ok = (
        PI_NETWORK == "testnet"
        and _endpoint_allowed(HORIZON_URL, "api.testnet.minepi.com")
        and _endpoint_allowed(SOROBAN_RPC_URL, "rpc.testnet.minepi.com")
    )
    if not config_ok:
        return {
            "network_id": "pi-testnet1",
            "network_alias": "Testnet1",
            "status": "blocked",
            "configuration": "INVALID_OR_NOT_TESTNET",
            "identity_verified": False,
            "contract_verification": "NOT_PERFORMED",
            "notice": "Only the explicit Pi Testnet profile is permitted by this read-only adapter.",
        }

    with httpx.Client(timeout=TIMEOUT_SECONDS, follow_redirects=False) as client:
        horizon_ok, horizon_root, horizon_error = _get_json(client, f"{HORIZON_URL}/")
        rpc_network = _rpc(client, "getNetwork")
        rpc_health = _rpc(client, "getHealth")
        latest_ledger = _rpc(client, "getLatestLedger")

    horizon_passphrase = (horizon_root or {}).get("network_passphrase")
    rpc_network_data = rpc_network.get("result") or {}
    rpc_passphrase = (
        rpc_network_data.get("passphrase")
        or rpc_network_data.get("networkPassphrase")
    )
    rpc_protocol = rpc_network_data.get("protocolVersion")
    horizon_protocol = (horizon_root or {}).get("core_supported_protocol_version")

    health_data = rpc_health.get("result") or {}
    health_status = str(health_data.get("status", "")).lower()
    health_ok = rpc_health.get("ok", False) and health_status in {"healthy", "ok"}
    rpc_ok = (
        rpc_network.get("ok", False)
        and health_ok
        and latest_ledger.get("ok", False)
    )
    endpoints_reachable = horizon_ok and rpc_ok

    passphrase_matches = bool(
        EXPECTED_PASSPHRASE
        and horizon_passphrase == EXPECTED_PASSPHRASE
        and rpc_passphrase == EXPECTED_PASSPHRASE
    )
    try:
        expected_protocol = int(EXPECTED_PROTOCOL)
        protocol_matches = (
            rpc_protocol is not None
            and horizon_protocol is not None
            and int(rpc_protocol) == expected_protocol
            and int(horizon_protocol) >= expected_protocol
        )
    except (TypeError, ValueError):
        expected_protocol = None
        protocol_matches = False

    identity_verified = (
        PI_NETWORK == "testnet"
        and endpoints_reachable
        and passphrase_matches
        and protocol_matches
    )

    if identity_verified:
        status = "verified"
    elif endpoints_reachable and not EXPECTED_PASSPHRASE:
        status = "reachable_unverified"
    elif endpoints_reachable:
        status = "identity_mismatch"
    else:
        status = "degraded"

    return {
        "network_id": "pi-testnet1",
        "network_alias": "Testnet1",
        "configured_network": PI_NETWORK,
        "status": status,
        "identity_verified": identity_verified,
        "expected_protocol": expected_protocol,
        "observed_protocol": {
            "horizon_supported": horizon_protocol,
            "soroban_rpc": rpc_protocol,
        },
        "passphrase_checks": {
            "expected_configured": bool(EXPECTED_PASSPHRASE),
            "horizon_matches": bool(EXPECTED_PASSPHRASE and horizon_passphrase == EXPECTED_PASSPHRASE),
            "rpc_matches": bool(EXPECTED_PASSPHRASE and rpc_passphrase == EXPECTED_PASSPHRASE),
        },
        "horizon": {
            "url": HORIZON_URL,
            "reachable": horizon_ok,
            "error": horizon_error,
        },
        "soroban_rpc": {
            "url": SOROBAN_RPC_URL,
            "reachable": rpc_ok,
            "network": rpc_network,
            "health": rpc_health,
            "latest_ledger": latest_ledger,
        },
        "contract_verification": "NOT_PERFORMED",
        "notice": (
            "Read-only network identity check. This is not contract deployment, "
            "code-hash, issuer, asset, reserve, wallet-signing, or trading verification."
        ),
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
            "network_id": "pi-testnet1",
        }
    except Exception as exc:
        return {
            "probe_status": "RPC_UNAVAILABLE",
            "contract_instance_present": None,
            "rpc_url": SOROBAN_RPC_URL,
            "network_id": "pi-testnet1",
            "error": str(exc)[:300],
        }
