// Pi Network SDK wrapper and shared React connection store.
// Pi authentication, wallet-address permission, and payment permission are separate.
// The browser never receives a server API key or a private signing key.
import { useCallback, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Pi?: any;
  }
}

export type PiUser = {
  uid: string;
  username: string;
  walletAddress?: string | null;
};

export type PiTestnetBalance = {
  status: "read_only_verified" | "account_not_found" | "wallet_address_unavailable" | "unavailable";
  network_id?: string;
  network_alias?: string;
  account_id?: string;
  native_balance: string | null;
  asset?: string;
  sequence?: string | null;
  ledger?: number | null;
  notice?: string;
};

export type PaymentData = {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
};

type PiConnectionSnapshot = {
  user: PiUser | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  testnetBalance: PiTestnetBalance | null;
  refreshingBalance: boolean;
};

const initialSnapshot: PiConnectionSnapshot = {
  user: null,
  connected: false,
  loading: false,
  error: null,
  testnetBalance: null,
  refreshingBalance: false,
};

let connectionSnapshot = initialSnapshot;
const connectionListeners = new Set<() => void>();

function publishConnection(patch: Partial<PiConnectionSnapshot>) {
  connectionSnapshot = { ...connectionSnapshot, ...patch };
  connectionListeners.forEach((listener) => listener());
}

function subscribeConnection(listener: () => void) {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
}

function getConnectionSnapshot() {
  return connectionSnapshot;
}

/**
 * Sandbox mode is ONLY correct inside the Pi Developer sandbox or local/preview
 * testing. Inside the real Pi Browser it must be false.
 */
function detectSandbox(): boolean {
  const flag = (import.meta as any).env?.VITE_PI_SANDBOX;
  if (flag === "true") return true;
  if (flag === "false") return false;
  if (typeof window === "undefined") return false;
  const ancestors = Array.from((window.location as any).ancestorOrigins ?? []) as string[];
  const ref = document.referrer || "";
  if ([...ancestors, ref].some((origin) => origin.includes("sandbox.minepi.com"))) return true;
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
          const result = window.Pi.init({ version: "2.0", sandbox: SANDBOX });
          Promise.resolve(result).then(() => resolve()).catch(reject);
        } catch (error) {
          reject(error);
        }
        return;
      }
      if (Date.now() - start > 8000) return reject(new Error("Pi SDK not loaded"));
      setTimeout(tick, 150);
    };
    tick();
  }).catch((error) => {
    initPromise = null;
    throw error;
  });
  return initPromise;
}

let piAccessToken: string | null = null;
let piPaymentsScopeGranted = false;

async function serverCall(action: string, body: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke("pi-payments", {
    body: { action, ...(piAccessToken ? { accessToken: piAccessToken } : {}), ...body },
  });
  if (error) throw error;
  return data;
}

async function onIncompletePaymentFound(payment: any) {
  // Pi may call this only after a blockchain transaction exists. The server
  // verifies the payment ID and exact txid with Pi before completing it.
  const paymentId = payment?.identifier;
  const txid = payment?.transaction?.txid;
  if (!paymentId || !txid) {
    console.warn("incomplete Pi payment requires manual reconciliation", paymentId);
    return;
  }
  try {
    await serverCall("complete", { paymentId, txid });
  } catch (error) {
    console.warn("incomplete payment resolution failed", error);
  }
}

export function usePiConnection() {
  const state = useSyncExternalStore(
    subscribeConnection,
    getConnectionSnapshot,
    getConnectionSnapshot,
  );

  const connect = useCallback(async () => {
    if (connectionSnapshot.loading || connectionSnapshot.connected) return;
    publishConnection({ loading: true, error: null });
    try {
      await initPi();
      if (!window.Pi) throw new Error("Pi SDK unavailable");
      // wallet_address is used to bind the authenticated Pioneer to the Pi
      // wallet address. Payment scope is not requested for a simple connection.
      const auth = await window.Pi.authenticate(
        ["username", "wallet_address"],
        onIncompletePaymentFound,
      );
      piAccessToken = auth.accessToken;
      piPaymentsScopeGranted = false;
      const verified = await serverCall("auth", { accessToken: auth.accessToken });
      if (!verified?.authenticated || !verified?.user?.uid) {
        throw new Error("Pi Platform did not verify the authenticated user");
      }
      let testnetBalance: PiTestnetBalance | null = null;
      try {
        testnetBalance = await serverCall("wallet_balance", { accessToken: auth.accessToken });
      } catch (balanceError) {
        console.warn("Pi Testnet balance read unavailable", balanceError);
        testnetBalance = {
          status: "unavailable",
          native_balance: null,
          notice: "Read-only Pi Testnet balance could not be verified.",
        };
      }
      publishConnection({
        user: {
          uid: verified.user.uid,
          username: verified.user.username ?? auth.user.username,
          walletAddress: verified.user.wallet_address ?? null,
        },
        connected: true,
        error: null,
        testnetBalance,
      });
    } catch (error: any) {
      piAccessToken = null;
      piPaymentsScopeGranted = false;
      publishConnection({
        user: null,
        connected: false,
        error: error?.message ?? "Pi authentication failed",
      });
    } finally {
      publishConnection({ loading: false });
    }
  }, []);

  const refreshTestnetBalance = useCallback(async () => {
    if (!connectionSnapshot.connected || !piAccessToken) return;
    publishConnection({ refreshingBalance: true });
    try {
      const testnetBalance = await serverCall("wallet_balance", { accessToken: piAccessToken });
      publishConnection({ testnetBalance });
    } catch (error) {
      console.warn("Pi Testnet balance refresh unavailable", error);
      publishConnection({
        testnetBalance: {
          status: "unavailable",
          native_balance: null,
          notice: "Read-only Pi Testnet balance could not be verified.",
        },
      });
    } finally {
      publishConnection({ refreshingBalance: false });
    }
  }, []);

  const disconnect = useCallback(() => {
    piAccessToken = null;
    piPaymentsScopeGranted = false;
    publishConnection({ ...initialSnapshot });
  }, []);

  return { ...state, connect, disconnect, refreshTestnetBalance };
}

async function ensurePiPaymentPermission(): Promise<void> {
  await initPi();
  if (!window.Pi) throw new Error("Pi SDK unavailable");
  if (piPaymentsScopeGranted && piAccessToken) return;

  const auth = await window.Pi.authenticate(
    ["username", "wallet_address", "payments"],
    onIncompletePaymentFound,
  );
  piAccessToken = auth.accessToken;
  const verified = await serverCall("auth", { accessToken: auth.accessToken });
  if (!verified?.authenticated) throw new Error("Pi Platform payment identity verification failed");
  piPaymentsScopeGranted = true;
  publishConnection({
    user: {
      uid: verified.user?.uid ?? auth.user.uid,
      username: verified.user?.username ?? auth.user.username,
      walletAddress: verified.user?.wallet_address ?? connectionSnapshot.user?.walletAddress ?? null,
    },
    connected: true,
    error: null,
  });
}

export function usePiPurchase(payment: PaymentData) {
  return useCallback(async () => {
    await ensurePiPaymentPermission();
    if (!piAccessToken) throw new Error("Connect your Pi account first");
    return window.Pi.createPayment(payment, {
      onReadyForServerApproval: async (paymentId: string) => {
        await serverCall("approve", { paymentId });
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        await serverCall("complete", { paymentId, txid });
      },
      onCancel: (paymentId: string) => console.info("Pi payment cancelled", paymentId),
      onError: (error: Error) => console.error("Pi payment error", error),
    });
  }, [payment]);
}
