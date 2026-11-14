export const CONTRACTS = {
  CORE_MINT: "GA3ECRFJ6SO5BW6NEIKW3ACJXNG5UNBTLRRXWC742NHUEDV6KL3RNEN6",
  CORE_ISSUER: "GA3ECRFJ6SO5BW6NEIKW3ACJXNG5UNBTLRRXWC742NHUEDV6KL3RNEN6",

  // Repository references only. These identifiers are NOT proof of deployed
  // Pi Testnet contracts; require deployment transaction, WASM hash and read-back.
  L0_PURPLE: "CCGEMIEAZFJSBTRL5VGJJAUGPJI3B7UQ3BTAB2OQGW73JMWLS57YVVA4",
  L1_GOLD: "CD3UAUN4FU3VHPMLOZWFQWJ2UBUUBBD37SZ7WBEGJQACJ7YF6QVE2SYG",
  L2_YELLOW: "CANLSQUPUZYKE3S2HAIGXAHMOQWE4FVX5DS7GTL42BVKSNHLFVMQSDFF",
  L3_ORANGE: "CB7T6TDSZ5B2MQI7NI4EG6ZASYPRMJ3XVUWS6BON4Z64OBMUJ4ZD6GKF",
  L4_BLUE: "CAMSQZTSCTF3MG4UEIAWKRZNSX7LLKGKXMVBEQO2ETVPGS3CINM7JBQD",
  L5_GREEN: "CBPG33E7RUX6MGU65IMM4HXCAGLA4OZRBOUWKQSBTIZWE2RD52VGWDT4",
  L6_RED: "CC6WMAHKOPWY6HW46VNKTAV4DZZLRTTNMYLDEKCAICQGMCWV5PZYNTBO",

  NETWORK: "TESTNET",
  NETWORK_ID: "pi-testnet",
  NETWORK_ALIAS: "Testnet1",
  PI_RPC: "https://rpc.testnet.minepi.com",
  STELLAR_RPC: "https://soroban-testnet.stellar.org"
};

/**
 * No verified chain read-back is connected to this legacy adapter.
 * Return explicit unknowns rather than synthetic attributes that look live.
 */
export async function getTokenAttributes(tokenId, layer) {
  return {
    token_id: String(tokenId || ""),
    layer: String(layer || ""),
    qwf_eff: null,
    phi_solvency: null,
    ref_capacity: null,
    status: "UNVERIFIED",
    reason: "No authoritative Pi Testnet contract read-back is configured.",
    network_id: CONTRACTS.NETWORK_ID,
    source: "NO_VERIFIED_CHAIN_READBACK",
    observed_at: null
  };
}

window.CONTRACTS = CONTRACTS;
window.getTokenAttributes = getTokenAttributes;
