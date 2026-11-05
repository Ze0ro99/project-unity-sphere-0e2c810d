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

def test_rwa_verify_fails_closed_without_supported_signer(monkeypatch):
    monkeypatch.setenv("RWA_API_KEY", "test-only-api-key")
    response = serverless_client.post(
        "/verify",
        headers={"x-api-key": "test-only-api-key"},
        json={
            "pid": "a" * 64,
            "issuer_pubkey": "b" * 64,
            "signature": "c" * 128,
            "chip_uid": "d" * 64,
        },
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "UNSUPPORTED_CAPABILITY"


def test_all_seven_layer_contract_references_are_registered_for_readback(monkeypatch):
    # Keep this list aligned with src/data/layers.ts. These are Soroban C... IDs,
    # not issuer G... accounts. The endpoint must resolve every one by exact ID.
    layer_contract_ids = [
        "CCGEMIEAZFJSBTRL5VGJJAUGPJI3B7UQ3BTAB2OQGW73JMWLS57YVVA4",
        "CD3UAUN4FU3VHPMLOZWFQWJ2UBUUBBD37SZ7WBEGJQACJ7YF6QVE2SYG",
        "CANLSQUPUZYKE3S2HAIGXAHMOQWE4FVX5DS7GTL42BVKSNHLFVMQSDFF",
        "CB7T6TDSZ5B2MQI7NI4EG6ZASYPRMJ3XVUWS6BON4Z64OBMUJ4ZD6GKF",
        "CAMSQZTSCTF3MG4UEIAWKRZNSX7LLKGKXMVBEQO2ETVPGS3CINM7JBQD",
        "CBPG33E7RUX6MGU65IMM4HXCAGLA4OZRBOUWKQSBTIZWE2RD52VGWDT4",
        "CC6WMAHKOPWY6HW46VNKTAV4DZZLRTTNMYLDEKCAICQGMCWV5PZYNTBO",
    ]
    registered = {
        str(record.get("contract_id", "")).upper()
        for record in asset_registry._records()
        if record.get("contract_id")
    }
    assert len(layer_contract_ids) == 7
    assert len(set(layer_contract_ids)) == 7
    assert set(layer_contract_ids).issubset(registered)

    # Stub the network probe: unit tests must never depend on external RPC.
    monkeypatch.setattr(
        asset_registry,
        "verify_contract_instance",
        lambda contract_id: {"probe_status": "NOT_FOUND", "contract_instance_present": False},
    )

    # Exercise the same network-scoped route the Testnet page calls.
    for contract_id in layer_contract_ids:
        response = client.get(
            f"/v1/assets/pi-testnet/{contract_id}/verification"
        )
        assert response.status_code == 200, contract_id
        payload = response.json()
        assert payload["contract_id"] == contract_id
        assert payload["network_id"] == "pi-testnet"
        assert payload["verification_status"] == "UNVERIFIED"
        assert payload["checks"]["network_readback"] == "CONTRACT_INSTANCE_NOT_FOUND"

def test_issuer_account_is_not_accepted_as_a_soroban_contract_id():
    # G... is a Stellar/Pi account address, not a Soroban C... contract address.
    issuer_account = "GA3ECRFJ6SO5BW6NEIKW3ACJXNG5UNBTLRRXWC742NHUEDV6KL3RNEN6"
    response = client.get(
        f"/v1/assets/pi-testnet/{issuer_account}/verification"
    )
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "ASSET_NOT_FOUND"


def test_contract_verification_keeps_rpc_failure_unverified(monkeypatch):
    expected = {
        "probe_status": "RPC_UNAVAILABLE",
        "contract_instance_present": None,
        "error": "test RPC unavailable",
    }
    monkeypatch.setattr(
        asset_registry,
        "verify_contract_instance",
        lambda contract_id: expected,
    )
    response = client.get("/v1/assets/pi-testnet/heart/verification")
    assert response.status_code == 200
    payload = response.json()
    assert payload["verification_status"] == "UNVERIFIED"
    assert payload["checks"]["network_readback"] == "RPC_UNAVAILABLE"
    assert payload["checks"]["contract_instance_probe"] == expected


def test_network_scoped_verification_rejects_unsupported_network():
    response = client.get("/v1/assets/pi-mainnet/heart/verification")
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "NETWORK_UNSUPPORTED"
