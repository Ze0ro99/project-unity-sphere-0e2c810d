import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { getTokenAttributes } from "../assets/js/stellarConfig.js";

test("client token attributes never fabricate live values", async () => {
  const result = await getTokenAttributes("C" + "A".repeat(55), "blue");
  assert.equal(result.status, "UNVERIFIED");
  assert.equal(result.verificationStatus, "UNVERIFIED");
  assert.equal(result.attributes, null);
  assert.equal(result.source, null);
  assert.equal(result.ledgerSequence, null);
  assert.match(result.reason, /No authoritative contract read-back/);
  for (const forbidden of ["qwf_eff", "phi_solvency", "ref_capacity", "issuer"]) {
    assert.equal(Object.hasOwn(result, forbidden), false);
  }
});

test("asset registry never upgrades repository claims to verified status", async () => {
  const registry = JSON.parse(await readFile(new URL("../assets/registry/pirc207-layer-registry.json", import.meta.url), "utf8"));
  assert.equal(registry.layers.length, 7);
  for (const asset of [...registry.layers, ...registry.unmapped_registry_entries]) {
    assert.equal(asset.verification_status, "UNVERIFIED");
    assert.equal(asset.verified_network_id, null);
    assert.equal(asset.repository_claim_status, "UNVERIFIED_REPOSITORY_CLAIM");
  }
});

test("all chakra layer logo URIs resolve to local SVG artwork", async () => {
  const registry = JSON.parse(await readFile(new URL("../assets/registry/pirc207-layer-registry.json", import.meta.url), "utf8"));
  for (const asset of registry.layers) {
    assert.match(asset.logo_uri, /^\/token-logos\/[a-z0-9-]+\.svg$/);
    const path = new URL("../public" + asset.logo_uri, import.meta.url);
    const svg = await readFile(path, "utf8");
    assert.match(svg, /<svg[\s>]/);
  }
});
