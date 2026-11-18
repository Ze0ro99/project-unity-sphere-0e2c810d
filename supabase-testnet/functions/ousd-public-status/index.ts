import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=15, s-maxage=15",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "GET") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    return json({ ok: false, error: "server_configuration_unavailable" }, 503);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Application-Name": "pirc-ousd-public-status" } },
  });

  const { data, error } = await supabase
    .from("ousd_public_status")
    .select("*")
    .eq("network_id", "pi-testnet")
    .maybeSingle();

  if (error) {
    // Do not leak database details from a public endpoint.
    console.error("OUSD status query failed:", error.code ?? "unknown");
    return json({ ok: false, error: "status_temporarily_unavailable" }, 503);
  }

  return json({
    ok: true,
    network: "pi-testnet",
    source: "supabase_private_ousd_ledger",
    mode: "read_only",
    data: data ?? {
      network_id: "pi-testnet",
      status: "source_only_not_deployed",
      operational_state: "NOT_CONFIGURED",
      attestor_verified_reserve_usd_micros: "0",
      outstanding_usd_micros: "0",
      redemption_pending_usd_micros: "0",
      paid_and_burned_usd_micros: "0",
    },
    generated_at: new Date().toISOString(),
  });
});
