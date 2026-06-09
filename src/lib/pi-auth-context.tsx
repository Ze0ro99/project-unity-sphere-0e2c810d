import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { authenticatePi, createPiPayment } from "@/lib/pi-sdk";
import { verifyPiAccessToken } from "@/lib/pi-auth.functions";
import {
  approvePiPayment,
  completePiPayment,
  resolveIncompletePiPayment,
} from "@/lib/pi-payments.functions";

export interface PiSessionUser {
  uid: string;
  username: string;
  wallet_address?: string;
}

export interface PiProduct {
  name: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

/** The single in-app product sold via U2A Pi payments. */
export const PREMIUM_ACCESS_PRODUCT: PiProduct = {
  name: "PiRC Premium Access",
  amount: 10,
  memo: "PiRC Premium Access — unlock integrations, contracts & advanced services",
  metadata: { sku: "pirc_premium_access_v1", type: "subscription", durationDays: 365 },
};

interface PiAuthContextValue {
  user: PiSessionUser | null;
  accessToken: string | null;
  status: "idle" | "authenticating" | "authenticated" | "error" | "unavailable";
  error: string | null;
  hasPremium: boolean;
  paymentStatus: "idle" | "creating" | "approving" | "completing" | "success" | "cancelled" | "error";
  paymentError: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  purchase: (product?: PiProduct) => Promise<void>;
}

const PiAuthContext = createContext<PiAuthContextValue | null>(null);

const STORAGE_KEY = "pirc.pi.session";
const PREMIUM_KEY = "pirc.pi.premium";

function loadSession(): { user: PiSessionUser; accessToken: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.user?.uid && parsed?.accessToken) return parsed;
  } catch {}
  return null;
}

async function handleIncomplete(payment: unknown) {
  try {
    const p = payment as { identifier?: string; transaction?: { txid?: string } | null };
    if (!p?.identifier) return;
    await resolveIncompletePiPayment({
      data: { paymentId: p.identifier, txid: p.transaction?.txid ?? null },
    });
  } catch (e) {
    console.error("Failed to resolve incomplete Pi payment", e);
  }
}

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiSessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<PiAuthContextValue["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PiAuthContextValue["paymentStatus"]>("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const autoTried = useRef(false);

  const signIn = useCallback(async () => {
    setStatus("authenticating");
    setError(null);
    try {
      const result = await authenticatePi(
        ["username", "payments", "wallet_address"],
        handleIncomplete,
      );
      if (!result) {
        setStatus("unavailable");
        setError("Pi SDK unavailable. Open this app inside the Pi Browser.");
        return;
      }
      const verified = await verifyPiAccessToken({ data: { accessToken: result.accessToken } });
      const merged: PiSessionUser = { ...verified, wallet_address: result.user?.wallet_address };
      const session = { user: merged, accessToken: result.accessToken };
      setUser(merged);
      setAccessToken(result.accessToken);
      setStatus("authenticated");
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch {}
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Authentication failed";
      setError(msg);
      setStatus("error");
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setStatus("idle");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const purchase = useCallback(
    async (product: PiProduct = PREMIUM_ACCESS_PRODUCT) => {
      setPaymentError(null);
      if (!user) {
        setPaymentError("Sign in with Pi first.");
        setPaymentStatus("error");
        return;
      }
      setPaymentStatus("creating");
      await createPiPayment(
        {
          amount: product.amount,
          memo: product.memo,
          metadata: { ...product.metadata, buyerUid: user.uid },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            setPaymentStatus("approving");
            try {
              await approvePiPayment({ data: { paymentId } });
            } catch (e) {
              setPaymentStatus("error");
              setPaymentError(e instanceof Error ? e.message : "Approval failed");
            }
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            setPaymentStatus("completing");
            try {
              await completePiPayment({ data: { paymentId, txid } });
              setHasPremium(true);
              try {
                localStorage.setItem(
                  PREMIUM_KEY,
                  JSON.stringify({ sku: product.metadata.sku, at: Date.now() }),
                );
              } catch {}
              setPaymentStatus("success");
            } catch (e) {
              setPaymentStatus("error");
              setPaymentError(e instanceof Error ? e.message : "Completion failed");
            }
          },
          onCancel: () => {
            setPaymentStatus("cancelled");
          },
          onError: (err) => {
            setPaymentStatus("error");
            setPaymentError(err.message);
          },
        },
      );
    },
    [user],
  );

  // Hydrate, then auto-trigger sign-in.
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const saved = loadSession();
    if (saved) {
      setUser(saved.user);
      setAccessToken(saved.accessToken);
      setStatus("authenticated");
    } else {
      void signIn();
    }
    try {
      if (localStorage.getItem(PREMIUM_KEY)) setHasPremium(true);
    } catch {}
  }, [signIn]);

  return (
    <PiAuthContext.Provider
      value={{
        user,
        accessToken,
        status,
        error,
        hasPremium,
        paymentStatus,
        paymentError,
        signIn,
        signOut,
        purchase,
      }}
    >
      {children}
    </PiAuthContext.Provider>
  );
}

export function usePiAuth(): PiAuthContextValue {
  const ctx = useContext(PiAuthContext);
  if (!ctx) throw new Error("usePiAuth must be used within PiAuthProvider");
  return ctx;
}
