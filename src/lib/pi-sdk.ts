/**
 * Pi Network SDK integration helpers.
 * Script tag injected via __root.tsx: https://sdk.minepi.com/pi-sdk.js
 * Docs: https://pi-apps.github.io/pi-sdk-docs/quick-start/genai/Authentication
 */

export type PiScopes = "username" | "payments" | "wallet_address";

export interface PiAuthResult {
  accessToken: string;
  user: { uid: string; username: string };
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: unknown) => void;
}

declare global {
  interface Window {
    Pi?: {
      init: (opts: { version: string; sandbox?: boolean }) => Promise<void> | void;
      authenticate: (
        scopes: PiScopes[],
        onIncompletePaymentFound: (p: unknown) => void,
      ) => Promise<PiAuthResult>;
      createPayment: (data: PiPaymentData, callbacks: PiPaymentCallbacks) => void;
    };
  }
}

let initPromise: Promise<boolean> | null = null;

/** Wait for the Pi SDK script tag to load (up to ~5s). */
function waitForPiSdk(timeoutMs = 5000): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Pi) return Promise.resolve(true);
  return new Promise((resolve) => {
    const start = Date.now();
    const id = window.setInterval(() => {
      if (window.Pi) {
        window.clearInterval(id);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        window.clearInterval(id);
        resolve(false);
      }
    }, 100);
  });
}

/** Treat Pi.init as a Promise; await fully before authenticate. */
export async function initPi(sandbox = true): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const ready = await waitForPiSdk();
    if (!ready || !window.Pi) return false;
    await Promise.resolve(window.Pi.init({ version: "2.0", sandbox }));
    return true;
  })();
  return initPromise;
}

export async function authenticatePi(
  scopes: PiScopes[] = ["username", "payments"],
  onIncompletePaymentFound: (payment: unknown) => void = (p) =>
    console.warn("Incomplete Pi payment found:", p),
): Promise<PiAuthResult | null> {
  const ok = await initPi();
  if (!ok || !window.Pi) return null;
  try {
    return await window.Pi.authenticate(scopes, onIncompletePaymentFound);
  } catch (err) {
    console.error("Pi auth failed", err);
    return null;
  }
}

export async function createPiPayment(
  data: PiPaymentData,
  callbacks: PiPaymentCallbacks,
): Promise<void> {
  const ok = await initPi();
  if (!ok || !window.Pi) {
    callbacks.onError(new Error("Pi SDK not available. Open inside the Pi Browser."));
    return;
  }
  window.Pi.createPayment(data, callbacks);
}
