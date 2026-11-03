# PiRC Standards Coverage Matrix — Default-Branch Snapshot

Generated from the default-branch Git trees on 2026-11-03. This matrix is a file-presence inventory, not a code-quality or deployment certification.

| Standard | Specification file | Solidity reference | Soroban module mapping | SmartContracts crate | Rust source SHA group |
|---:|---|---|---|---|---:|
| PiRC-101 | `docs/PI-STANDARD-101.md` | `contracts/PiRC101Vault.sol` | NOT MAPPED | `contracts/pirc_101/src/lib.rs` | 1 |
| PiRC-201 | MISSING | MISSING | NOT MAPPED | `contracts/pirc_201/src/lib.rs` | 3 |
| PiRC-202 | MISSING | MISSING | NOT MAPPED | `contracts/pirc_202/src/lib.rs` | 3 |
| PiRC-203 | MISSING | MISSING | NOT MAPPED | `contracts/pirc_203/src/lib.rs` | 3 |
| PiRC-204 | MISSING | MISSING | NOT MAPPED | `contracts/pirc_204/src/lib.rs` | 3 |
| PiRC-205 | MISSING | MISSING | NOT MAPPED | `contracts/pirc_205/src/lib.rs` | 3 |
| PiRC-206 | MISSING | MISSING | NOT MAPPED | `contracts/pirc_206/src/lib.rs` | 3 |
| PiRC-207 | `docs/PiRC-207-Registry-Layer-Spec.md` | MISSING | NOT MAPPED | `contracts/pirc_207/src/lib.rs` | 3 |
| PiRC-208 | `docs/PiRC-208-AI-Integration-Standard.md` | `contracts/PiRC208MLVerifier.sol` | NOT MAPPED | `contracts/pirc_208/src/lib.rs` | 3 |
| PiRC-209 | `docs/PiRC-209-Sovereign-Decentralized-Identity-Standard.md` | `contracts/PiRC209DIDRegistry.sol` | NOT MAPPED | `contracts/pirc_209/src/lib.rs` | 1 |
| PiRC-210 | `docs/PiRC-210-Cross-Ledger-Identity-Portability-Standard.md` | `contracts/PiRC210Portability.sol` | NOT MAPPED | `contracts/pirc_210/src/lib.rs` | 3 |
| PiRC-211 | `docs/PiRC-211-Sovereign-EVM-Bridge-and-Cross-Ledger-Token-Portability-Standard.md` | `contracts/PiRC211EVMBridge.sol` | NOT MAPPED | `contracts/pirc_211/src/lib.rs` | 3 |
| PiRC-212 | `docs/PiRC-212-Sovereign-Governance-and-Decentralized-Proposal-Execution-Standard.md` | `contracts/PiRC212Governance.sol` | `contracts/soroban/src/governance.rs` | `contracts/pirc_212/src/lib.rs` | 3 |
| PiRC-213 | `docs/PiRC-213-Sovereign-RWA-Tokenization-Framework.md` | `contracts/PiRC213RWAToken.sol` | `contracts/soroban/src/rwa_token.rs` | `contracts/pirc_213/src/lib.rs` | 3 |
| PiRC-214 | `docs/PiRC-214-Decentralized-Oracle-Network-Standard.md` | `contracts/PiRC214Oracle.sol` | `contracts/soroban/src/oracle.rs` | `contracts/pirc_214/src/lib.rs` | 3 |
| PiRC-215 | `docs/PiRC-215-Cross-Chain-Liquidity-and-AMM-Protocol.md` | `contracts/PiRC215AMM.sol` | `contracts/soroban/src/amm.rs` | `contracts/pirc_215/src/lib.rs` | 3 |
| PiRC-216 | `docs/PiRC-216-AI-Powered-Risk-and-Compliance-Engine.md` | `contracts/PiRC216RiskEngine.sol` | `contracts/soroban/src/risk_engine.rs` | `contracts/pirc_216/src/lib.rs` | 3 |
| PiRC-217 | `docs/PiRC-217-Sovereign-KYC-and-Regulatory-Compliance-Layer.md` | `contracts/PiRC217KYC.sol` | NOT MAPPED | `contracts/pirc_217/src/lib.rs` | 3 |
| PiRC-218 | `docs/PiRC-218-Advanced-Staking-and-Yield-Optimization-Protocol.md` | `contracts/PiRC218Staking.sol` | NOT MAPPED | `contracts/pirc_218/src/lib.rs` | 3 |
| PiRC-219 | `docs/PiRC-219-PiRC-Mobile-SDK-and-Wallet-Integration-Standard.md` | `contracts/PiRC219MobileInterface.sol` | NOT MAPPED | `contracts/pirc_219/src/lib.rs` | 3 |
| PiRC-220 | `docs/PiRC-220-Ecosystem-Treasury-and-Fund-Management-Protocol.md` | `contracts/PiRC220Treasury.sol` | `contracts/soroban/src/treasury.rs` | `contracts/pirc_220/src/lib.rs` | 3 |
| PiRC-221 | `docs/PiRC-221-Privacy-Preserving-ZK-Identity.md` | `contracts/PiRC221ZKIdentity.sol` | NOT MAPPED | `contracts/pirc_221/src/lib.rs` | 3 |
| PiRC-222 | `docs/PiRC-222-Tokenized-Intellectual-Property.md` | `contracts/PiRC222IPNFT.sol` | NOT MAPPED | `contracts/pirc_222/src/lib.rs` | 3 |
| PiRC-223 | `docs/PiRC-223-Institutional-Custody.md` | `contracts/PiRC223InstitutionalCustody.sol` | NOT MAPPED | `contracts/pirc_223/src/lib.rs` | 3 |
| PiRC-224 | `docs/PiRC-224-Dynamic-RWA-Metadata.md` | `contracts/PiRC224DynamicRWA.sol` | NOT MAPPED | `contracts/pirc_224/src/lib.rs` | 3 |
| PiRC-225 | `docs/PiRC-225-Proof-of-Reserves.md` | `contracts/PiRC225ProofOfReserves.sol` | `contracts/soroban/src/por.rs` | `contracts/pirc_225/src/lib.rs` | 3 |
| PiRC-226 | `docs/PiRC-226-Fractional-Ownership.md` | `contracts/PiRC226Fractionalizer.sol` | NOT MAPPED | `contracts/pirc_226/src/lib.rs` | 3 |
| PiRC-227 | `docs/PiRC-227-Illiquid-AMM.md` | `contracts/PiRC227IlliquidAMM.sol` | NOT MAPPED | `contracts/pirc_227/src/lib.rs` | 3 |
| PiRC-228 | `docs/PiRC-228-Dispute-Resolution.md` | `contracts/PiRC228JusticeEngine.sol` | NOT MAPPED | `contracts/pirc_228/src/lib.rs` | 3 |
| PiRC-229 | `docs/PiRC-229-Asset-Teleportation.md` | `contracts/PiRC229Teleportation.sol` | NOT MAPPED | `contracts/pirc_229/src/lib.rs` | 3 |
| PiRC-230 | `docs/PiRC-230-Parity-Registry-v2.md` | `contracts/PiRC230RegistryV2.sol` | NOT MAPPED | `contracts/pirc_230/src/lib.rs` | 3 |
| PiRC-231 | `docs/PiRC-231-Over-Collateralized-Lending-Protocol.md` | `contracts/PiRC231Lending.sol` | `contracts/soroban/src/lending.rs` | `contracts/pirc_231/src/lib.rs` | 3 |
| PiRC-232 | `docs/PiRC-232-Justice-Driven-Liquidation-Engine.md` | `contracts/PiRC232Liquidation.sol` | NOT MAPPED | `contracts/pirc_232/src/lib.rs` | 3 |
| PiRC-233 | `docs/PiRC-233-Flash-Loan-Resistance-Standard.md` | `contracts/PiRC233FlashResistance.sol` | NOT MAPPED | `contracts/pirc_233/src/lib.rs` | 3 |
| PiRC-234 | `docs/PiRC-234-Synthetic-RWA-Generation.md` | `contracts/PiRC234SyntheticRWA.sol` | NOT MAPPED | `contracts/pirc_234/src/lib.rs` | 3 |
| PiRC-235 | `docs/PiRC-235-Yield-Tokenization-Standard.md` | `contracts/PiRC235YieldTokenization.sol` | NOT MAPPED | `contracts/pirc_235/src/lib.rs` | 3 |
| PiRC-236 | `docs/PiRC-236-Dynamic-Interest-Rate-Curves.md` | `contracts/PiRC236InterestRates.sol` | NOT MAPPED | `contracts/pirc_236/src/lib.rs` | 3 |
| PiRC-237 | MISSING | `contracts/PiRC237AIOracle.sol` | NOT MAPPED | `contracts/pirc_237/src/lib.rs` | 3 |
| PiRC-238 | `docs/PiRC-238-Predictive-Risk-Management.md` | `contracts/PiRC238PredictiveRisk.sol` | NOT MAPPED | `contracts/pirc_238/src/lib.rs` | 3 |
| PiRC-239 | `docs/PiRC-239-Institutional-Liquidity-Pools.md` | `contracts/PiRC239InstitutionalPools.sol` | NOT MAPPED | `contracts/pirc_239/src/lib.rs` | 3 |
| PiRC-240 | `docs/PiRC-240-Automated-Yield-Farming-Strategies.md` | `contracts/PiRC240YieldFarming.sol` | NOT MAPPED | `contracts/pirc_240/src/lib.rs` | 3 |
| PiRC-241 | `docs/PiRC-241-Zero-Knowledge-Corporate-Identity.md` | `contracts/PiRC241ZKCorporateID.sol` | NOT MAPPED | `contracts/pirc_241/src/lib.rs` | 3 |
| PiRC-242 | `docs/PiRC-242-Institutional-Stealth-Addresses.md` | `contracts/PiRC242StealthAddresses.sol` | NOT MAPPED | `contracts/pirc_242/src/lib.rs` | 3 |
| PiRC-243 | `docs/PiRC-243-Automated-Tax-Withholding.md` | `contracts/PiRC243TaxWithholding.sol` | NOT MAPPED | `contracts/pirc_243/src/lib.rs` | 3 |
| PiRC-244 | `docs/PiRC-244-Wholesale-CBDC-Integration.md` | `contracts/PiRC244CBDCIntegration.sol` | NOT MAPPED | `contracts/pirc_244/src/lib.rs` | 3 |
| PiRC-245 | `docs/PiRC-245-Off-Chain-Settlement-Batching.md` | `contracts/PiRC245SettlementBatching.sol` | NOT MAPPED | `contracts/pirc_245/src/lib.rs` | 3 |
| PiRC-246 | `docs/PiRC-246-Institutional-Escrow-Vaults.md` | `contracts/PiRC246EscrowVault.sol` | NOT MAPPED | `contracts/pirc_246/src/lib.rs` | 3 |
| PiRC-247 | `docs/PiRC-247-Enterprise-Compliance-Oracles.md` | `contracts/PiRC247ComplianceOracle.sol` | NOT MAPPED | `contracts/pirc_247/src/lib.rs` | 3 |
| PiRC-248 | `docs/PiRC-248-Multi-Chain-Governance-Execution.md` | `contracts/PiRC248MultiChainGov.sol` | NOT MAPPED | `contracts/pirc_248/src/lib.rs` | 3 |
| PiRC-249 | `docs/PiRC-249-Cross-Chain-State-Synchronization.md` | `contracts/PiRC249StateSync.sol` | NOT MAPPED | `contracts/pirc_249/src/lib.rs` | 3 |
| PiRC-250 | `docs/PiRC-250-Institutional-Account-Abstraction.md` | `contracts/PiRC250SmartAccount.sol` | NOT MAPPED | `contracts/pirc_250/src/lib.rs` | 3 |
| PiRC-251 | `docs/PiRC-251-Protocol-Owned-Liquidity.md` | `contracts/PiRC251POLRouting.sol` | NOT MAPPED | `contracts/pirc_251/src/lib.rs` | 3 |
| PiRC-252 | `docs/PiRC-252-Automated-Treasury-Diversification.md` | `contracts/PiRC252TreasuryDiversification.sol` | NOT MAPPED | `contracts/pirc_252/src/lib.rs` | 3 |
| PiRC-253 | `docs/PiRC-253-Ecosystem-Grant-Distribution.md` | `contracts/PiRC253GrantDistribution.sol` | NOT MAPPED | `contracts/pirc_253/src/lib.rs` | 3 |
| PiRC-254 | `docs/PiRC-254-Ultimate-Circuit-Breakers.md` | `contracts/PiRC254CircuitBreaker.sol` | `contracts/soroban/src/circuit_breaker.rs` | `contracts/pirc_254/src/lib.rs` | 3 |
| PiRC-255 | `docs/PiRC-255-Catastrophic-Recovery-Protocols.md` | `contracts/PiRC255CatastrophicRecovery.sol` | `contracts/soroban/src/catastrophic_recovery.rs` | `contracts/pirc_255/src/lib.rs` | 3 |
| PiRC-256 | `docs/PiRC-256-Decentralized-Validator-Delegation.md` | `contracts/PiRC256ValidatorDelegation.sol` | NOT MAPPED | `contracts/pirc_256/src/lib.rs` | 3 |
| PiRC-257 | `docs/PiRC-257-Ecosystem-Fee-Abstraction.md` | `contracts/PiRC257FeeAbstraction.sol` | NOT MAPPED | `contracts/pirc_257/src/lib.rs` | 3 |
| PiRC-258 | `docs/PiRC-258-Standardized-dApp-ABIs.md` | `contracts/PiRC258dAppABI.sol` | NOT MAPPED | `contracts/pirc_258/src/lib.rs` | 3 |
| PiRC-259 | `docs/PiRC-259-Cross-Chain-Event-Standard.md` | `contracts/PiRC259EventStandard.sol` | NOT MAPPED | `contracts/pirc_259/src/lib.rs` | 3 |
| PiRC-260 | `docs/PiRC-260-Registry-v3-Finalization.md` | `contracts/PiRC260RegistryV3.sol` | `contracts/soroban/src/registry_v3.rs` | `contracts/pirc_260/src/lib.rs` | 3 |

## Interpretation

- “Present” means a path exists in the default branch; it does not mean the code implements the standard.
- SmartContracts source SHA groups identify identical Rust file contents. Many numbered crate paths share the same implementation body; consult [the contract source audit](https://github.com/Ze0ro99/SmartContracts/blob/integration/sovereign-hybrid-ecosystem/docs/CONTRACT_COVERAGE_AND_SECURITY_AUDIT.md).
- “Not mapped” means the current source tree does not provide a verified one-to-one mapping from that standard to a Soroban module.
- Missing documentation or contract paths are explicit backlog items, not permission to invent a production implementation.
- All Solidity/EVM and Soroban modules are separate execution environments. A path in both directories does not create cross-chain interoperability.

## Immediate coverage gaps

1. PiRC-237 has a Solidity reference path but no matching PiRC-237 specification document in the inspected `docs/` naming pattern.
2. PiRC-207 documentation references a registry contract name that was not found at the referenced `contracts/PiRC207RegistryLayer.sol` path in the inspected tree.
3. Soroban module-to-standard mapping is incomplete and must be made explicit in the normative manifest.
4. The SmartContracts numbered crate count must not be interpreted as independent implementation coverage because source blobs are heavily reused.
5. The seven-layer registry's Gold/Indigo mismatch remains unresolved.

