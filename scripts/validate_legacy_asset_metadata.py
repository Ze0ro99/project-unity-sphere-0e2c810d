#!/usr/bin/env python3
"""Fail-closed validation for legacy public PiRC asset metadata."""

from __future__ import annotations

import csv
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "LIVE_MATRIX_REGISTRY.csv"
TOML_PATH = ROOT / ".well-known" / "pi.toml"
EXPECTED_COLUMNS = [
    "Layer",
    "Contract ID",
    "Color",
    "Status",
    "Deployed Date",
    "PIRC Standard",
]


def validate() -> list[str]:
    errors: list[str] = []
    with CSV_PATH.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != EXPECTED_COLUMNS:
            errors.append("legacy registry header mismatch")
        rows = list(reader)

    if len(rows) != 8:
        errors.append(f"expected 8 preserved source rows, found {len(rows)}")

    for row in rows:
        if row.get("Status") != "UNVERIFIED_REPOSITORY_CLAIM":
            errors.append(
                f"{row.get('Layer', 'unknown')}: status must remain UNVERIFIED_REPOSITORY_CLAIM"
            )
        if row.get("Deployed Date", "").strip():
            errors.append(
                f"{row.get('Layer', 'unknown')}: unverified row cannot claim a deployed date"
            )
        contract_id = row.get("Contract ID", "").strip().strip('"')
        if not contract_id:
            errors.append(f"{row.get('Layer', 'unknown')}: source identifier was not preserved")
        else:
            expected_prefix = "G" if row.get("Layer") == "CORE" else "C"
            strkey_alphabet = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567")
            if (
                len(contract_id) != 56
                or not contract_id.startswith(expected_prefix)
                or any(character not in strkey_alphabet for character in contract_id)
            ):
                errors.append(
                    f"{row.get('Layer', 'unknown')}: identifier has an invalid StrKey shape"
                )

    core = next((row for row in rows if row.get("Layer") == "CORE"), None)
    if not core or core.get("Color") != "Core account reference":
        errors.append("CORE must be described as a Core account reference, not a mint authority")

    with TOML_PATH.open("rb") as handle:
        metadata = tomllib.load(handle)

    if metadata.get("NETWORK_PASSPHRASE") != "Pi Testnet":
        errors.append("Pi TOML must retain the explicit Pi Testnet passphrase")
    documentation = metadata.get("DOCUMENTATION", {})
    if documentation.get("ORG_NAME") != "PiRC Community Project":
        errors.append("Pi TOML must identify this as a community project")
    if "ORG_OFFICIAL_EMAIL" in documentation:
        errors.append("unverified/invalid official email must not be published")
    if metadata.get("CURRENCIES"):
        errors.append("currency listings must remain absent until issuer and deployment are verified")
    for principal in metadata.get("PRINCIPALS", []):
        if "email" in principal:
            errors.append("principal email must not be published without verification")

    return errors


if __name__ == "__main__":
    problems = validate()
    if problems:
        for problem in problems:
            print(f"ERROR: {problem}", file=sys.stderr)
        raise SystemExit(1)
    print("Legacy asset metadata validation passed: identifiers preserved; no unverified ACTIVE/live claims.")
