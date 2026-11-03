from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.asset_registry import router
from api.main import app as serverless_app
import api.asset_registry as asset_registry

app = FastAPI()
app.include_router(router, prefix="/v1")
client = TestClient(app)
serverless_client = TestClient(serverless_app)


def test_registry_lists_all_source_records_as_unverified():
    response = client.get("/v1/assets")
    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] == 9
    assert all(item["verification_status"] == "UNVERIFIED" for item in payload["items"])
    assert all(item["market_price"] is None for item in payload["items"])


def test_known_layer_metadata_is_returned():
    response = client.get("/v1/assets/heart")
    assert response.status_code == 200
    assert response.json()["label"] == "PiCash"


def test_network_scoped_lookup_accepts_key_symbol_and_contract_id():
    assert client.get("/v1/assets/pi-testnet/heart").status_code == 200
    assert client.get("/v1/assets/pi-testnet/OUSD").status_code == 200
    response = client.get(
        "/v1/assets/pi-testnet/CBPG33E7RUX6MGU65IMM4HXCAGLA4OZRBOUWKQSBTIZWE2RD52VGWDT4"
    )
    assert response.status_code == 200


def test_known_layer_logo_returns_provisional_svg():
    response = client.get("/v1/assets/heart/logo")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/svg+xml")
    assert b"DRAFT" in response.content


def test_network_scoped_logo_route_is_available():
    response = client.get("/v1/assets/pi-testnet/heart/logo")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/svg+xml")


def test_ousd_is_explicitly_a_non_redeemable_test_proposal():
    response = client.get("/v1/assets/pi-testnet/ousd")
    assert response.status_code == 200
    payload = response.json()
    assert payload["verification_status"] == "UNVERIFIED"
    assert payload["contract_id"] is None
    assert payload["redeemable_value"] is None
    assert payload["asset_type"] == "TEST_STABLE_ASSET_PROPOSAL"


def test_ousd_logo_returns_test_only_badge():
    response = client.get("/v1/assets/pi-testnet/ousd/logo")
    assert response.status_code == 200
    assert b"TEST ONLY" in response.content


def test_verification_route_never_claims_success_without_readback():
    response = client.get("/v1/assets/pi-testnet/ousd/verification")
    assert response.status_code == 200
    payload = response.json()
    assert payload["verification_status"] == "UNVERIFIED"
    assert payload["checks"]["network_readback"] == "NOT_APPLICABLE_NOT_DEPLOYED"


def test_unknown_asset_returns_typed_404():
    response = client.get("/v1/assets/not-a-real-layer")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "ASSET_NOT_FOUND"


def test_unknown_logo_returns_typed_404():
    response = client.get("/v1/assets/not-a-real-layer/logo")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "LOGO_NOT_FOUND"


def test_serverless_route_prefix_compatibility():
    for path in ("/v1/health", "/api/v1/health", "/api/index.py/v1/health"):
        response = serverless_client.get(path)
        assert response.status_code == 200, path


def test_network_health_endpoint_reports_real_probe_result(monkeypatch):
    expected = {
        "network_id": "pi-testnet",
        "network_passphrase": "Pi Testnet",
        "status": "reachable",
        "horizon": {"url": "https://api.testnet.minepi.com", "reachable": True, "http_status": 200},
        "soroban_rpc": {"url": "https://rpc.testnet.minepi.com", "reachable": True, "health": {"ok": True}, "latest_ledger": {"sequence": 123}},
        "contract_verification": "NOT_PERFORMED",
        "notice": "Endpoint reachability is not contract deployment, issuer, code-hash, reserve or audit verification.",
    }
    monkeypatch.setattr(asset_registry, "check_pi_testnet", lambda: expected)
    response = client.get("/v1/networks/pi-testnet/health")
    assert response.status_code == 200
    assert response.json() == expected


def test_contract_verification_uses_readback_for_registered_contract(monkeypatch):
    expected = {"probe_status": "FOUND", "contract_instance_present": True, "rpc_url": "https://rpc.testnet.minepi.com"}
    monkeypatch.setattr(asset_registry, "verify_contract_instance", lambda contract_id: expected)
    response = client.get("/v1/assets/pi-testnet/heart/verification")
    assert response.status_code == 200
    payload = response.json()
    assert payload["verification_status"] == "DEPLOYED_UNVERIFIED"
    assert payload["checks"]["network_readback"] == "CONTRACT_INSTANCE_PRESENT"
    assert payload["checks"]["contract_instance_probe"] == expected
    assert payload["checks"]["deployed_code_hash"] == "NOT_VERIFIED"
