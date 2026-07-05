// Pi Network payment approve/complete + auth verification.
// Deployed as public edge function (Pi Browser calls from client).
// Requires PI_API_KEY (Pi Developer API key) to be set as a secret.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PI_API = "https://api.minepi.com/v2";
const PI_API_KEY = Deno.env.get("PI_API_KEY") ?? "";

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
  if (!r.ok) throw new Error(`Pi API ${r.status}: ${text}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { action, paymentId, txid, accessToken } = await req.json();

    if (action === "auth") {
      const me = await fetch(`${PI_API}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json());
      return json({ authenticated: true, user: me });
    }

    if (action === "approve") {
      const data = await pi(`/payments/${paymentId}/approve`, { method: "POST" });
      return json({ ok: true, data });
    }

    if (action === "complete") {
      const data = await pi(`/payments/${paymentId}/complete`, {
        method: "POST",
        body: JSON.stringify({ txid }),
      });
      return json({ ok: true, data });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
