/**
 * Network endpoints and account identity only.
 * Contract IDs and live token attributes must come from the verified registry/feed.
 * Never treat a repository allowlist or display label as deployment proof.
 */
export const NETWORKS = {
  PI_TESTNET: {
    id: "pi-testnet",
    horizon: "https://api.testnet.minepi.com",
    sorobanRpc: "https://rpc.testnet.minepi.com",
    passphrase: "Pi Testnet",
  },
  STELLAR_TESTNET: {
    id: "stellar-testnet",
    horizon: "https://horizon-testnet.stellar.org",
    sorobanRpc: "https://soroban-testnet.stellar.org",
    passphrase: "Test SDF Network ; September 2015",
  },
};

export const CORE_ACCOUNT_ID = "GA3ECRFJ6SO5BW6NEIKW3ACJXNG5UNBTLRRXWC742NHUEDV6KL3RNEN6";

/**
 * No verified on-chain attribute reader is configured in this browser module.
 * Return an explicit state instead of manufacturing QWF/solvency/capacity values.
 */
export async function getTokenAttributes(tokenId, layer) {
  return {
    tokenId: typeof tokenId === "string" ? tokenId : null,
    layer: typeof layer === "string" ? layer : null,
    network: NETWORKS.PI_TESTNET.id,
    status: "UNVERIFIED",
    verificationStatus: "UNVERIFIED",
    attributes: null,
    source: null,
    ledgerSequence: null,
    observedAt: null,
    reason: "No authoritative contract read-back is connected to this client module.",
  };
}

if (typeof window !== "undefined") {
  window.NETWORKS = NETWORKS;
  window.CORE_ACCOUNT_ID = CORE_ACCOUNT_ID;
  window.getTokenAttributes = getTokenAttributes;
}
