// Pi Network Sign-in OAuth integration. Separate from Pi.authenticate()/payments.
// Current Pi Sign-in support is implicit-flow only: public client ID, no secret,
// no authorization-code exchange, and no refresh token.
declare global {
  interface Window {
    Pi?: { signIn?: (options: { clientId: string; redirectUri: string; scopes?: string[]; state?: string }) => void };
  }
}
export type PiOAuthUser = { uid: string; username: string; walletAddress: string | null };
export type PiOAuthCallback =
  | { ok: true; accessToken: string; expiresIn: number | null }
  | { ok: false; error: string };

const PROFILE_KEY = "pirc.pi-oauth.profile.v1";
const STATE_KEY = "pirc.pi-oauth.state.v1";
const DEFAULT_CLIENT_ID = "QIAwY2avMGcuVh86LkCuGcproL3Rc6PsyofADVFHRVY";
const DEFAULT_REDIRECT_URI = "https://project-unity-sphere.lovable.app/signin/callback";

export const PI_OAUTH_CLIENT_ID =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_PI_OAUTH_CLIENT_ID ||
  DEFAULT_CLIENT_ID;
export const PI_OAUTH_REDIRECT_URI =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_PI_OAUTH_REDIRECT_URI ||
  DEFAULT_REDIRECT_URI;

export function parsePiOAuthFragment(fragment: string, expectedState: string | null): PiOAuthCallback {
  const params = new URLSearchParams(fragment.startsWith("#") ? fragment.slice(1) : fragment);
  const returnedState = params.get("state");
  if (!expectedState || !returnedState || returnedState !== expectedState) {
    return { ok: false, error: "Pi Sign-in state validation failed. Please restart sign-in." };
  }
  const providerError = params.get("error");
  if (providerError) {
    const messages: Record<string, string> = {
      access_denied: "Pi Sign-in was declined.",
      expired: "The Pi Sign-in request expired. Please try again.",
      cancelled: "Pi Sign-in was cancelled.",
      server_error: "Pi Sign-in is temporarily unavailable.",
    };
    return { ok: false, error: messages[providerError] ?? "Pi Sign-in failed." };
  }
  const accessToken = params.get("access_token");
  const tokenType = params.get("token_type");
  if (!accessToken || tokenType?.toLowerCase() !== "bearer") {
    return { ok: false, error: "Pi Sign-in did not return a valid bearer token." };
  }
  const expiresRaw = params.get("expires_in");
  const expires = expiresRaw ? Number(expiresRaw) : null;
  return {
    ok: true,
    accessToken,
    expiresIn: expires !== null && Number.isFinite(expires) && expires > 0 ? expires : null,
  };
}

export async function startPiOAuthSignIn(): Promise<void> {
  const { initPi } = await import("@/lib/piSdk");
  await initPi();
  if (!PI_OAUTH_CLIENT_ID || !PI_OAUTH_REDIRECT_URI) {
    throw new Error("Pi Sign-in client configuration is missing.");
  }
  if (!window.Pi?.signIn) {
    throw new Error("Pi Sign-in requires the current Pi JavaScript SDK. Reload the app and try again.");
  }
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  window.Pi.signIn({
    clientId: PI_OAUTH_CLIENT_ID,
    redirectUri: PI_OAUTH_REDIRECT_URI,
    scopes: ["username", "wallet_address"],
    state,
  });
}

export function getPiOAuthUser(): PiOAuthUser | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as PiOAuthUser;
    return value && typeof value.uid === "string" && typeof value.username === "string" ? value : null;
  } catch {
    return null;
  }
}

export function clearPiOAuthUser(): void {
  sessionStorage.removeItem(PROFILE_KEY);
  window.dispatchEvent(new Event("pi-oauth-updated"));
}

export async function completePiOAuthCallback(fragment: string): Promise<PiOAuthUser> {
  const expectedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  window.history.replaceState(null, "", window.location.pathname + window.location.search);

  const callback = parsePiOAuthFragment(fragment, expectedState);
  if (!callback.ok) throw new Error(callback.error);

  const response = await fetch("https://api.minepi.com/v2/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${callback.accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(response.status === 401
      ? "Pi rejected the sign-in token. Please authenticate again."
      : `Pi identity verification failed (HTTP ${response.status}).`);
  }
  const profile = await response.json() as { uid?: unknown; username?: unknown; wallet_address?: unknown };
  if (typeof profile.uid !== "string" || typeof profile.username !== "string") {
    throw new Error("Pi returned an incomplete identity profile.");
  }
  const user: PiOAuthUser = {
    uid: profile.uid,
    username: profile.username,
    walletAddress: typeof profile.wallet_address === "string" ? profile.wallet_address : null,
  };
  // Keep only the verified UI profile. The bearer token is never persisted.
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("pi-oauth-updated"));
  return user;
}
