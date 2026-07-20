// Tests for pi-payments edge function: auth + order-ownership enforcement.
// Runs against the deployed function using anon key (no valid JWT scenarios) and
// verifies each guard clause returns the correct status without needing PI_API_KEY.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/pi-payments`;

async function call(init: RequestInit) {
  const r = await fetch(FN_URL, init);
  const text = await r.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: r.status, body };
}

Deno.test("CORS preflight is public", async () => {
  const { status } = await call({ method: "OPTIONS" });
  assertEquals(status, 200);
});

Deno.test("rejects requests without Authorization header (401)", async () => {
  const { status, body } = await call({
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ action: "approve", paymentId: "pay_test_1234" }),
  });
  assertEquals(status, 401);
  assertEquals((body as { error: string }).error, "Unauthorized");
});

Deno.test("rejects malformed bearer token (401)", async () => {
  const { status, body } = await call({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: "Bearer not-a-real-jwt",
    },
    body: JSON.stringify({ action: "approve", paymentId: "pay_test_1234" }),
  });
  assertEquals(status, 401);
  assertEquals((body as { error: string }).error, "Unauthorized");
});

Deno.test("rejects anon-key bearer (no user sub) (401)", async () => {
  // Anon key is a valid JWT but has no `sub` — must not be treated as a user.
  const { status } = await call({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ action: "approve", paymentId: "pay_test_1234" }),
  });
  // getClaims may accept it but claims.sub is missing → downstream ownership
  // check must fail. Acceptable outcomes: 401 (no claims) or 403 (no order).
  if (status !== 401 && status !== 403) {
    throw new Error(`expected 401 or 403, got ${status}`);
  }
});

Deno.test("pirc_snapshots is not readable by anon role", async () => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/pirc_snapshots?select=id&limit=1`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  const text = await r.text();
  // Either 401/403, or an empty array (RLS blocks rows).
  if (r.status === 200) {
    const rows = JSON.parse(text);
    assertEquals(Array.isArray(rows) && rows.length, 0);
  } else if (r.status !== 401 && r.status !== 403) {
    throw new Error(`expected 200/401/403, got ${r.status}: ${text}`);
  }
});

Deno.test("service_orders is not readable by anon role", async () => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/service_orders?select=id&limit=1`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  const text = await r.text();
  if (r.status === 200) {
    const rows = JSON.parse(text);
    assertEquals(Array.isArray(rows) && rows.length, 0);
  } else if (r.status !== 401 && r.status !== 403) {
    throw new Error(`expected 200/401/403, got ${r.status}: ${text}`);
  }
});
