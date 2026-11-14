import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchPortalFeed, FEED_POLL_MS, PortalFeedError, portalFeedState } from "./portal-feed";

export function usePortalFeed() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const query = useQuery({
    queryKey: ["dedicated-pirc-portal-feed"],
    // Do not cancel the shared read on StrictMode's temporary unmount; this
    // keeps the in-flight query deduplicated across gateway consumers.
    queryFn: () => fetchPortalFeed(AbortSignal.timeout(15_000)),
    staleTime: FEED_POLL_MS, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
    refetchInterval: q => q.state.error instanceof PortalFeedError ? Math.max(FEED_POLL_MS, q.state.error.retryAt - Date.now()) : FEED_POLL_MS,
  });
  const cooldown = query.error instanceof PortalFeedError && query.error.retryAt > now;
  return { ...query, state: portalFeedState(query.data, query.dataUpdatedAt, query.error, now), cooldown,
    refresh: () => { if (!cooldown && !query.isFetching) void query.refetch(); } };
}