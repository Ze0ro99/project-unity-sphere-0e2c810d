// Network-specific metadata and asset lookup.
// Repository-sourced contract identifiers remain UNVERIFIED until read back from the named network.

export const CONTRACTS = Object.freeze({
  L0_PURPLE: "CCGEMIEAZFJSBTRL5VGJJAUGPJI3B7UQ3BTAB2OQGW73JMWLS57YVVA4",
  L1_GOLD: "CD3UAUN4FU3VHPMLOZWFQWJ2UBUUBBD37SZ7WBEGJQACJ7YF6QVE2SYG",
  L2_YELLOW: "CANLSQUPUZYKE3S2HAIGXAHMOQWE4FVX5DS7GTL42BVKSNHLFVMQSDFF",
  L3_ORANGE: "CB7T6TDSZ5B2MQI7NI4EG6ZASYPRMJ3XVUWS6BON4Z64OBMUJ4ZD6GKF",
  L4_BLUE: "CAMSQZTSCTF3MG4UEIAWKRZNSX7LLKGKXMVBEQO2ETVPGS3CINM7JBQD",
  L5_GREEN: "CBPG33E7RUX6MGU65IMM4HXCAGLA4OZRBOUWKQSBTIZWE2RD52VGWDT4",
  L6_RED: "CC6WMAHKOPWY6HW46VNKTAV4DZZLRTTNMYLDEKCAICQGMCWV5PZYNTBO",
  VERIFICATION_STATUS: "UNVERIFIED"
});

export const NETWORK_PROFILES = Object.freeze({
  piTestnet: {
    networkId: "pi-testnet",
    passphrase: "Pi Testnet",
    horizonUrl: "https://api.testnet.minepi.com",
    sorobanRpcUrl: "https://rpc.testnet.minepi.com",
    status: "OFFICIAL_TESTNET_ENDPOINTS_CONFIGURED"
  },
  stellarTestnet: {
    networkId: "stellar-testnet",
    passphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    status: "PUBLIC_STELLAR_TESTNET_PROFILE"
  }
});

const ASSET_REGISTRY_API_BASE = (typeof window !== "undefined" && window.PI_ASSET_REGISTRY_API_BASE) || "";

const LAYER_KEY_BY_ALIAS = Object.freeze({
  red: "root",
  root: "root",
  orange: "sacral",
  sacral: "sacral",
  yellow: "solar",
  solar: "solar",
  green: "heart",
  heart: "heart",
  picash: "heart",
  blue: "throat",
  throat: "throat",
  bank: "throat",
  indigo: "thirdEye",
  thirdeye: "thirdEye",
  purple: "crown",
  crown: "crown",
  gold: "gold-unmapped",
  ousd: "ousd"
});

function resolveLayerKey(layer) {
  const normalized = String(layer ?? "").replace(/[\s_-]/g, "").toLowerCase();
  return LAYER_KEY_BY_ALIAS[normalized] ?? normalized;
}

/**
 * Reads the local, versioned asset registry. It deliberately does not invent
 * QWF, solvency or reserve figures when the API or chain verification is absent.
 */
export async function getTokenAttributes(tokenId, layer, fetchImpl = fetch) {
  const assetKey = resolveLayerKey(layer);
  if (!assetKey) {
    return { status: "INVALID_LAYER", verification_status: "UNVERIFIED" };
  }
  try {
    const response = await fetchImpl(`${ASSET_REGISTRY_API_BASE}/v1/assets/${encodeURIComponent(assetKey)}`, {
      headers: { Accept: "application/json" }
    });
    if (response.status === 404) {
      return { status: "ASSET_NOT_FOUND", verification_status: "UNVERIFIED", asset_key: assetKey };
    }
    if (!response.ok) {
      return {
        status: "REGISTRY_UNAVAILABLE",
        http_status: response.status,
        verification_status: "UNVERIFIED",
        asset_key: assetKey
      };
    }
    const record = await response.json();
    if (tokenId && record.contract_id && String(tokenId) !== record.contract_id) {
      return {
        status: "IDENTIFIER_MISMATCH",
        verification_status: "UNVERIFIED",
        asset_key: assetKey,
        expected_contract_id: record.contract_id
      };
    }
    return {
      status: "REPOSITORY_METADATA",
      verification_status: record.verification_status ?? "UNVERIFIED",
      issuer_logo_verified: false,
      market_price: null,
      redeemable_value: null,
      record
    };
  } catch (error) {
    return {
      status: "REGISTRY_UNAVAILABLE",
      verification_status: "UNVERIFIED",
      asset_key: assetKey,
      error: error instanceof Error ? error.message : "Unknown fetch error"
    };
  }
}

export function getTokenLogoUrl(layer) {
  const assetKey = resolveLayerKey(layer);
  return assetKey ? `${ASSET_REGISTRY_API_BASE}/v1/assets/${encodeURIComponent(assetKey)}/logo` : null;
}

if (typeof window !== "undefined") {
  window.CONTRACTS = CONTRACTS;
  window.NETWORK_PROFILES = NETWORK_PROFILES;
  window.getTokenAttributes = getTokenAttributes;
  window.getTokenLogoUrl = getTokenLogoUrl;
}
