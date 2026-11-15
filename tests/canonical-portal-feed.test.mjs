import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("canonical portal edge function reads the approved RPC and keeps secrets server-side", async () => {
  const source = await readFile(new URL("../supabase/functions/pirc-portal-feed/index.ts", import.meta.url), "utf8");
  assert.match(source, /db\.rpc\("pirc_portal_feed"\)/);
  assert.match(source, /Deno\.env\.get\("SUPABASE_SERVICE_ROLE_KEY"\)/);
  assert.doesNotMatch(source, /pirc_soroban_event_(inbox|cursors)\?select=.*network_id/);
  assert.doesNotMatch(source, /VITE_.*SERVICE_ROLE/);
  assert.match(source, /mainnetWrites: false/);
  assert.match(source, /signingEnabled: false/);
  assert.match(source, /rawEventsAreNotSettlementFinality: true/);
});

test("only one bounded portal poller exists in the app", async () => {
  const { readdir } = await import("node:fs/promises");
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(app, /CanonicalPortalSync/);
  const components = await readdir(new URL("../src/components/", import.meta.url));
  assert.ok(!components.includes("CanonicalPortalSync.tsx"));
  const hook = await readFile(new URL("../src/lib/usePortalFeed.ts", import.meta.url), "utf8");
  assert.match(hook, /refetchInterval/);
  const feed = await import("../src/lib/portal-feed.ts");
  assert.ok(feed.FEED_POLL_MS >= 60_000);
  const sync = await readFile(new URL("../src/components/EcosystemSync.tsx", import.meta.url), "utf8");
  assert.match(sync, /usePortalFeed\(\)/);
  assert.doesNotMatch(sync, /pirc-portal-feed/);
});
