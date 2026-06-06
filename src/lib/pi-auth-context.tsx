import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { authenticatePi } from "@/lib/pi-sdk";
import { verifyPiAccessToken } from "@/lib/pi-auth.functions";

export interface PiSessionUser {
  uid: string;
  username: string;
}

interface PiAuthContextValue {
  user: PiSessionUser | null;
  accessToken: string | null;
  status: "idle" | "authenticating" | "authenticated" | "error" | "unavailable";
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const PiAuthContext = createContext<PiAuthContextValue | null>(null);

const STORAGE_KEY = "pirc.pi.session";

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

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiSessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<PiAuthContextValue["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const autoTried = useRef(false);

  const signIn = useCallback(async () => {
    setStatus("authenticating");
    setError(null);
    try {
      const result = await authenticatePi();
      if (!result) {
        setStatus("unavailable");
        setError("Pi SDK unavailable. Open this app inside the Pi Browser.");
        return;
      }
      const verified = await verifyPiAccessToken({ data: { accessToken: result.accessToken } });
      const session = { user: verified, accessToken: result.accessToken };
      setUser(verified);
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

  // Hydrate from saved session, then auto-trigger Pi authentication on load.
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const saved = loadSession();
    if (saved) {
      setUser(saved.user);
      setAccessToken(saved.accessToken);
      setStatus("authenticated");
      return;
    }
    void signIn();
  }, [signIn]);

  return (
    <PiAuthContext.Provider value={{ user, accessToken, status, error, signIn, signOut }}>
      {children}
    </PiAuthContext.Provider>
  );
}

export function usePiAuth(): PiAuthContextValue {
  const ctx = useContext(PiAuthContext);
  if (!ctx) throw new Error("usePiAuth must be used within PiAuthProvider");
  return ctx;
}
