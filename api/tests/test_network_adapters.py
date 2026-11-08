from __future__ import annotations

import unittest
from unittest.mock import patch

from api import network_adapters as adapter


class FakeResponse:
    def __init__(self, payload: dict):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class FakeClient:
    def __init__(self, *args, **kwargs):
        self.calls = []

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def get(self, url: str):
        self.calls.append(("GET", url))
        return FakeResponse({
            "network_passphrase": "Pi Testnet",
            "core_supported_protocol_version": 29,
        })

    def post(self, url: str, json: dict):
        self.calls.append((json["method"], url))
        method = json["method"]
        results = {
            "getNetwork": {"passphrase": "Pi Testnet", "protocolVersion": 28},
            "getHealth": {"status": "healthy"},
            "getLatestLedger": {"sequence": 12345},
        }
        return FakeResponse({"jsonrpc": "2.0", "id": 1, "result": results[method]})


class NetworkAdapterTests(unittest.TestCase):
    def _configured(self, passphrase: str | None = "Pi Testnet"):
        return (
            patch.object(adapter, "PI_NETWORK", "testnet"),
            patch.object(adapter, "HORIZON_URL", "https://api.testnet.minepi.com"),
            patch.object(adapter, "SOROBAN_RPC_URL", "https://rpc.testnet.minepi.com"),
            patch.object(adapter, "EXPECTED_PASSPHRASE", passphrase),
            patch.object(adapter, "EXPECTED_PROTOCOL", "28"),
            patch.object(adapter, "ALLOWED_HOSTS", {
                "api.testnet.minepi.com",
                "rpc.testnet.minepi.com",
            }),
        )

    def test_network_identity_requires_both_endpoints_and_expected_values(self):
        patches = self._configured()
        with patches[0], patches[1], patches[2], patches[3], patches[4], patches[5], patch.object(adapter.httpx, "Client", FakeClient):
            result = adapter.check_pi_testnet()
        self.assertEqual(result["status"], "verified")
        self.assertTrue(result["identity_verified"])
        self.assertEqual(result["network_id"], "pi-testnet1")

    def test_missing_expected_passphrase_never_marks_network_verified(self):
        patches = self._configured(passphrase=None)
        with patches[0], patches[1], patches[2], patches[3], patches[4], patches[5], patch.object(adapter.httpx, "Client", FakeClient):
            result = adapter.check_pi_testnet()
        self.assertEqual(result["status"], "reachable_unverified")
        self.assertFalse(result["identity_verified"])

    def test_non_testnet_configuration_is_blocked_before_network_calls(self):
        with patch.object(adapter, "PI_NETWORK", "mainnet"):
            result = adapter.check_pi_testnet()
        self.assertEqual(result["status"], "blocked")
        self.assertFalse(result["identity_verified"])

    def test_endpoint_rejects_http_and_unapproved_hosts(self):
        self.assertFalse(adapter._endpoint_allowed(
            "http://api.testnet.minepi.com", "api.testnet.minepi.com"
        ))
        self.assertFalse(adapter._endpoint_allowed(
            "https://example.com", "api.testnet.minepi.com"
        ))


if __name__ == "__main__":
    unittest.main()
