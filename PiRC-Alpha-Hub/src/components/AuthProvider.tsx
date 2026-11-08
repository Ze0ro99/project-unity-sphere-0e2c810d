import React, { createContext, useContext, useEffect, useState, useRef } from "react";

interface User {
  uid: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  isPiReady: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Using the injected APP_URL environment variable from AI Studio or a relative path
// For relative paths to Express proxy endpoints, we can just use /api/auth
const API_BASE = "";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPiReady, setIsPiReady] = useState(false);
  const isInitialized = useRef(false);

  const authenticateWithPi = async (isAutoAttempt: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      if (typeof window.Pi === "undefined") {
        if (import.meta.env.DEV) {
          console.log("Pi SDK is not loaded. Mocking Pi Network Auth for development/sandbox environment.");
          setUser({ uid: "demo_user_12345", username: "pi_demo_user" });
          setIsPiReady(true);
          setLoading(false);
          return;
        }
        throw new Error("Pi SDK is not loaded. Please ensure you are running this app inside the Pi Browser.");
      }

      // 1. Initialize Pi SDK as a Promise and fully await it before calling authenticate
      if (!isInitialized.current) {
        try {
          const sandbox = import.meta.env.VITE_PI_SANDBOX !== "false";
          await window.Pi.init({ version: "2.0", sandbox });
          isInitialized.current = true;
          setIsPiReady(true);
        } catch (e: any) {
          console.warn("Pi.init error:", e.message || e);
          if (import.meta.env.DEV) {
            console.log("Mocking Pi Network Auth for development/sandbox environment.");
            setUser({ uid: "demo_user_12345", username: "pi_demo_user" });
            setIsPiReady(true);
            setLoading(false);
            return;
          }
          throw new Error("Cannot connect to Pi Network. Please ensure you are running this app inside the Pi Browser.");
        }
      }

      // Defer incomplete-payment recovery until the server has verified this user's access token.
      const incompletePayments: any[] = [];
      const onIncompletePaymentFound = async (payment: any) => {
        if (payment?.identifier) incompletePayments.push(payment);
      };

      // 3. Authenticate with "username" and "payments" scope
      const auth: any = await window.Pi.authenticate(["username", "payments"], onIncompletePaymentFound);

      // 4. Send the returned access token to the backend, which must validate it
      const authResponse = await fetch(`${API_BASE}/api/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });

      if (!authResponse.ok) {
        throw new Error("Failed to validate authentication with server.");
      }

      const authData = await authResponse.json();
      
      if (authData.authenticated) {
        setAccessToken(auth.accessToken);
        setUser({
          uid: authData.user.uid,
          username: authData.user.username || auth.user.username // Authenticated user's username
        });
        for (const incompletePayment of incompletePayments) {
          const recovery = await fetch(`${API_BASE}/api/payments/incomplete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: incompletePayment.identifier,
              txid: incompletePayment.transaction?.txid,
              accessToken: auth.accessToken,
            }),
          });
          if (!recovery.ok) console.warn("Incomplete Pi payment requires manual recovery:", recovery.status);
        }
      } else {
        throw new Error("Server rejected authentication.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate with Pi Network");
      
      // Automatic attempt fallback for desktop/browser preview in development mode
      if (import.meta.env.DEV && isAutoAttempt) {
        console.log("Auto-attempt failed, fallback to mock user in development mode.");
        setUser({ uid: "demo_user_12345", username: "pi_demo_user" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Trigger Pi authentication automatically when the app loads
    authenticateWithPi(true);
  }, []);

  const signIn = async () => {
    // Trigger Pi authentication manually from button click
    await authenticateWithPi(false);
  };

  const signOut = () => {
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, error, isPiReady, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
