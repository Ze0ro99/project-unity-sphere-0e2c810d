import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("canonical portal edge function reads the approved RPC and keeps secrets server-side", async () => {
  const source = await readFile(new URL("../supabase/functions/pirc-portal-feed/index.ts", import.meta.url), "utf8");
  assert.match(source, /db\.rpc\("pirc_portal_feed"\)/);
  assert.match(source, /Deno\.env\.get\("SUPABASE_SERVICE_ROLE_KEY"\)/);
  assert.match(source, /verify_jwt/); // deployment contract documented in Supabase config
  assert.doesNotMatch(source, /pirc_soroban_event_(inbox|cursors)\?select=.*network_id/);
  assert.doesNotMatch(source, /VITE_.*SERVICE_ROLE/);
  assert.match(source, /mainnetWrites: false/);
  assert.match(source, /signingEnabled: false/);
  assert.match(source, /rawEventsAreNotSettlementFinality: true/);
});

test("canonical portal component has no mock fallback or server secret", async () => {
  const source = await readFile(new URL("../src/components/CanonicalPortalSync.tsx", import.meta.url), "utf8");
  assert.match(source, /VITE_PIRC_PORTAL_FEED_URL/);
  assert.match(source, /VITE_PIRC_PORTAL_FEED_ANON_KEY/);
  assert.match(source, /No local mock data is substituted/);
  assert.doesNotMatch(source, /SERVICE_ROLE_KEY|service_role/i);
});
