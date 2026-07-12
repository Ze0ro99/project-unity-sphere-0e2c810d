from fastapi import FastAPI
import subprocess
import json

app = FastAPI()

logger = logging.getLogger("rwa_verify")
logger.setLevel(logging.INFO)

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
        cmd = [
            "soroban", "contract", "invoke",
            "--id", CONTRACT_ID,
            "--network", "testnet",
            "--source", "alice",
            "--",
            "verify",
            "--pid", data["pid"],
            "--issuer_pubkey", data["issuer_pubkey"],
            "--signature", data["signature"],
            "--chip_uid", data["chip_uid"]
        ]

        result = subprocess.check_output(cmd).decode()

        return {
            "status": "success",
            "onchain_result": result
        }

    except Exception as e:
        return {"error": str(e)}
