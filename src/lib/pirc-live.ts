// Live PiRC data — fetched directly from raw.githubusercontent.com.
// Single source of truth: Ze0ro99/PiRC (main branch).
import { useQuery } from "@tanstack/react-query";

const RAW = "https://raw.githubusercontent.com/Ze0ro99/PiRC/main";

export const PIRC_URLS = {
  contracts: `${RAW}/CONTRACTS_REGISTRY.json`,
  layers: `${RAW}/7_layer_packets.json`,
  manifest: `${RAW}/sovereign_manifest.json`,
  matrixCsv: `${RAW}/LIVE_MATRIX_REGISTRY.csv`,
  repo: "https://github.com/Ze0ro99/PiRC",
};

export interface ContractEntry {
  id: string;
  key: string;
  path: string;
  status: string;
  quantum_audit: boolean;
}

export interface ContractsRegistry {
  core: {
    master_issuer: {
      address: string; network: string; role: string; horizon: string; explorer: string;
    };
    pirc2_subscription: {
      address: string; network: string; role: string; soroban_rpc: string; explorer: string;
    };
    packets: { registry: string; colors: string[] };
  };
  contracts: ContractEntry[];
}

export interface LayerPacket {
  index: number; color: string; role: string; contract: string;
}

export interface LayersDoc {
  schema: string; description: string; issuer: string;
  pirc2_subscription_contract: string; layers: LayerPacket[];
}

export interface SovereignManifest {
  system: string; version: string; network: string; core_issuer: string;
  layers: Record<string, string>; standards_compliant: string[]; last_sync: string;
}

export interface MatrixRow {
  layer: string; contract: string; color: string; status: string; deployed: string; standard: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json() as Promise<T>;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

export function useContractsRegistry() {
  return useQuery({
    queryKey: ["pirc", "contracts"],
    queryFn: async (): Promise<ContractsRegistry> => {
      const raw = await fetchJson<Record<string, unknown>>(PIRC_URLS.contracts);
      const core = raw.core as ContractsRegistry["core"];
      const contracts: ContractEntry[] = Object.entries(raw)
        .filter(([k]) => k.startsWith("pirc_"))
        .map(([k, v]) => {
          const c = v as { id: string; path: string; status: string; quantum_audit: boolean };
          return { key: k, id: c.id, path: c.path, status: c.status, quantum_audit: c.quantum_audit };
        })
        .sort((a, b) => Number(a.id) - Number(b.id));
      return { core, contracts };
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function useLayers() {
  return useQuery({
    queryKey: ["pirc", "layers"],
    queryFn: () => fetchJson<LayersDoc>(PIRC_URLS.layers),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function useSovereignManifest() {
  return useQuery({
    queryKey: ["pirc", "manifest"],
    queryFn: () => fetchJson<SovereignManifest>(PIRC_URLS.manifest),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function useLiveMatrix() {
  return useQuery({
    queryKey: ["pirc", "matrix"],
    queryFn: async (): Promise<MatrixRow[]> => {
      const text = await fetchText(PIRC_URLS.matrixCsv);
      const lines = text.trim().split(/\r?\n/).slice(1);
      return lines.map((line) => {
        // Naive CSV split (handles the simple quoting in this file)
        const cells: string[] = [];
        let cur = ""; let q = false;
        for (const ch of line) {
          if (ch === '"') { q = !q; continue; }
          if (ch === "," && !q) { cells.push(cur); cur = ""; continue; }
          cur += ch;
        }
        cells.push(cur);
        return {
          layer: (cells[0] ?? "").trim(),
          contract: (cells[1] ?? "").trim(),
          color: (cells[2] ?? "").trim(),
          status: (cells[3] ?? "").trim(),
          deployed: (cells[4] ?? "").trim(),
          standard: (cells[5] ?? "").trim(),
        };
      });
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export const COLOR_HEX: Record<string, string> = {
  RED: "#ef4444", GREEN: "#22c55e", ORANGE: "#f97316", YELLOW: "#eab308",
  BLUE: "#3b82f6", PURPLE: "#a855f7", GOLD: "#d4af37", PURPLE0: "#a855f7",
};

export function explorerForContract(c: string) {
  return `https://stellar.expert/explorer/testnet/contract/${c}`;
}
export function explorerForAccount(a: string) {
  return `https://stellar.expert/explorer/testnet/account/${a}`;
}
