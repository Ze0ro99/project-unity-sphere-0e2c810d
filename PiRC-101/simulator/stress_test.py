"""PiRC-101 live-tick reference simulation.

IPPR = accepted PI/USD market median * fixed 10,000,000 supply multiplier.
QWF is an independent adaptive state. Phi = (L_n * IPPR) / QWF.
This simulator never signs, mints, transfers, or settles assets.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

IPPR_SUPPLY_MULTIPLIER = 10_000_000


@dataclass(frozen=True)
class Scenario:
    pi_usd: float
    qwf_current: int
    network_velocity: float
    active_merchants: int
    available_listings: int
    fulfilled_orders_window: int
    liquid_depth_usd: float
    minimum_liquid_depth_usd: float
    eligible_reserves_usd: float
    outstanding_ref_liability_usd: float


def simulate_pirc101_resilience(s: Scenario) -> dict[str, Any]:
    values = asdict(s)
    if not (s.pi_usd > 0 and s.qwf_current > 0 and s.network_velocity >= 0):
        raise ValueError("PI/USD, QWF and velocity inputs must be valid")
    if any(v < 0 for k, v in values.items() if k not in {"pi_usd", "network_velocity"}):
        raise ValueError("economic gate inputs cannot be negative")

    # Keep source precision; this is an analytical reference, not settlement math.
    ippr = s.pi_usd * IPPR_SUPPLY_MULTIPLIER
    phi = (s.network_velocity * ippr) / s.qwf_current

    oracle_gate = True  # Call only after the multi-source oracle quorum has passed.
    utility_gate = (
        s.active_merchants > 0
        and s.available_listings > 0
        and s.fulfilled_orders_window > 0
    )
    liquidity_gate = (
        s.minimum_liquid_depth_usd > 0
        and s.liquid_depth_usd >= s.minimum_liquid_depth_usd
    )
    solvency_gate = (
        None if s.outstanding_ref_liability_usd == 0
        else s.eligible_reserves_usd >= s.outstanding_ref_liability_usd
    )
    reflexive_gate = phi >= 1.0
    gates = {
        "oracle": oracle_gate,
        "utility": utility_gate,
        "liquidity": liquidity_gate,
        "solvency": solvency_gate,
        "reflexive": reflexive_gate,
    }
    expansion_enabled = all(value is True for value in gates.values())

    return {
        "pi_usd": s.pi_usd,
        "ippr_supply_multiplier": IPPR_SUPPLY_MULTIPLIER,
        "ippr_usd_reference": round(ippr, 9),
        "qwf_current": s.qwf_current,
        "network_velocity": s.network_velocity,
        "phi": round(phi, 9),
        "gates": gates,
        "expansion_enabled": expansion_enabled,
        "status": "GATES_PASSED_REFERENCE_ONLY" if expansion_enabled else "EXPANSION_BLOCKED_REFERENCE_ONLY",
        "notice": "Simulation only. No REF issuance, redemption, wallet balance or payment is performed.",
    }


if __name__ == "__main__":
    sample = Scenario(
        pi_usd=0.0729555,
        qwf_current=10_072_123,
        network_velocity=0.5115,
        active_merchants=4,
        available_listings=20,
        fulfilled_orders_window=15,
        liquid_depth_usd=5_000_000,
        minimum_liquid_depth_usd=1_000_000,
        eligible_reserves_usd=1_000_000,
        outstanding_ref_liability_usd=500_000,
    )
    result = simulate_pirc101_resilience(sample)
    for key, value in result.items():
        print(f"{key}: {value}")
