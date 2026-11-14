"""Validate the canonical asset registry schema and cross-record invariants."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker

SCHEMA_PATH = Path(__file__).resolve().parents[1] / "schemas" / "asset-contract-registry.schema.json"


def load_schema() -> dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_registry_semantics(registry: dict[str, Any]) -> None:
    """Check cross-record invariants that JSON Schema cannot express portably."""
    assets = registry.get("assets", [])
    pools = registry.get("pools", [])
    asset_keys = [item["asset_key"] for item in assets]
    pool_keys = [item["pool_key"] for item in pools]
    reserve_ids = [item["reserve_accounting_id"] for item in pools]

    for label, values in (
        ("asset_key", asset_keys),
        ("pool_key", pool_keys),
        ("reserve_accounting_id", reserve_ids),
    ):
        if len(values) != len(set(values)):
            raise ValueError(f"{label} values must be unique")

    asset_by_key = {item["asset_key"]: item for item in assets}
    contract_ids: list[str] = []
    for asset in assets:
        contract_id = asset.get("contract", {}).get("contract_id")
        if contract_id:
            contract_ids.append(contract_id)

    for pool in pools:
        asset_a, asset_b = pool["asset_a"], pool["asset_b"]
        if asset_a == asset_b:
            raise ValueError(f"pool {pool['pool_key']} cannot pair an asset with itself")
        if asset_a not in asset_by_key or asset_b not in asset_by_key:
            raise ValueError(f"pool {pool['pool_key']} references an unknown asset")
        contract_ids.append(pool["pool_contract_id"])
        if pool["deployment_status"] == "verified":
            if any(asset_by_key[key]["deployment_status"] != "verified" for key in (asset_a, asset_b)):
                raise ValueError(f"verified pool {pool['pool_key']} requires verified assets")

    if len(contract_ids) != len(set(contract_ids)):
        raise ValueError("contract IDs must be unique across assets and pools")

    policy = registry.get("economic_policy")
    if policy is not None:
        factors = policy["factor_weights"]
        factor_ids = [factor["factor_id"] for factor in factors]
        if len(factor_ids) != len(set(factor_ids)):
            raise ValueError("economic factor IDs must be unique")
        if sum(factor["weight_bps"] for factor in factors) != policy["weight_scale_bps"]:
            raise ValueError("economic factor weights must sum exactly to weight_scale_bps")


def validate_registry(registry: dict[str, Any]) -> None:
    schema = load_schema()
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(registry), key=lambda error: list(error.path))
    if errors:
        details = "; ".join(
            f"{'/'.join(map(str, error.path)) or '<root>'}: {error.message}"
            for error in errors
        )
        raise ValueError(details)
    validate_registry_semantics(registry)


if __name__ == "__main__":
    print(f"Validating {SCHEMA_PATH}")
    schema = load_schema()
    Draft202012Validator.check_schema(schema)
    print("JSON Schema draft 2020-12: valid")
