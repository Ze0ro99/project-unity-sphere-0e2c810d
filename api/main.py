import hmac
import logging
import os
import re
import subprocess

from fastapi import FastAPI, Header, HTTPException

app = FastAPI()

logger = logging.getLogger("rwa_verify")
logger.setLevel(logging.INFO)

CONTRACT_ID = os.environ.get("SOROBAN_CONTRACT_ID", "ISI_DENGAN_CONTRACT_ID_KAMU")

# Strict allowlist for every user-supplied value before it reaches the soroban
# CLI. Rejecting anything outside these patterns blocks argument-injection
# attempts such as `--network mainnet` sneaking in as a "pid" value.
_HEX_OR_BASE64 = re.compile(r'^[A-Za-z0-9+/=_-]{1,512}$')
_REQUIRED_FIELDS = ("pid", "issuer_pubkey", "signature", "chip_uid")
_SOROBAN_TIMEOUT_SECONDS = 30


def _require_api_key(x_api_key: str | None) -> None:
    expected = os.environ.get("PIRC_API_KEY")
    if not expected:
        raise HTTPException(status_code=503, detail="Server not configured")
    if not x_api_key or not hmac.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _validate(data: dict) -> dict:
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Invalid payload")
    cleaned: dict[str, str] = {}
    for field in _REQUIRED_FIELDS:
        value = data.get(field)
        if not isinstance(value, str) or not _HEX_OR_BASE64.match(value):
            raise HTTPException(status_code=400, detail=f"Invalid {field}")
        cleaned[field] = value
    return cleaned


@app.get("/")
def root():
    return {"status": "RWA Verification API LIVE"}


@app.post("/verify")
def verify(data: dict, x_api_key: str | None = Header(default=None)):
    _require_api_key(x_api_key)
    cleaned = _validate(data)

    cmd = [
        "soroban", "contract", "invoke",
        "--id", CONTRACT_ID,
        "--network", "testnet",
        "--source", "alice",
        "--",
        "verify",
        "--pid", cleaned["pid"],
        "--issuer_pubkey", cleaned["issuer_pubkey"],
        "--signature", cleaned["signature"],
        "--chip_uid", cleaned["chip_uid"],
    ]

    try:
        result = subprocess.check_output(
            cmd, timeout=_SOROBAN_TIMEOUT_SECONDS, stderr=subprocess.STDOUT
        ).decode(errors="replace")
    except subprocess.TimeoutExpired:
        logger.exception("soroban invoke timed out")
        raise HTTPException(status_code=504, detail="Verification timed out")
    except subprocess.CalledProcessError:
        # Log the full details server-side, but do not leak stderr/paths to
        # unauthenticated observers.
        logger.exception("soroban invoke failed")
        raise HTTPException(status_code=502, detail="Verification failed")
    except Exception:
        logger.exception("unexpected error during verification")
        raise HTTPException(status_code=500, detail="Internal error")

    return {"status": "success", "onchain_result": result}
