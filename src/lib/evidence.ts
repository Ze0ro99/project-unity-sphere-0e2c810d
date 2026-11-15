/** Evidence classes shown on every data surface. Never upgrade without proof. */
export type Evidence = "VERIFIED" | "OBSERVED" | "SIMULATED" | "UNKNOWN";
export type EvidenceInput = {
  /** local/model data is always SIMULATED; network/feed reads need freshness. */
  source: "local" | "model" | "network" | "feed";
  ok?: boolean;
  notFound?: boolean;
  observedAt?: number | string | null;
  maxAgeMs?: number;
  /** An independent, fresh readback (e.g. network identity + contract instance). */
  independentProof?: boolean;
  now?: number;
};
export const DEFAULT_EVIDENCE_MAX_AGE_MS = 120_000;

export function classifyEvidence(input: EvidenceInput): Evidence {
  if (input.source === "local" || input.source === "model") return "SIMULATED";
  if (input.ok !== true || input.notFound) return "UNKNOWN";
  const at = typeof input.observedAt === "string" ? Date.parse(input.observedAt) : input.observedAt;
  if (typeof at !== "number" || !Number.isFinite(at)) return "UNKNOWN";
  const now = input.now ?? Date.now();
  const age = now - at;
  if (age < -30_000 || age > (input.maxAgeMs ?? DEFAULT_EVIDENCE_MAX_AGE_MS)) return "UNKNOWN";
  return input.independentProof === true ? "VERIFIED" : "OBSERVED";
}

export function evidenceAge(observedAt: number | null | undefined, now = Date.now()): string {
  if (!observedAt || !Number.isFinite(observedAt)) return "—";
  const s = Math.max(0, Math.round((now - observedAt) / 1000));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`;
}
