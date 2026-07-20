// Pi Network payment approve/complete + auth verification.
// Requires authenticated Supabase user and ownership of the payment.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PI_API = "https://api.minepi.com/v2";
const PI_API_KEY = Deno.env.get("PI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function pi(path: string, init: RequestInit = {}) {
  if (!PI_API_KEY) throw new Error("PI_API_KEY not configured");
  const r = await fetch(`${PI_API}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Key ${PI_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  if (!r.ok) {
    console.error("Pi API error", r.status, text);
    throw new Error(`upstream_${r.status}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    // Require authenticated Supabase user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const { action, paymentId, txid, accessToken } = body ?? {};

    if (action === "auth") {
      if (typeof accessToken !== "string" || !accessToken) {
        return json({ error: "invalid_request" }, 400);
      }
      const me = await fetch(`${PI_API}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json());
      return json({ authenticated: true, user: me });
    }

    if (action !== "approve" && action !== "complete") {
      return json({ error: "unknown action" }, 400);
    }

    if (typeof paymentId !== "string" || !/^[A-Za-z0-9_-]{4,128}$/.test(paymentId)) {
      return json({ error: "invalid_payment_id" }, 400);
    }

    // Verify caller owns an order tied to this paymentId (via txid or deposit_memo linkage).
    // Use service role to bypass RLS for the ownership lookup.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: orders, error: orderErr } = await admin
      .from("service_orders")
      .select("id, user_uid, status, deposit_memo, txid")
      .eq("user_uid", userId)
      .or(`txid.eq.${paymentId},deposit_memo.eq.${paymentId}`)
      .limit(1);

    if (orderErr) {
      console.error("order lookup error", orderErr);
      return json({ error: "server_error" }, 500);
    }
    if (!orders || orders.length === 0) {
      return json({ error: "forbidden" }, 403);
    }

    if (action === "approve") {
      await pi(`/payments/${paymentId}/approve`, { method: "POST" });
      return json({ ok: true });
    }

    // complete
    if (typeof txid !== "string" || !/^[A-Za-z0-9]{4,128}$/.test(txid)) {
      return json({ error: "invalid_txid" }, 400);
    }
    await pi(`/payments/${paymentId}/complete`, {
      method: "POST",
      body: JSON.stringify({ txid }),
    });
    return json({ ok: true });
  } catch (e) {
    console.error("pi-payments error", e);
    return json({ error: "server_error" }, 500);
  }
});
