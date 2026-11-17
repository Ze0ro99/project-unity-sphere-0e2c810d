"""Tests for fail-closed legacy PiRC metadata validation."""

import unittest

from scripts.validate_legacy_asset_metadata import validate


class LegacyAssetMetadataTests(unittest.TestCase):
    def test_public_metadata_is_fail_closed(self):
        self.assertEqual(validate(), [])


if __name__ == "__main__":
    unittest.main()
