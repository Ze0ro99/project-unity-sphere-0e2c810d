// Pi Network SDK wrapper + React hooks.
// Loads window.Pi (included via <script src="https://sdk.minepi.com/pi-sdk.js" />).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Pi?: any;
  }
}

export type PiUser = { uid: string; username: string };

export type PaymentData = {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
};

/**
 * Sandbox mode is ONLY correct inside the Pi Developer sandbox (sandbox.minepi.com)
 * or local/preview testing. Inside the real Pi Browser it must be false, otherwise
 * authentication and payments silently fail. VITE_PI_SANDBOX overrides detection.
 */
function detectSandbox(): boolean {
  const flag = (import.meta as any).env?.VITE_PI_SANDBOX;
  if (flag === "true") return true;
  if (flag === "false") return false;
  if (typeof window === "undefined") return false;
  const ancestors = Array.from((window.location as any).ancestorOrigins ?? []) as string[];
  const ref = document.referrer || "";
  if ([...ancestors, ref].some((o) => o.includes("sandbox.minepi.com"))) return true;
  const host = window.location.hostname;
  return host === "localhost" || host.startsWith("id-preview--");
}

export const SANDBOX = detectSandbox();

let initPromise: Promise<void> | null = null;

export function initPi(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (typeof window !== "undefined" && window.Pi) {
        try {
          const res = window.Pi.init({ version: "2.0", sandbox: SANDBOX });
          Promise.resolve(res).then(() => resolve()).catch(reject);
        } catch (e) {
          reject(e);
        }
        return;
      }
      if (Date.now() - start > 8000) return reject(new Error("Pi SDK not loaded"));
      setTimeout(tick, 150);
    };
    tick();
  });
  return initPromise;
}

async function serverCall(action: string, body: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke("pi-payments", {
    body: { action, ...body },
  });
  if (error) throw error;
  return data;
}

async function onIncompletePaymentFound(payment: any) {
  try {
    await serverCall("complete", {
      paymentId: payment.identifier,
      txid: payment.transaction?.txid,
    });
  } catch (e) {
    console.warn("incomplete payment resolve failed", e);
  }
}

export function usePiConnection() {
  const [user, setUser] = useState<PiUser | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await initPi();
      const auth = await window.Pi.authenticate(
        ["username", "payments"],
        onIncompletePaymentFound
      );
      await serverCall("auth", { accessToken: auth.accessToken });
      setUser({ uid: auth.user.uid, username: auth.user.username });
      setConnected(true);
    } catch (e: any) {
      setError(e?.message ?? "Pi authentication failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, connected, loading, error, connect };
}

export function usePiPurchase(payment: PaymentData) {
  return useCallback(async () => {
    await initPi();
    if (!window.Pi) throw new Error("Pi SDK unavailable");
    return window.Pi.createPayment(payment, {
      onReadyForServerApproval: async (paymentId: string) => {
        await serverCall("approve", { paymentId });
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        await serverCall("complete", { paymentId, txid });
      },
      onCancel: (paymentId: string) => console.log("payment cancelled", paymentId),
      onError: (err: Error, p?: any) => console.error("payment error", err, p),
    });
  }, [payment]);
}
