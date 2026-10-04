// Pi Network auth verification + payment approve/complete.
//
// Identity comes from the Pi Network itself: the client sends the Pi access token
// returned by Pi.authenticate(), we verify it against https://api.minepi.com/v2/me,
// and every payment is checked against the Pi Platform API so a user can only
// approve/complete payments that belong to them and to this app.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3.23.8";

const PI_API = "https://api.minepi.com/v2";
const PI_API_KEY = (Deno.env.get("PI_API_KEY") || Deno.env.get("PI_NETWORK_API_KEY") || "").trim();

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const Id = z.string().regex(/^[A-Za-z0-9_-]{4,128}$/);
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("health") }),
  z.object({ action: z.literal("auth"), accessToken: z.string().min(10).max(4096) }),
  z.object({ action: z.literal("approve"), accessToken: z.string().min(10).max(4096), paymentId: Id }),
  z.object({
    action: z.literal("complete"),
    accessToken: z.string().min(10).max(4096).optional(),
    paymentId: Id,
    txid: z.string().regex(/^[A-Za-z0-9]{4,128}$/),
  }),
]);

async function piServer(path: string, init: RequestInit = {}) {
  if (!PI_API_KEY) throw new Error("PI_API_KEY not configured");
  const r = await fetch(`${PI_API}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Key ${PI_API_KEY}`, "Content-Type": "application/json" },
  });
  const text = await r.text();
  if (!r.ok) {
    console.error("Pi API error", path, r.status, text.slice(0, 300));
    throw new Error(`upstream_${r.status}`);
  }
  return text ? JSON.parse(text) : {};
}

async function piUser(accessToken: string): Promise<{ uid: string; username: string } | null> {
  const r = await fetch(`${PI_API}/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) return null;
  const me = await r.json().catch(() => null);
  return me?.uid ? { uid: me.uid, username: me.username } : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const missingToken = parsed.error.issues.some((i) => i.path[0] === "accessToken");
    return missingToken
      ? json({ error: "Unauthorized" }, 401)
      : json({ error: "invalid_request", details: parsed.error.flatten().fieldErrors }, 400);
  }
  const body = parsed.data;

  try {
    if (body.action === "health") {
      // Confirms the server API key is accepted by Pi Network (no secret is returned).
      if (!PI_API_KEY) return json({ ok: false, key: "missing" });
      try {
        await piServer("/payments/incomplete_server_payments");
        return json({ ok: true, key: "valid" });
      } catch (e) {
        return json({ ok: false, key: "rejected", detail: (e as Error).message });
      }
    }

    if (body.action === "auth") {
      const me = await piUser(body.accessToken);
      if (!me) return json({ error: "Unauthorized" }, 401);
      return json({ authenticated: true, user: me });
    }

    const payment = await piServer(`/payments/${body.paymentId}`);

    if (body.action === "approve") {
      const me = await piUser(body.accessToken);
      if (!me) return json({ error: "Unauthorized" }, 401);
      if (payment.user_uid !== me.uid) return json({ error: "forbidden" }, 403);
      if (payment.status?.developer_approved) return json({ ok: true, already: true });
      await piServer(`/payments/${body.paymentId}/approve`, { method: "POST" });
      return json({ ok: true });
    }

    // complete — allowed for the payer, or for an incomplete payment recovered at login
    // as long as the on-chain txid matches the one Pi recorded for this payment.
    if (body.accessToken) {
      const me = await piUser(body.accessToken);
      if (!me) return json({ error: "Unauthorized" }, 401);
      if (payment.user_uid !== me.uid) return json({ error: "forbidden" }, 403);
    } else if (!payment.transaction?.txid || payment.transaction.txid !== body.txid) {
      return json({ error: "forbidden" }, 403);
    }
    if (payment.status?.developer_completed) return json({ ok: true, already: true });
    await piServer(`/payments/${body.paymentId}/complete`, {
      method: "POST",
      body: JSON.stringify({ txid: body.txid }),
    });
    return json({ ok: true });
  } catch (e) {
    console.error("pi-payments error", e);
    const msg = (e as Error).message ?? "";
    if (msg.startsWith("upstream_404")) return json({ error: "payment_not_found" }, 404);
    return json({ error: "server_error" }, 500);
  }
});
