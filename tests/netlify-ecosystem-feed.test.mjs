import test from "node:test";
import assert from "node:assert/strict";

test("Netlify ecosystem feed source is read-only and pins Pi Testnet endpoints", async () => {
  const fs = await import("node:fs/promises");
  const source = await fs.readFile(new URL("../netlify/functions/ecosystem-feed.js", import.meta.url), "utf8");
  assert.match(source, /https:\/\/rpc\.testnet\.minepi\.com/);
  assert.match(source, /https:\/\/api\.testnet\.minepi\.com/);
  assert.match(source, /EXPECTED_PASSPHRASE = "Pi Testnet"/);
  assert.match(source, /events\?per_page=8/);
  assert.match(source, /function compactEvent/);
  assert.match(source, /mainnetWrites: false/);
  assert.match(source, /signingEnabled: false/);
  assert.match(source, /tokenTransfersEnabled: false/);
  assert.doesNotMatch(source, /sendTransaction|submitTransaction|signTransaction|mint\(/i);
});

test("Netlify API route precedes the SPA fallback", async () => {
  const fs = await import("node:fs/promises");
  const config = await fs.readFile(new URL("../netlify.toml", import.meta.url), "utf8");
  assert.ok(config.indexOf('from = "/api/ecosystem-feed"') < config.indexOf('from = "/*"'));
  assert.match(config, /to = "\/\.netlify\/functions\/ecosystem-feed"/);
});
