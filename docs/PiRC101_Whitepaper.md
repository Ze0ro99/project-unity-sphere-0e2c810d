# PiRC-101: Sovereign Monetary Standard Specification

## 1. Executive Summary
This document provides the formal normative specification for **PiRC-101**, a decentralized monetary standard engineered for the Pi Network GCV (Global Consensus Value) merchant ecosystem. It introduces a reflexive, collateral-backed stable credit system ($REF$) to isolate internal productive commerce from external market volatility.

## 2. Introduction: The Walled Garden Architecture
PiRC-101 creates a productive "Walled Garden." It solves the DeFi Triffin Dilemma by safely backing internal sovereign credits ($REF$) with a 10M:1 expansion on locked external Pi ($P_e$).

## 3. Normative Specification: The State Machine
This section defines the formal state of the standard at any given Epoch $n$.

### 3.1. Primary State Vector (${\Omega}_n$)
$${\Omega}_n = \{R_n, S_n, L_n, \Psi_n\}$$
Where:
* $R_n$: Total Reserves (Locked Pi).
* $S_n$: Total Supply (Minted REF).
* $L_n$: External USD Liquidity Depth (Placeholder Oracle Input).
* ${\Psi}_n$: Provenance Invariant (Hybrid Decay Model tracking Mined vs External Status).

### 3.2. Deterministic State Transition Function ($f$)
$${\Omega}_{n+1} = f({\Omega}_n, A_n)$$
Where $A_n$ is the vector of user actions (Mint, Exit) in Epoch $n$. All state transitions are strictly governed by the algorithmic Justice Engine.

## 4. The Justice Engine: Reflexive Liquidity Guardrail (${\Phi}$)
The Core Vault Layer includes a non-linear, quadratic circuit breaker (${\Phi}$). It forces internal solvency by crushing incoming expansion when the external exit queue is crowded.

$${\Phi} = calculatePhi(L_n, S_n / QWF)$$

Production deployment requires hardening inputs via a **Decentralized Oracle Aggregation Mechanism (DOAM)**.

### 4.1. Live market rebase and independent QWF state

IPPR is recalculated for each accepted PI/USD market-index tick using the fixed supply multiplier of 10,000,000. QWF is a separate adaptive state; it is not the IPPR multiplier. A change in QWF changes the reflexive constraint Φ, but does not rewrite the IPPR market rebase.

The accepted market quote must include source provenance, quote units, timestamp, expiry, source quorum, deviation and policy version. If the oracle quorum is stale or unavailable, the live reference is unavailable; the system must not substitute a fixed historical IPPR value.

QWF updates are discrete, versioned, bounded and governance-approved. The exact adjustment rate and clamp bounds must be pinned to an approved PiRC-101 revision before automated updates are enabled. The historical ~$2.248M figure is a scenario calibration, not a live constant.

## 5. Architectural Modularity and Governance Roadmap
This standard embraces modular engineering for failsafe operations.

### 5.1. Layer 1: Core Vault Invariants
Defined in `/contracts/PiRC101Vault.sol` (EVM Reference). strictly enforces the State Transition Function.

### 5.2. Layer 2: Dynamic WCF Weighting Engine
treating weighting as a reflexive system that adapts to liquidity and behavioral signals, ingesting log(TVL) and Economic Velocity (Track C).

### 5.3. Layer 3: Anti-Manipulation Layer (Track B)
Specifies Proof-of-Utility (PoU) requirements, Reputation Scores (KYC), and Cluster Detection to prevent Wash-Trading before reward distribution.

## 6. Implementation Roadmap
Detailed Mainnet Enclosed to Open Mainnet rollout phases.

## 7. Conclusion
PiRC-101 achieves robust, engineering-validated convergence toward stability, even under extreme human panic.

