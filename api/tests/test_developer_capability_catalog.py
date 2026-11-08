from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi import HTTPException

from api import asset_registry


CATALOG = {
    "schema_version": "1.0.0",
    "catalog_version": "test",
    "network_profiles": [{"network_id": "pi-testnet1", "write_enabled": False}],
    "app_access": {"registration_status": "NOT_IMPLEMENTED"},
    "capabilities": [
        {
            "id": "asset-registry.read",
            "status": "SOURCE_IMPLEMENTED_RUNTIME_UNVERIFIED",
            "mode": "READ_ONLY",
        },
        {
            "id": "developer.app-registration",
            "status": "NOT_IMPLEMENTED",
            "mode": "DISABLED",
        },
    ],
}


class DeveloperCapabilityCatalogTests(unittest.TestCase):
    def test_list_returns_versioned_discovery_catalog_without_granting_access(self):
        with patch.object(asset_registry, "_load_capability_catalog", return_value=CATALOG):
            result = asset_registry.list_developer_capabilities()

        self.assertEqual(result["catalog_version"], "test")
        self.assertEqual(result["count"], 2)
        self.assertEqual(result["items"][0]["mode"], "READ_ONLY")
        self.assertIn("does not grant credentials", result["notice"])

    def test_get_returns_exact_capability(self):
        with patch.object(asset_registry, "_load_capability_catalog", return_value=CATALOG):
            result = asset_registry.get_developer_capability("developer.app-registration")

        self.assertEqual(result["item"]["status"], "NOT_IMPLEMENTED")
        self.assertEqual(result["item"]["mode"], "DISABLED")

    def test_unknown_capability_returns_404(self):
        with patch.object(asset_registry, "_load_capability_catalog", return_value=CATALOG):
            with self.assertRaises(HTTPException) as raised:
                asset_registry.get_developer_capability("missing.capability")

        self.assertEqual(raised.exception.status_code, 404)
        self.assertEqual(raised.exception.detail["code"], "CAPABILITY_NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
