// Public GitHub webhook endpoint for the Ze0ro99/PiRC repository.
//
// Configure on GitHub:
//   Repository → Settings → Webhooks → Add webhook
//     Payload URL:  https://project-unity-sphere.lovable.app/api/public/github-webhook
//     Content type: application/json
//     Secret:       <same value as the GITHUB_WEBHOOK_SECRET project secret>
//     Events:       "Just the push event" (or select: push, release, repository)
//     Active:       ✓
//
// Set the project secret `GITHUB_WEBHOOK_SECRET` to any strong random string,
// then paste the SAME string into GitHub's "Secret" field above.
//
// This endpoint verifies the HMAC-SHA256 signature, records the event, and
// returns 200 so GitHub marks the delivery healthy. The live Sovereign Portal
// re-fetches raw GitHub data on its own polling interval, so a successful
// webhook simply confirms the upstream change reached us.

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const ALLOWED_REPO = "Ze0ro99/PiRC";

function verifySignature(secret: string, payload: string, header: string | null): boolean {
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/github-webhook")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          service: "pirc-github-webhook",
          repo: ALLOWED_REPO,
          hint: "POST GitHub webhook deliveries here with X-Hub-Signature-256 set.",
        }),

      POST: async ({ request }) => {
        const secret = process.env.GITHUB_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("GITHUB_WEBHOOK_SECRET is not configured", { status: 500 });
        }

        const body = await request.text();
        const signature = request.headers.get("x-hub-signature-256");
        if (!verifySignature(secret, body, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = request.headers.get("x-github-event") ?? "unknown";
        const delivery = request.headers.get("x-github-delivery") ?? "unknown";

        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(body) as Record<string, unknown>;
        } catch {
          return new Response("Malformed JSON", { status: 400 });
        }

        const repo = (payload.repository as { full_name?: string } | undefined)?.full_name;
        if (repo && repo !== ALLOWED_REPO) {
          return Response.json(
            { ok: false, error: `repo ${repo} not allowed; expected ${ALLOWED_REPO}` },
            { status: 403 },
          );
        }

        // GitHub sends a one-off "ping" when the webhook is first registered.
        if (event === "ping") {
          return Response.json({ ok: true, pong: true, zen: payload.zen });
        }

        const summary = {
          ok: true,
          event,
          delivery,
          repo: repo ?? ALLOWED_REPO,
          ref: payload.ref ?? null,
          head: (payload.head_commit as { id?: string } | undefined)?.id ?? null,
          pusher: (payload.pusher as { name?: string } | undefined)?.name ?? null,
          received_at: new Date().toISOString(),
        };

        // Surface in server logs for traceability — the live UI polls the raw
        // GitHub URLs and will pick up the change on its next refresh tick.
        console.log("[pirc-github-webhook]", JSON.stringify(summary));

        return Response.json(summary);
      },
    },
  },
});
