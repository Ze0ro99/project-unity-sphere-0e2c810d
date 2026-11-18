import test from "node:test";
import assert from "node:assert/strict";
import {
  HORIZON_TESTNET,
  fetchLatestLedgers,
  fetchLatestTx,
  fetchRoot,
  fetchAccount,
  fetchIssuedAssets,
} from "../src/lib/pi.ts";

test("all implicit Horizon helpers use Pi Testnet by default", async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ _embedded: { records: [] } }),
    };
  };
  try {
    await fetchLatestLedgers();
    await fetchLatestTx();
    await fetchRoot();
    await fetchAccount("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF");
    await fetchIssuedAssets("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF");
    assert.equal(urls.length, 5);
    for (const url of urls) assert.ok(url.startsWith(HORIZON_TESTNET), url);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
