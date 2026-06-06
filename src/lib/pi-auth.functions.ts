import { createServerFn } from "@tanstack/react-start";

export interface PiVerifiedUser {
  uid: string;
  username: string;
}

/**
 * Validate a Pi access token by calling Pi Platform's /v2/me endpoint.
 * No Pi Network API key is required for this verification flow.
 * Docs: https://pi-apps.github.io/pi-sdk-docs/quick-start/genai/Authentication
 */
export const verifyPiAccessToken = createServerFn({ method: "POST" })
  .inputValidator((data: { accessToken: string }) => {
    if (!data || typeof data.accessToken !== "string" || data.accessToken.length < 8) {
      throw new Error("Invalid access token");
    }
    return { accessToken: data.accessToken };
  })
  .handler(async ({ data }): Promise<PiVerifiedUser> => {
    const res = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Pi token verification failed (${res.status})`);
    }
    const body = (await res.json()) as { uid?: string; username?: string };
    if (!body.uid || !body.username) {
      throw new Error("Pi /v2/me response missing uid or username");
    }
    return { uid: body.uid, username: body.username };
  });
