import os
import re
import hmac

from fastapi import FastAPI, Header, HTTPException
from api.asset_registry import router as asset_registry_router

app = FastAPI(title='PiRC Asset and RWA API', version='0.2.0')
app.include_router(asset_registry_router, prefix='/v1')
# Compatibility prefixes for serverless rewrites that preserve the function path.
app.include_router(asset_registry_router, prefix='/api/v1', include_in_schema=False)
app.include_router(asset_registry_router, prefix='/api/index.py/v1', include_in_schema=False)

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
    return {
        "service": "PiRC Asset and RWA API",
        "status": "available",
        "mode": "repository metadata; live chain verification pending",
    }


@app.post("/verify")
def verify(data: dict, x_api_key: str | None = Header(default=None)):
    _require_api_key(x_api_key)
    _validate(data)

    # Fail closed: the deployed function does not provision a Soroban CLI,
    # network-pinned RPC client, or secure signer/relayer. Never invoke a
    # developer identity (for example, the local `alice` testnet profile).
    raise HTTPException(
        status_code=503,
        detail={
            "code": "UNSUPPORTED_CAPABILITY",
            "message": (
                "Live contract verification is disabled until a supported "
                "network-pinned RPC client and secure signer/relayer are configured."
            ),
        },
    )
