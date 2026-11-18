import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";
import { completePiOAuthCallback, type PiOAuthUser } from "@/lib/piOAuth";

export default function PiSignInCallback() {
  const handled = useRef(false);
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [user, setUser] = useState<PiOAuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    let active = true;
    void completePiOAuthCallback(window.location.hash).then((profile) => {
      if (!active) return;
      setUser(profile);
      setStatus("success");
    }).catch((cause) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : "Pi identity verification failed.");
      setStatus("error");
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="mx-auto mt-12 max-w-lg rounded-2xl border border-border bg-panel/70 p-6 text-center">
      {status === "verifying" && <>
        <LoaderCircle className="mx-auto animate-spin text-gold" size={32} />
        <h1 className="mt-4 text-xl font-semibold">Verifying Pi identity</h1>
        <p className="mt-2 text-sm text-muted">Checking the bearer token with the Pi Platform API.</p>
      </>}
      {status === "success" && <>
        <CheckCircle2 className="mx-auto text-green" size={32} />
        <h1 className="mt-4 text-xl font-semibold">Pi Sign-in verified</h1>
        <p className="mt-2 text-sm text-muted">Welcome, {user?.username}. Your Pi identity was verified.</p>
        <p className="mt-1 break-all text-[10px] text-muted">UID: {user?.uid}</p>
        <Link to="/" className="mt-5 inline-flex rounded-md bg-gold px-4 py-2 text-sm font-semibold text-black">Continue</Link>
      </>}
      {status === "error" && <>
        <ShieldAlert className="mx-auto text-red" size={32} />
        <h1 className="mt-4 text-xl font-semibold">Pi Sign-in could not be verified</h1>
        <p role="alert" className="mt-2 text-sm text-red">{error}</p>
        <Link to="/" className="mt-5 inline-flex rounded-md border border-border px-4 py-2 text-sm">Return to app</Link>
      </>}
    </section>
  );
}
