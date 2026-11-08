from __future__ import annotations

import unittest
from unittest.mock import patch

from api import asset_registry


class AssetRegistryNetworkGateTests(unittest.TestCase):
    def test_contract_probe_is_blocked_when_network_identity_is_unverified(self):
        record = {
            "asset_key": "root",
            "network_id": "pi-testnet",
            "contract_id": "C" + "A" * 55,
        }
        with (
            patch.object(asset_registry, "_validate_network", return_value="pi-testnet"),
            patch.object(asset_registry, "_find_asset", return_value=record),
            patch.object(asset_registry, "check_pi_testnet", return_value={
                "network_id": "pi-testnet1",
                "status": "reachable_unverified",
                "identity_verified": False,
            }),
            patch.object(asset_registry, "verify_contract_instance") as verify,
        ):
            result = asset_registry.get_asset_verification("pi-testnet", "root")

        self.assertEqual(result["verification_status"], "UNVERIFIED")
        self.assertEqual(result["checks"]["network_readback"], "NETWORK_IDENTITY_UNVERIFIED")
        verify.assert_not_called()

    def test_contract_probe_runs_only_after_network_identity_is_verified(self):
        record = {
            "asset_key": "root",
            "network_id": "pi-testnet",
            "contract_id": "C" + "A" * 55,
        }
        with (
            patch.object(asset_registry, "_validate_network", return_value="pi-testnet"),
            patch.object(asset_registry, "_find_asset", return_value=record),
            patch.object(asset_registry, "check_pi_testnet", return_value={
                "network_id": "pi-testnet1",
                "status": "verified",
                "identity_verified": True,
            }),
            patch.object(asset_registry, "verify_contract_instance", return_value={
                "probe_status": "FOUND",
                "contract_instance_present": True,
            }) as verify,
        ):
            result = asset_registry.get_asset_verification("pi-testnet", "root")

        self.assertEqual(result["checks"]["network_readback"], "CONTRACT_INSTANCE_PRESENT")
        verify.assert_called_once_with(record["contract_id"])


if __name__ == "__main__":
    unittest.main()
