/** Network observations are not contract compatibility or permission grants. */
export const TRACKED_UPGRADES = [28, 29, 30] as const;
export const PROTOCOL_REFRESH_MS = 10_000;
export const PROTOCOL_MAX_AGE_MS = 60_000;

export type ProtocolObservation = {
  active: number | null;
  supported: number | null;
  ledger: number | null;
  closedAt: string | null;
  state: "observed" | "stale" | "unknown";
};

function version(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function observeProtocol(
  root: { core_supported_protocol_version?: unknown } | null,
  ledgers: { sequence: number; protocol_version: number; closed_at: string }[],
  now = Date.now(),
): ProtocolObservation {
  const supported = version(root?.core_supported_protocol_version);
  const latest = ledgers.filter(l => Number.isSafeInteger(l.sequence) && l.sequence > 0)
    .reduce<(typeof ledgers)[number] | null>((a, l) => !a || l.sequence > a.sequence ? l : a, null);
  const active = version(latest?.protocol_version);
  const close = Date.parse(latest?.closed_at ?? "");
  const fresh = Number.isFinite(close) && now >= close && now - close <= PROTOCOL_MAX_AGE_MS;
  return {
    active, supported, ledger: latest?.sequence ?? null, closedAt: latest?.closed_at ?? null,
    state: active === null ? "unknown" : fresh ? "observed" : "stale",
  };
}

export function upgradeState(observation: ProtocolObservation, target: number) {
  if (observation.state !== "observed" || observation.active === null) return "unknown";
  return observation.active >= target ? "observed" : "pending";
}