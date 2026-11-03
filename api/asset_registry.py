from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

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
}


def _load_registry() -> dict[str, Any]:
    try:
        with _REGISTRY_FILE.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=503, detail={
            "code": "REGISTRY_UNAVAILABLE",
            "message": "Local asset registry is unavailable or invalid.",
        }) from exc


def _records() -> list[dict[str, Any]]:
    registry = _load_registry()
    records = []
    for layer in registry.get("layers", []):
        records.append({
            **layer,
            "asset_key": layer.get("key"),
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
            "verification_status": "UNVERIFIED",
            "market_price": None,
            "redeemable_value": None,
            "issuer_logo_verified": False,
        })
    return records


@router.get("/health")
def asset_registry_health() -> dict[str, Any]:
    _load_registry()
    return {
        "service": "asset-registry",
        "status": "available",
        "registry_status": "repository-sourced; chain verification pending",
        "verification_status": "UNVERIFIED",
    }


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


@router.get("/assets/{asset_key}")
def get_asset(asset_key: str) -> dict[str, Any]:
    for record in _records():
        if str(record.get("asset_key", "")).lower() == asset_key.lower():
            return record
    raise HTTPException(status_code=404, detail={
        "code": "ASSET_NOT_FOUND",
        "message": "No asset record exists for this key.",
    })


@router.get("/assets/{asset_key}/logo")
def get_asset_logo(asset_key: str) -> FileResponse:
    normalized = asset_key.lower()
    filename = _LOGO_FILES.get(normalized)
    if filename is None:
        raise HTTPException(status_code=404, detail={
            "code": "LOGO_NOT_FOUND",
            "message": "No logo placeholder is registered for this asset key.",
        })
    path = _LOGO_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=503, detail={
            "code": "LOGO_ASSET_UNAVAILABLE",
            "message": "Registered logo file is missing from the deployment artifact.",
        })
    return FileResponse(path, media_type="image/svg+xml", headers={"Cache-Control": "public, max-age=300"})
