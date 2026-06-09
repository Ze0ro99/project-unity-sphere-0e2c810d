import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RECEIVER =
  process.env.VITE_PI_RECEIVER_ADDRESS ||
  "GD6HJ6WAXF4I7EW7M3SHOKRALOOPSSYSNVLCJ66PBFZRBZKYMPQFNMP4";

const HORIZON: Record<string, string> = {
  mainnet: "https://api.mainnet.minepi.com",
  testnet: "https://api.testnet.minepi.com",
  testnet2: "https://api.testnet2.minepi.com",
};

function randomMemo() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `svc_${hex}`;
}

const CreateOrderSchema = z.object({
  serviceId: z.string().min(1).max(64),
  amount: z.number().positive().max(100000),
  appUrl: z.string().trim().min(1).max(2048).url().optional().or(z.literal("")),
  userUid: z.string().trim().min(1).max(128),
  username: z.string().trim().max(64).optional(),
  network: z.enum(["mainnet", "testnet", "testnet2"]).default("testnet"),
});

export const createServiceOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: svc, error: svcErr } = await supabaseAdmin
      .from("service_catalog")
      .select("*")
      .eq("id", data.serviceId)
      .eq("active", true)
      .single();
    if (svcErr || !svc) throw new Error("Service not found");
    if (data.amount < Number(svc.min_price_pi)) {
      throw new Error(`Minimum amount is ${svc.min_price_pi} π`);
    }

    // Duration scales with amount for the Custom tier; fixed otherwise.
    const hours =
      svc.id === "custom"
        ? Math.max(24, Math.floor((data.amount / Number(svc.min_price_pi)) * 24))
        : svc.duration_hours;
    const expiresAt = hours > 0 ? new Date(Date.now() + hours * 3600_000).toISOString() : null;

    const memo = randomMemo();
    const { data: order, error } = await supabaseAdmin
      .from("service_orders")
      .insert({
        user_uid: data.userUid,
        pi_username: data.username ?? null,
        service_id: data.serviceId,
        amount_pi: data.amount,
        app_url: data.appUrl || null,
        deposit_memo: memo,
        receiver_address: RECEIVER,
        network: data.network,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("*")
      .single();
    if (error || !order) throw new Error(error?.message ?? "Failed to create order");

    await supabaseAdmin.from("service_payment_events").insert({
      order_id: order.id,
      event_type: "created",
      payload: { amount: data.amount, network: data.network },
    });

    return { order, service: svc };
  });

export const getServiceOrder = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("service_orders")
      .select("*, service:service_catalog(*)")
      .eq("id", data.id)
      .single();
    if (error || !order) throw new Error("Order not found");
    return order;
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .inputValidator((d: { userUid: string }) =>
    z.object({ userUid: z.string().min(1).max(128) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("service_orders")
      .select("*, service:service_catalog(*)")
      .eq("user_uid", data.userUid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("service_catalog")
    .select("*")
    .eq("active", true)
    .order("min_price_pi", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

/**
 * Polls Horizon for a payment to RECEIVER with the order's memo & amount.
 * If found → marks `paid` then `active`.
 * Also auto-expires orders whose expires_at has passed.
 */
export const verifyServiceOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("service_orders")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !order) throw new Error("Order not found");

    // expire?
    if (
      order.status === "active" &&
      order.expires_at &&
      new Date(order.expires_at).getTime() < Date.now()
    ) {
      await supabaseAdmin
        .from("service_orders")
        .update({ status: "expired" })
        .eq("id", order.id);
      return { ...order, status: "expired" };
    }

    if (order.status !== "pending") return order;

    const base = HORIZON[order.network] ?? HORIZON.testnet;
    let cursor = "";
    let attempts = 0;
    // scan up to 4 pages (800 most recent payments)
    while (attempts < 4) {
      const url = `${base}/accounts/${order.receiver_address}/payments?order=desc&limit=200${cursor}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const json = (await res.json()) as {
        _embedded?: { records: Array<{ id: string; transaction_hash: string; to?: string; amount?: string; type: string }> };
      };
      const records = json._embedded?.records ?? [];
      if (records.length === 0) break;
      for (const p of records) {
        if (p.type !== "payment" || p.to !== order.receiver_address) continue;
        // fetch parent tx to read memo
        const tx = await fetch(`${base}/transactions/${p.transaction_hash}`);
        if (!tx.ok) continue;
        const txd = (await tx.json()) as { memo_type?: string; memo?: string; successful?: boolean };
        if (
          txd.successful &&
          (txd.memo_type === "text" || txd.memo_type === "MEMO_TEXT") &&
          txd.memo === order.deposit_memo &&
          Number(p.amount) + 1e-7 >= Number(order.amount_pi)
        ) {
          const hours = order.expires_at
            ? Math.max(0, Math.round((new Date(order.expires_at).getTime() - Date.now()) / 3600_000))
            : 0;
          const newExpires =
            hours > 0
              ? order.expires_at
              : new Date(Date.now() + 24 * 3600_000).toISOString();
          await supabaseAdmin
            .from("service_orders")
            .update({
              status: "active",
              txid: p.transaction_hash,
              activated_at: new Date().toISOString(),
              expires_at: newExpires,
            })
            .eq("id", order.id);
          await supabaseAdmin.from("service_payment_events").insert({
            order_id: order.id,
            event_type: "payment_confirmed",
            payload: { txid: p.transaction_hash, amount: p.amount },
          });
          return { ...order, status: "active", txid: p.transaction_hash, activated_at: new Date().toISOString() };
        }
      }
      cursor = `&cursor=${encodeURIComponent(records[records.length - 1].id)}`;
      attempts++;
    }
    return order;
  });
