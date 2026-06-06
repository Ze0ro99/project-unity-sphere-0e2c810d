/**
 * Pi Network SDK integration helpers.
 *
 * The Pi SDK is delivered via the Pi Browser at runtime:
 *   <script src="https://sdk.minepi.com/pi-sdk.js"></script>
 *
 * Docs: https://github.com/pi-apps/pi-platform-docs
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
      init: (opts: { version: string; sandbox?: boolean }) => void;
      authenticate: (
        scopes: PiScopes[],
        onIncompletePaymentFound: (p: unknown) => void,
      ) => Promise<PiAuthResult>;
      createPayment: (data: PiPaymentData, callbacks: PiPaymentCallbacks) => void;
    };
  }
}

let initialized = false;

export function initPi(sandbox = true) {
  if (typeof window === "undefined") return false;
  if (!window.Pi) return false;
  if (initialized) return true;
  window.Pi.init({ version: "2.0", sandbox });
  initialized = true;
  return true;
}

export async function authenticatePi(): Promise<PiAuthResult | null> {
  if (!initPi()) return null;
  try {
    return await window.Pi!.authenticate(
      ["username", "payments", "wallet_address"],
      (incomplete) => console.log("Incomplete payment found:", incomplete),
    );
  } catch (err) {
    console.error("Pi auth failed", err);
    return null;
  }
}

export function createPiPayment(data: PiPaymentData, callbacks: PiPaymentCallbacks) {
  if (!initPi()) {
    callbacks.onError(new Error("Pi SDK not available. Open inside the Pi Browser."));
    return;
  }
  window.Pi!.createPayment(data, callbacks);
}
