import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePortalFeed, portalFeedState, fetchPortalFeed, PortalFeedError, retryAfterMs, FEED_POLL_MS } from "../src/lib/portal-feed.ts";
test("empty inbox awaiting ingestion is not live", () => {
  const feed = parsePortalFeed({ status: "awaiting_testnet_ingestion", events: [] });
  assert.equal(portalFeedState(feed, 1000, null, 1001), "awaiting_testnet_ingestion");
  assert.deepEqual(feed.events, []);
});
test("empty successful response is distinct from awaiting ingestion", () => assert.equal(parsePortalFeed({ events: [] }).status, "empty"));
test("only supplied events are returned without invented ledger or attributes", () => {
  assert.deepEqual(parsePortalFeed({ network_id: "pi-testnet", events: [{ event_id: "abc" }] }).events, [{ id: "abc", ledger: null, observedAt: null, type: null }]);
});
test("malformed, wrong-network and contradictory responses fail closed", () => {
  for (const v of [null, {}, { error: "feed_query_failed" }, { events: "bad" }, { network_id: "mainnet", events: [] }, { events: [{}] }, { status: "awaiting_testnet_ingestion", events: [{ id: "a" }] }]) assert.throws(() => parsePortalFeed(v));
});
test("old snapshots and retained results after failure are stale", () => {
  const feed = parsePortalFeed({ events: [], generated_at: "2026-11-14T00:00:00Z" });
  assert.equal(portalFeedState(feed, Date.now(), null, Date.parse("2026-11-14T00:04:00Z")), "stale");
  assert.equal(portalFeedState(feed, Date.now(), new Error()), "stale");
  assert.equal(portalFeedState(undefined, 0, new Error()), "error");
});
test("429 honors Retry-After with at least 60 seconds", async () => {
  assert.equal(FEED_POLL_MS, 60000); assert.equal(retryAfterMs("120"), 120000); assert.equal(retryAfterMs("1"), 60000);
  await assert.rejects(fetchPortalFeed(undefined, async () => new Response("", { status: 429, headers: { "Retry-After": "120" } })), e => e instanceof PortalFeedError && e.kind === "rate_limited" && e.retryAt > Date.now() + 119000);
});
test("GET uses the public key and no wallet/session credentials", async () => {
  await fetchPortalFeed(undefined, async (url, init) => {
    assert.ok(url.endsWith("/pirc-portal-feed")); assert.equal(init.method, "GET"); assert.equal(init.credentials, "omit");
    assert.equal(init.headers.Authorization, `Bearer ${init.headers.apikey}`);
    return Response.json({ status: "awaiting_testnet_ingestion" });
  });
});