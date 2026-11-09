import { useQuery } from "@tanstack/react-query";
import { fetchLatestLedgers, fetchRoot, HORIZON_MAINNET } from "./pi";
import { observeProtocol, PROTOCOL_REFRESH_MS } from "./protocol";

/** Shared endpoint-scoped observations, updated even while a gateway is open. */
export function useProtocol(endpoint = HORIZON_MAINNET) {
  const query = useQuery({
    queryKey: ["network-protocol", endpoint],
    queryFn: async () => {
      const [root, ledgers] = await Promise.all([fetchRoot(endpoint), fetchLatestLedgers(endpoint, 2)]);
      return { root, ledgers };
    },
    refetchInterval: PROTOCOL_REFRESH_MS,
    retry: 1,
  });
  const observation = observeProtocol(query.data?.root ?? null, query.isError ? [] : query.data?.ledgers ?? []);
  return { ...query, observation };
}