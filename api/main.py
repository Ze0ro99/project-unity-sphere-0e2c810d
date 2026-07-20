import logging
import os
import re
import subprocess
import hmac

from fastapi import FastAPI, Header, HTTPException

app = FastAPI()

logger = logging.getLogger("rwa_verify")
logger.setLevel(logging.INFO)

CONTRACT_ID = os.environ.get("CONTRACT_ID", "")

_HEX32 = re.compile(r"^[0-9a-fA-F]{64}$")
_HEX_ANY = re.compile(r"^[0-9a-fA-F]{2,512}$")


def _require_api_key(x_api_key: str | None) -> None:
    expected = os.environ.get("RWA_API_KEY")
    if not expected:
        raise HTTPException(status_code=503, detail="Server not configured")
    if not x_api_key or not hmac.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _validate(data: dict) -> dict:
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Invalid payload")
    try:
        pid = str(data["pid"])
        issuer_pubkey = str(data["issuer_pubkey"])
        signature = str(data["signature"])
        chip_uid = str(data["chip_uid"])
    except (KeyError, TypeError):
        raise HTTPException(status_code=400, detail="Missing required fields")

    if not (_HEX32.match(pid) and _HEX32.match(issuer_pubkey)):
        raise HTTPException(status_code=400, detail="Invalid pid or issuer_pubkey")
    if not (_HEX_ANY.match(signature) and _HEX_ANY.match(chip_uid)):
        raise HTTPException(status_code=400, detail="Invalid signature or chip_uid")

    return {
        "pid": pid,
        "issuer_pubkey": issuer_pubkey,
        "signature": signature,
        "chip_uid": chip_uid,
    }


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
        result = subprocess.check_output(cmd, timeout=30).decode()
        return {"status": "success", "onchain_result": result}
    except Exception:
        logger.exception("verify failed")
        raise HTTPException(status_code=500, detail="Verification failed")
