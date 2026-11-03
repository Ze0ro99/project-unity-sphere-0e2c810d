from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.asset_registry import router

app = FastAPI()
app.include_router(router, prefix="/v1")
client = TestClient(app)


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
    assert payload["checks"]["network_readback"] == "NOT_RUN"


def test_unknown_asset_returns_typed_404():
    response = client.get("/v1/assets/not-a-real-layer")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "ASSET_NOT_FOUND"


def test_unknown_logo_returns_typed_404():
    response = client.get("/v1/assets/not-a-real-layer/logo")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "LOGO_NOT_FOUND"
