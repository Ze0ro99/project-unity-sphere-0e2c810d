import { createServerFn } from "@tanstack/react-start";

const PI_API_BASE = "https://api.minepi.com/v2";

function authHeaders() {
  const key = process.env.PI_NETWORK_API_KEY;
  if (!key) throw new Error("PI_NETWORK_API_KEY is not configured on the server.");
  return { Authorization: `Key ${key}`, "Content-Type": "application/json" };
}

/** Server-to-server: approve a pending Pi payment. */
export const approvePiPayment = createServerFn({ method: "POST" })
  .inputValidator((data: { paymentId: string }) => {
    if (!data?.paymentId || typeof data.paymentId !== "string") {
      throw new Error("paymentId required");
    }
    return { paymentId: data.paymentId };
  })
  .handler(async ({ data }) => {
    const res = await fetch(`${PI_API_BASE}/payments/${data.paymentId}/approve`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Pi approve failed (${res.status}): ${body}`);
    }
    return { ok: true, payment: await res.json() };
  });

/** Server-to-server: complete a Pi payment after the on-chain txid is known. */
export const completePiPayment = createServerFn({ method: "POST" })
  .inputValidator((data: { paymentId: string; txid: string }) => {
    if (!data?.paymentId || !data?.txid) throw new Error("paymentId and txid required");
    return { paymentId: data.paymentId, txid: data.txid };
  })
  .handler(async ({ data }) => {
    const res = await fetch(`${PI_API_BASE}/payments/${data.paymentId}/complete`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ txid: data.txid }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Pi complete failed (${res.status}): ${body}`);
    }
    // TODO: persist fulfilment for this user (grant premium access).
    return { ok: true, payment: await res.json() };
  });

/**
 * Resolve an incomplete payment found by the Pi SDK at sign-in time.
 * If it already has a txid, complete it; otherwise it likely needs cancellation
 * by the user — we return its current state so the client can react.
 */
export const resolveIncompletePiPayment = createServerFn({ method: "POST" })
  .inputValidator((data: { paymentId: string; txid?: string | null }) => {
    if (!data?.paymentId) throw new Error("paymentId required");
    return { paymentId: data.paymentId, txid: data.txid ?? null };
  })
  .handler(async ({ data }) => {
    if (data.txid) {
      const res = await fetch(`${PI_API_BASE}/payments/${data.paymentId}/complete`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ txid: data.txid }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Pi complete (incomplete payment) failed (${res.status}): ${body}`);
      }
      return { resolved: true, payment: await res.json() };
    }
    // No txid yet — approve it so the user can finish from the Pi Browser.
    const res = await fetch(`${PI_API_BASE}/payments/${data.paymentId}/approve`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Pi approve (incomplete payment) failed (${res.status}): ${body}`);
    }
    return { resolved: false, payment: await res.json() };
  });
