/** Public credentials apply only to the dedicated read-only feed, not app auth. */
export const PORTAL_FEED_URL = "https://naeuosudklqsgeghafkw.supabase.co/functions/v1/pirc-portal-feed";
export const PORTAL_FEED_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hZXVvc3Vka2xxc2dlZ2hhZmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NTgxMjgsImV4cCI6MjExMDIzNDEyOH0.tGQ3GglDoG3vao0MMS7DltEoweKWLtPK93hxq8qfOig";
export const FEED_POLL_MS = 60_000;
export const FEED_STALE_MS = 180_000;
export type PortalEvent = { id: string; ledger: number | null; observedAt: string | null; type: string | null };
export type PortalFeed = { status: "awaiting_testnet_ingestion" | "empty" | "observed"; events: PortalEvent[]; generatedAt: string | null };
const object = (v: unknown): Record<string, unknown> | null => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null;

export function parsePortalFeed(value: unknown): PortalFeed {
  const data = object(value);
  if (!data || data.error || data.ok === false) throw new Error("invalid_feed_response");
  const network = data.network_id ?? data.network;
  if (network != null && !["pi-testnet", "pi-testnet1", "Pi Testnet", "Testnet1", "testnet", "testnet1"].includes(String(network))) throw new Error("unexpected_feed_network");
  const raw = data.events;
  if (raw !== undefined && !Array.isArray(raw)) throw new Error("invalid_feed_events");
  if (data.status !== "awaiting_testnet_ingestion" && !Array.isArray(raw)) throw new Error("invalid_feed_response");
  const events: PortalEvent[] = (Array.isArray(raw) ? raw : []).map(v => {
    const e = object(v);
    const id = e?.event_id ?? e?.id;
    if (!e || (typeof id !== "string" && typeof id !== "number") || String(id).length === 0) throw new Error("invalid_feed_event");
    return { id: String(id), ledger: typeof e.ledger_sequence === "number" && Number.isSafeInteger(e.ledger_sequence) ? e.ledger_sequence : null,
      observedAt: typeof e.observed_at === "string" && Number.isFinite(Date.parse(e.observed_at)) ? e.observed_at : null,
      type: typeof e.event_type === "string" ? e.event_type : null };
  });
  if (data.status === "awaiting_testnet_ingestion" && events.length) throw new Error("conflicting_feed_status");
  const generated = data.generated_at ?? data.generatedAt;
  return { status: data.status === "awaiting_testnet_ingestion" ? "awaiting_testnet_ingestion" : events.length ? "observed" : "empty", events,
    generatedAt: typeof generated === "string" && Number.isFinite(Date.parse(generated)) ? generated : null };
}

export class PortalFeedError extends Error {
  kind: "network" | "rate_limited" | "upstream" | "invalid";
  retryAt: number;
  constructor(kind: "network" | "rate_limited" | "upstream" | "invalid", retryAt = 0) {
    super(kind);
    this.kind = kind;
    this.retryAt = retryAt;
  }
}
export function retryAfterMs(value: string | null, now = Date.now()): number {
  if (!value) return FEED_POLL_MS;
  const seconds = Number(value);
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now;
  return Number.isFinite(delay) ? Math.max(FEED_POLL_MS, delay) : FEED_POLL_MS;
}
export function portalFeedState(feed: PortalFeed | undefined, receivedAt: number, error: unknown, now = Date.now()) {
  if (error instanceof PortalFeedError && error.kind === "rate_limited") return "rate_limited";
  if (error) return feed ? "stale" : "error";
  if (!feed) return "loading";
  const timestamp = feed.generatedAt ? Date.parse(feed.generatedAt) : receivedAt;
  if (now - timestamp > FEED_STALE_MS || timestamp > now + 30_000) return "stale";
  return feed.status;
}
export async function fetchPortalFeed(signal?: AbortSignal, request: typeof fetch = fetch): Promise<PortalFeed> {
  let response: Response;
  try {
    response = await request(PORTAL_FEED_URL, { method: "GET", signal, cache: "no-store", credentials: "omit", redirect: "error",
      headers: { Accept: "application/json", apikey: PORTAL_FEED_ANON_KEY, Authorization: `Bearer ${PORTAL_FEED_ANON_KEY}` } });
  } catch { throw new PortalFeedError("network"); }
  if (response.status === 429) throw new PortalFeedError("rate_limited", Date.now() + retryAfterMs(response.headers.get("Retry-After")));
  if (!response.ok) throw new PortalFeedError("upstream", Date.now() + FEED_POLL_MS);
  try { return parsePortalFeed(await response.json()); } catch { throw new PortalFeedError("invalid"); }
}