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
    assert payload["count"] == 8
    assert all(item["verification_status"] == "UNVERIFIED" for item in payload["items"])
    assert all(item["market_price"] is None for item in payload["items"])


def test_known_layer_metadata_is_returned():
    response = client.get("/v1/assets/heart")
    assert response.status_code == 200
    assert response.json()["label"] == "PiCash"


def test_known_layer_logo_returns_placeholder_svg():
    response = client.get("/v1/assets/heart/logo")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/svg+xml")
    assert b"DRAFT" in response.content


def test_unmapped_gold_registry_entry_has_placeholder_logo():
    response = client.get("/v1/assets/gold-unmapped/logo")
    assert response.status_code == 200
    assert b"not an official token" in response.content.lower()


def test_unknown_asset_returns_typed_404():
    response = client.get("/v1/assets/not-a-real-layer")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "ASSET_NOT_FOUND"


def test_unknown_logo_returns_typed_404():
    response = client.get("/v1/assets/not-a-real-layer/logo")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "LOGO_NOT_FOUND"
