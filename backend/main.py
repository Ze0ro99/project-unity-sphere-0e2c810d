import asyncio
import hmac
import os

from fastapi import FastAPI, Header, HTTPException

app = FastAPI()

# Cap subprocess execution time so an anonymous caller can't monopolize the
# server with a runaway simulation script.
_SIMULATION_TIMEOUT_SECONDS = 60


def _require_api_key(x_api_key: str | None) -> None:
    """Reject the request unless the shared secret header matches PIRC_API_KEY.

    PIRC_API_KEY must be set in the deployment environment; without it the
    simulation endpoints stay locked instead of silently opening up.
    """
    expected = os.environ.get('PIRC_API_KEY')
    if not expected:
        raise HTTPException(status_code=503, detail='Server not configured')
    if not x_api_key or not hmac.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail='Unauthorized')


async def run_script(path: str) -> str:
    process = await asyncio.create_subprocess_exec(
        "python", path,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, _stderr = await asyncio.wait_for(
            process.communicate(), timeout=_SIMULATION_TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()
        raise HTTPException(status_code=504, detail='Simulation timed out')
    return stdout.decode(errors='replace')


@app.get("/")
def root():
    return {"status": "PiRC Extended Running"}


@app.get("/simulation/full")
async def full_simulation(x_api_key: str | None = Header(default=None)):
    _require_api_key(x_api_key)
    result = await run_script("scripts/run_full_simulation.py")
    return {"result": result}


@app.get("/simulation/sybil")
async def sybil_test(x_api_key: str | None = Header(default=None)):
    _require_api_key(x_api_key)
    result = await run_script("simulations/sybil_vs_trust_graph.py")
    return {"result": result}


@app.get("/simulation/atas")
async def atas_test(x_api_key: str | None = Header(default=None)):
    _require_api_key(x_api_key)
    result = await run_script("simulations/atas_simulation.py")
    return {"result": result}
