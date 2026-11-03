from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from api.network_adapters import check_pi_testnet

router = APIRouter(tags=["asset-registry"])

_REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
_REGISTRY_FILE = _REPOSITORY_ROOT / "assets" / "registry" / "pirc207-layer-registry.json"
_LOGO_DIR = _REPOSITORY_ROOT / "assets" / "logos"
_LOGO_FILES = {
    "root": "root-placeholder.svg",
    "sacral": "sacral-placeholder.svg",
    "solar": "solar-placeholder.svg",
    "heart": "heart-placeholder.svg",
    "throat": "throat-placeholder.svg",
    "thirdeye": "thirdEye-placeholder.svg",
    "crown": "crown-placeholder.svg",
    "gold-unmapped": "gold-unmapped-placeholder.svg",
    "ousd": "ousd-test-placeholder.svg",
}
_NETWORK_ALIASES = {
    "pi-testnet": "Pi Testnet",
    "pitestnet": "Pi Testnet",
    "pi_testnet": "Pi Testnet",
}


def _load_registry() -> dict[str, Any]:
    try:
        with _REGISTRY_FILE.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=503, detail={
            "code": "REGISTRY_UNAVAILABLE",
            "message": "Local asset registry is unavailable or invalid.",
            "retryable": True,
        }) from exc


def _records() -> list[dict[str, Any]]:
    registry = _load_registry()
    records: list[dict[str, Any]] = []
    for layer in registry.get("layers", []):
        records.append({
            **layer,
            "asset_key": layer.get("key"),
            "network_id": "pi-testnet",
            "repository_claimed_network": registry.get("network_claim_in_source"),
            "verification_status": "UNVERIFIED",
            "market_price": None,
            "redeemable_value": None,
            "issuer_logo_verified": False,
        })
    for item in registry.get("unmapped_registry_entries", []):
        records.append({
            **item,
            "asset_key": "gold-unmapped",
            "network_id": "pi-testnet",
            "verification_status": "UNVERIFIED",
            "market_price": None,
            "redeemable_value": None,
            "issuer_logo_verified": False,
        })
    for item in registry.get("additional_assets", []):
        records.append({
            **item,
            "asset_key": item.get("key"),
            "network_id": item.get("network_id", "pi-testnet"),
            "verification_status": item.get("verification_status", "UNVERIFIED"),
            "market_price": None,
            "redeemable_value": None,
            "issuer_logo_verified": False,
        })
    return records


def _find_asset(asset_id: str) -> dict[str, Any] | None:
    wanted = asset_id.strip().lower()
    for record in _records():
        candidates = {
            str(record.get("asset_key", "")).lower(),
            str(record.get("key", "")).lower(),
            str(record.get("symbol", "")).lower(),
            str(record.get("contract_id", "")).lower(),
            str(record.get("asset_id", "")).lower(),
            str(record.get("label", "")).lower(),
        }
        candidates.discard("")
        if wanted in candidates:
            return record
    return None


def _validate_network(network: str) -> str:
    normalized = network.strip().lower().replace(" ", "-")
    canonical = _NETWORK_ALIASES.get(normalized)
    if canonical is None:
        raise HTTPException(status_code=400, detail={
            "code": "NETWORK_UNSUPPORTED",
            "message": f"Network '{network}' is not configured by this registry.",
            "network_id": normalized,
            "retryable": False,
        })
    return normalized.replace("_", "-")


def _logo_response(asset_key: str) -> FileResponse:
    filename = _LOGO_FILES.get(asset_key.lower())
    if filename is None:
        raise HTTPException(status_code=404, detail={
            "code": "LOGO_NOT_FOUND",
            "message": "No logo asset is registered for this asset key.",
            "retryable": False,
        })
    path = _LOGO_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=503, detail={
            "code": "LOGO_ASSET_UNAVAILABLE",
            "message": "Registered logo file is missing from the deployment artifact.",
            "retryable": True,
        })
    return FileResponse(
        path,
        media_type="image/svg+xml",
        headers={"Cache-Control": "public, max-age=300", "X-Asset-Logo-Status": "PROVISIONAL"},
    )


@router.get("/health")
def asset_registry_health() -> dict[str, Any]:
    _load_registry()
    return {
        "service": "asset-registry",
        "status": "available",
        "registry_status": "repository-sourced; chain verification pending",
        "network_adapters": {"pi-testnet": "configured; use /v1/networks/pi-testnet/health for reachability"},
        "verification_status": "UNVERIFIED",
    }


@router.get("/networks/pi-testnet/health")
def pi_testnet_network_health() -> dict[str, Any]:
    return check_pi_testnet()


@router.get("/assets")
def list_assets(verification_status: str | None = Query(default=None)) -> dict[str, Any]:
    records = _records()
    if verification_status:
        records = [r for r in records if r.get("verification_status") == verification_status.upper()]
    return {
        "count": len(records),
        "items": records,
        "notice": "Repository-sourced metadata only. No live chain, price, reserve or redemption claim is made.",
    }


# Legacy key-only route retained for existing clients.
@router.get("/assets/{asset_key}")
def get_asset(asset_key: str) -> dict[str, Any]:
    record = _find_asset(asset_key)
    if record is None:
        raise HTTPException(status_code=404, detail={
            "code": "ASSET_NOT_FOUND",
            "message": "No asset record exists for this key, symbol or contract identifier.",
            "retryable": False,
        })
    return record


# Network-scoped canonical route documented for PiDEX and external clients.
@router.get("/assets/{network}/{asset_id}")
def get_network_asset(network: str, asset_id: str) -> dict[str, Any]:
    network_id = _validate_network(network)
    record = _find_asset(asset_id)
    if record is None:
        raise HTTPException(status_code=404, detail={
            "code": "ASSET_NOT_FOUND",
            "message": "No asset record exists for this identifier.",
            "network_id": network_id,
            "retryable": False,
        })
    if record.get("network_id") != network_id:
        raise HTTPException(status_code=404, detail={
            "code": "ASSET_NOT_FOUND",
            "message": "Asset is not registered on the requested network.",
            "network_id": network_id,
            "retryable": False,
        })
    return record


@router.get("/assets/{asset_key}/logo")
def get_asset_logo(asset_key: str) -> FileResponse:
    record = _find_asset(asset_key)
    if record is None:
        raise HTTPException(status_code=404, detail={
            "code": "LOGO_NOT_FOUND",
            "message": "No logo is registered for this asset identifier.",
            "retryable": False,
        })
    return _logo_response(str(record.get("asset_key", asset_key)))


@router.get("/assets/{network}/{asset_id}/logo")
def get_network_asset_logo(network: str, asset_id: str) -> FileResponse:
    network_id = _validate_network(network)
    record = _find_asset(asset_id)
    if record is None or record.get("network_id") != network_id:
        raise HTTPException(status_code=404, detail={
            "code": "LOGO_NOT_FOUND",
            "message": "No logo is registered for this asset on the requested network.",
            "network_id": network_id,
            "retryable": False,
        })
    return _logo_response(str(record.get("asset_key", asset_id)))


@router.get("/assets/{network}/{asset_id}/verification")
def get_asset_verification(network: str, asset_id: str) -> dict[str, Any]:
    network_id = _validate_network(network)
    record = _find_asset(asset_id)
    if record is None or record.get("network_id") != network_id:
        raise HTTPException(status_code=404, detail={
            "code": "ASSET_NOT_FOUND",
            "message": "No asset record exists for this identifier on the requested network.",
            "network_id": network_id,
            "retryable": False,
        })
    return {
        "asset_key": record.get("asset_key"),
        "network_id": network_id,
        "contract_id": record.get("contract_id"),
        "verification_status": "UNVERIFIED",
        "deployment_tx": None,
        "deployed_code_hash": None,
        "verified_at": None,
        "checks": {
            "registry_record": "PRESENT",
            "network_readback": "NOT_RUN",
            "issuer_authorization": "NOT_VERIFIED",
            "deployed_code_hash": "NOT_VERIFIED",
        },
        "notice": "No live chain verification is performed by this endpoint yet.",
    }
