#!/usr/bin/env python3
"""Run a non-authenticating RWA metadata demo. No signature or ownership is verified."""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPOSITORY_ROOT = HERE.parent


def load_schema() -> dict:
    with (REPOSITORY_ROOT / "spec" / "rwa_auth_schema_v0.3.json").open(encoding="utf-8") as handle:
        return json.load(handle)


def simulate_verification(product_id: str, method: str = "NFC") -> tuple[dict, dict]:
    if method not in {"QR", "NFC", "HYBRID"}:
        raise ValueError("method must be QR, NFC, or HYBRID")

    load_schema()
    with (HERE / "eyewear_canonical_example.json").open(encoding="utf-8") as handle:
        data = json.load(handle)

    timestamp = datetime.now(timezone.utc).isoformat()
    data["pid"] = hashlib.sha256((product_id + "-" + timestamp).encode()).hexdigest()
    data["timestamp_registered"] = timestamp
    data["verification"]["method"] = method

    if method in {"NFC", "HYBRID"}:
        data["auth"]["chip_uid"] = "DEMO-ONLY-NOT-A-DEVICE-ATTESTATION"
        data["auth"]["signed_payload"] = "PLACEHOLDER-NOT-CRYPTOGRAPHICALLY-SIGNED"

    result = {
        "status": "UNVERIFIED_DEMO",
        "confidence_score": None,
        "issuer_verified": False,
        "signature_valid": False,
        "physical_binding_verified": False,
        "reason": (
            "This demo uses placeholder fixture data and does not verify a signature, "
            "issuer key, device challenge, revocation state, or physical possession."
        ),
    }

    print("PiRC RWA v0.3 — metadata-only demonstration")
    print(json.dumps({"product": data, "verification": result}, indent=2, ensure_ascii=False))
    return data, result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--product-id", default="EYEWEAR-LUXE-001")
    parser.add_argument("--method", choices=("QR", "NFC", "HYBRID"), default="NFC")
    args = parser.parse_args()
    simulate_verification(args.product_id, args.method)


if __name__ == "__main__":
    main()
