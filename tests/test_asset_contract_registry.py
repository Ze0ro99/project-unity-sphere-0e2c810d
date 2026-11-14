import copy
import unittest

from scripts.validate_asset_contract_registry import validate_registry


def valid_registry():
    return {
        "schema_version": "1.0.0",
        "registry_id": "pi-testnet-reference",
        "network": {
            "network_id": "pi-testnet",
            "network_passphrase": "Pi Testnet",
            "rpc_url": "https://rpc.testnet.minepi.com",
        },
        "assets": [
            {
                "asset_key": "asset.alpha",
                "layer_id": "L1_GOLD",
                "symbol": "ALPHA",
                "asset_type": "utility",
                "deployment_status": "proposed",
                "contract": {"interface_version": "1.0.0"},
                "authorization_policy": {
                    "requires_admin_auth": True,
                    "approval_required_for_policy_changes": True,
                    "allowed_operator_addresses": [],
                },
            },
            {
                "asset_key": "asset.beta",
                "layer_id": "L2_CASH",
                "symbol": "BETA",
                "asset_type": "utility",
                "deployment_status": "proposed",
                "contract": {"interface_version": "1.0.0"},
                "authorization_policy": {
                    "requires_admin_auth": True,
                    "approval_required_for_policy_changes": True,
                    "allowed_operator_addresses": [],
                },
            },
        ],
        "pools": [
            {
                "pool_key": "pool.alpha-beta",
                "pool_contract_id": "C" + "A" * 55,
                "asset_a": "asset.alpha",
                "asset_b": "asset.beta",
                "fee_bps": 30,
                "deployment_status": "proposed",
                "reserve_accounting_id": "reserve.alpha-beta",
            }
        ],
        "economic_policy": {
            "policy_version": "1.0.0",
            "weight_scale_bps": 10000,
            "factor_weights": [
                {"factor_id": "identity", "weight_bps": 3000},
                {"factor_id": "contribution", "weight_bps": 4000},
                {"factor_id": "utility", "weight_bps": 3000},
            ],
            "oracle_policy": {
                "min_sources": 3,
                "max_age_seconds": 120,
                "max_deviation_bps": 1500,
                "aggregation": "median",
                "missing_data_action": "reject",
            },
            "rounding_policy": "largest_remainder",
        },
    }


class AssetContractRegistryTests(unittest.TestCase):
    def test_valid_testnet_registry_and_economic_policy(self):
        validate_registry(valid_registry())

    def test_weight_factors_must_sum_to_exact_basis_point_scale(self):
        registry = valid_registry()
        registry["economic_policy"]["factor_weights"][0]["weight_bps"] = 2999
        with self.assertRaisesRegex(ValueError, "sum exactly"):
            validate_registry(registry)

    def test_factor_ids_must_be_unique(self):
        registry = valid_registry()
        registry["economic_policy"]["factor_weights"][1]["factor_id"] = "identity"
        with self.assertRaisesRegex(ValueError, "factor IDs"):
            validate_registry(registry)

    def test_pool_cannot_reuse_reserve_accounting_id(self):
        registry = valid_registry()
        second = copy.deepcopy(registry["pools"][0])
        second["pool_key"] = "pool.other"
        second["pool_contract_id"] = "C" + "B" * 55
        registry["pools"].append(second)
        with self.assertRaisesRegex(ValueError, "reserve_accounting_id"):
            validate_registry(registry)

    def test_pool_must_reference_registered_distinct_assets(self):
        registry = valid_registry()
        registry["pools"][0]["asset_b"] = "asset.missing"
        with self.assertRaisesRegex(ValueError, "unknown asset"):
            validate_registry(registry)

    def test_verified_asset_requires_deployment_and_readback_evidence(self):
        registry = valid_registry()
        registry["assets"][0]["deployment_status"] = "verified"
        with self.assertRaises(ValueError):
            validate_registry(registry)

    def test_verified_pool_requires_verified_assets(self):
        registry = valid_registry()
        pool = registry["pools"][0]
        pool.update({
            "deployment_status": "verified",
            "wasm_hash": "a" * 64,
            "deployment_transaction_hash": "b" * 64,
            "readback_at": "2026-11-14T10:00:00Z",
            "readback_method": "independent-rpc-readback",
        })
        with self.assertRaisesRegex(ValueError, "requires verified assets"):
            validate_registry(registry)

    def test_network_is_fixed_to_pi_testnet(self):
        registry = valid_registry()
        registry["network"]["network_id"] = "mainnet"
        with self.assertRaises(ValueError):
            validate_registry(registry)


if __name__ == "__main__":
    unittest.main()
