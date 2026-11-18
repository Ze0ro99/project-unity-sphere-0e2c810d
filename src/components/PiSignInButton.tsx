import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { clearPiOAuthUser, getPiOAuthUser, startPiOAuthSignIn, type PiOAuthUser } from "@/lib/piOAuth";

export default function PiSignInButton() {
  const [user, setUser] = useState<PiOAuthUser | null>(() => getPiOAuthUser());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setUser(getPiOAuthUser());
    window.addEventListener("pi-oauth-updated", refresh);
    return () => window.removeEventListener("pi-oauth-updated", refresh);
  }, []);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await startPiOAuthSignIn();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start Pi Sign-in.");
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="hidden 2xl:inline text-[11px] text-muted" title={user.uid}>Pi ID: {user.username}</span>
        <button type="button" onClick={() => { clearPiOAuthUser(); setUser(null); }}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] hover:bg-panel2"
          aria-label="Sign out from Pi Sign-in">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => void signIn()} disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-md border border-gold/50 px-2.5 py-1.5 text-[11px] font-semibold text-gold hover:bg-panel2 disabled:opacity-50">
        <LogIn size={13} /> {busy ? "Opening Pi…" : "Sign in with Pi"}
      </button>
      {error && <span role="alert" className="max-w-48 text-[10px] text-red">{error}</span>}
    </div>
  );
}
