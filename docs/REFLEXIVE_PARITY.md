PiRC-101: Reflexive Parity & Monetary Equilibrium Proofs
1. Executive Summary
This document formalizes the mathematical mechanisms that ensure the $REF (Reflexive Economic Fiat) maintains a stable 1 USD Purchasing Power Parity, neutralizing the risk of hyperinflation or "Feudal" economic extraction.
2. The Parity Invariant
To counter the critique of a "10,000,000:1 Absurdity," the protocol distinguishes between Market Price (P_{live}) and Systemic Capacity (C_{sys}). REF is not a speculative token; it is a Capacity Asset.
The minting of REF is governed by the Minting Difficulty (D_m):
 * Parity Goal: 1 \text{ REF} = 1 \text{ USD} of internal goods/services.
 * Correction Mechanism: If S_{ref} exceeds the ecosystem's real-world absorption capacity, D_m increases algorithmically to stabilize the unit value.
3. The \Phi (Phi) Stability Guardrail
The "Justice Engine" prevents internal credit crashes by monitoring the Liquidity Density (L_{\rho}) of the ecosystem.
 * Expansion Phase (\Phi \geq 1): The reflexive expansion gate may open only when the independent utility, liquidity and solvency gates also pass.
 * Contraction Phase (\Phi < 1): New expansion is throttled. This condition does not itself mutate QWF; QWF changes require the separately governed, bounded update process.
4. Dynamic Multiplier Smoothing (DMS)
To address the "Hereditary Privilege" concern, the QWF is no longer a static right but a Meritocratic Utility that decays based on inactivity or excessive velocity.
The Effective Multiplier (QWF_{eff}) is calculated as:
Where:
 * \lambda: Systemic Decay Constant (Governance-tuned).
 * t: Time elapsed since the last "Proof of Contribution" (Mining/Validator activity).
5. Anti-Discrimination & Open Access
While "Mined Pi" holders utilize their Reserved Capacity, external participants (Speculators) are converted into Liquidity Providers (LPs).
 * External buyers pay the market premium to access the Zero-Volatility Garden.
 * This creates a Positive-Sum Game: Speculators gain stability, while Pioneers gain a high-velocity trade environment.


## Live IPPR correction

The IPPR market reference is re-based on each accepted PI/USD tick: `IPPR_t = median(PI/USD_t) × 10,000,000`. QWF is a separate adaptive state used in `Φ = (L_n × IPPR) / QWF`. The historical ~$2.248M reference is not a live constant. Market ticks never directly mint REF or alter wallet balances. See [PiRC-101 framework](../PiRC-101/README.md) and [live-tick simulator](../PiRC-101/simulator/stress_test.py).
