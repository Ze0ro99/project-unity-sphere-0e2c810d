import test from "node:test";
import assert from "node:assert/strict";

test("Netlify ecosystem feed uses canonical GitHub collections and remains read-only", async () => {
  const fs = await import("node:fs/promises");
  const source = await fs.readFile(new URL("../netlify/functions/ecosystem-feed.js", import.meta.url), "utf8");
  assert.match(source, /https:\/\/rpc\.testnet\.minepi\.com/);
  assert.match(source, /https:\/\/api\.testnet\.minepi\.com/);
  assert.match(source, /EXPECTED_PASSPHRASE = "Pi Testnet"/);
  assert.match(source, /events\?per_page=8/);
  assert.match(source, /function compactEvent/);
  assert.match(source, /pulls\?state=open&sort=updated/);
  assert.match(source, /commits\?per_page=1/);
  assert.match(source, /failures === 4/);
  assert.doesNotMatch(source, /failures === 3/);
  assert.match(source, /mainnetWrites: false/);
  assert.match(source, /signingEnabled: false/);
  assert.match(source, /tokenTransfersEnabled: false/);
  assert.doesNotMatch(source, /sendTransaction|submitTransaction|signTransaction|mint\(/i);
});

test("Canonical portal feed never promotes unverified evidence to live state", async () => {
  const fs = await import("node:fs/promises");
  const source = await fs.readFile(new URL("../supabase/functions/pirc-portal-feed/index.ts", import.meta.url), "utf8");
  assert.match(source, /pirc\.canonical-portal-feed\.v1/);
  assert.match(source, /registryStatus: "UNVERIFIED"/);
  assert.match(source, /deploymentStatus: "NOT_VERIFIED"/);
  assert.match(source, /finality: "NOT_VERIFIED"/);
  assert.match(source, /rawEventsAreNotSettlementFinality: true/);
  assert.match(source, /subscriptions: \{ status: "NOT_CONFIGURED"/);
  assert.match(source, /liquidity: \{ status: "NOT_CONFIGURED"/);
  assert.match(source, /mainnetWrites: false/);
  assert.doesNotMatch(source, /sendTransaction|submitTransaction|signTransaction|mint\(/i);
});

test("all portal routes mount one canonical read-only status component", async () => {
  const fs = await import("node:fs/promises");
  const app = await fs.readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const component = await fs.readFile(new URL("../src/components/CanonicalPortalSync.tsx", import.meta.url), "utf8");
  assert.match(app, /<CanonicalPortalSync \/>/);
  assert.match(component, /functions\/v1\/pirc-portal-feed/);
  assert.match(component, /30_000/);
  assert.match(component, /no mock replacement is used/);
});

test("Developer Studio labels incomplete capabilities instead of simulating them", async () => {
  const fs = await import("node:fs/promises");
  const page = await fs.readFile(new URL("../src/pages/DeveloperStudio.tsx", import.meta.url), "utf8");
  const gateways = await fs.readFile(new URL("../src/pages/Gateways.tsx", import.meta.url), "utf8");
  assert.match(page, /SCAFFOLD ABI — NOT TESTNET VERIFIED/);
  assert.match(page, /NOT IMPLEMENTED/);
  assert.match(page, /NOT ON-CHAIN VERIFIED/);
  assert.match(page, /Mainnet writes, automatic signing/);
  assert.match(gateways, /Developer Studio \/ Contract Gateway/);
  assert.match(gateways, /PIRC-2 Subscription Gateway/);
});

test("portal manifest and capability catalog share the canonical network/feed identity", async () => {
  const fs = await import("node:fs/promises");
  const manifest = JSON.parse(await fs.readFile(new URL("../configs/pirc-integration-manifest.json", import.meta.url), "utf8"));
  const catalog = JSON.parse(await fs.readFile(new URL("../assets/registry/developer-capability-catalog.json", import.meta.url), "utf8"));
  assert.equal(manifest.asset_synchronization.network_id, "pi-testnet");
  assert.equal(manifest.portal_data_gateway.canonical_network_id, "pi-testnet");
  assert.equal(manifest.portal_data_gateway.deployed_and_runtime_verified, false);
  assert.ok(catalog.capabilities.some((item) => item.id === "portals.canonical-feed" && item.endpoint === "GET /functions/v1/pirc-portal-feed"));
});

test("legacy token adapter returns unknowns until chain read-back exists", async () => {
  const fs = await import("node:fs/promises");
  const source = await fs.readFile(new URL("../assets/js/stellarConfig.js", import.meta.url), "utf8");
  assert.match(source, /status: "UNVERIFIED"/);
  assert.match(source, /qwf_eff: null/);
  assert.match(source, /phi_solvency: null/);
  assert.match(source, /ref_capacity: null/);
  assert.doesNotMatch(source, /qwf_eff: 128|phi_solvency: true|ref_capacity: 32779800|status: "ACTIVE"/);
});

test("legacy bulk merge script is fail-closed and cannot push main", async () => {
  const fs = await import("node:fs/promises");
  const source = await fs.readFile(new URL("../pirc_matrix_unifier_and_sync.sh", import.meta.url), "utf8");
  assert.match(source, /DEPRECATED AND DISABLED/);
  assert.match(source, /exit 2/);
  assert.doesNotMatch(source, /git push origin main|git merge --no-ff/);
  assert.doesNotMatch(source, /qwf_eff: 128|status: "ACTIVE"/);
});

test("gateway catalogue does not label local simulations as live execution", async () => {
  const fs = await import("node:fs/promises");
  const source = await fs.readFile(new URL("../src/pages/Gateways.tsx", import.meta.url), "utf8");
  assert.match(source, /tag: "SIMULATION"/);
  assert.match(source, /tag: "NOT DEPLOYED"/);
  assert.match(source, /tag: "READ-ONLY"/);
  assert.match(source, /no on-chain orders or swaps/);
  assert.doesNotMatch(source, /title: "Exchange Terminal"[^\n]*tag: "LIVE"/);
});

test("Netlify API route precedes the SPA fallback", async () => {
  const fs = await import("node:fs/promises");
  const config = await fs.readFile(new URL("../netlify.toml", import.meta.url), "utf8");
  assert.ok(config.indexOf('from = "/api/ecosystem-feed"') < config.indexOf('from = "/*"'));
  assert.match(config, /to = "\/\.netlify\/functions\/ecosystem-feed"/);
});
