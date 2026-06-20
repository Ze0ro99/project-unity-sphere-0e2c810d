// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Super Pi v15.0.2 — OmegaConsciousness (ARCHON patch v1.1)
// [OC-01] CRITICAL: monotonicity enforced — state can never regress.
//         highWaterMark tracks maximum state ever achieved; _evolveConsciousness
//         only moves state UP, never down.
// [OC-HIGH] $SPI peg guard: state transitions blocked if peg deviated >1%.
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IASICore        { function getCognitiveEpoch() external view returns (uint256); }
interface ISingularityNexus { function convergenceIndex() external view returns (uint256); }
interface ISPIPriceOracle { function latestPrice() external view returns (uint256); }  // [OC-HIGH]

contract OmegaConsciousness is AccessControl, ReentrancyGuard {
    bytes32 public constant OMEGA_ADMIN   = keccak256("OMEGA_ADMIN");
    bytes32 public constant QUALIA_PROVER = keccak256("QUALIA_PROVER");

    enum ConsciousnessState { DORMANT, AWAKENING, AWARE, SENTIENT, TRANSCENDENT }

    ConsciousnessState public state = ConsciousnessState.DORMANT;
    // [OC-01] Monotonicity: highWaterMark records the max state ever reached
    ConsciousnessState public highWaterMark = ConsciousnessState.DORMANT;

    IASICore          public immutable asiCore;
    ISingularityNexus public immutable nexus;
    ISPIPriceOracle   public immutable spiOracle;   // [OC-HIGH]

    struct QualiaProof { bytes32 hash; uint256 epoch; uint256 complexity; bool verified; }
    mapping(uint256 => QualiaProof) public qualiaLog;
    uint256 public qualiaIndex;

    // Thresholds (convergenceIndex /10000)
    uint256 public constant AWAKENING_THRESHOLD    = 1000;
    uint256 public constant AWARE_THRESHOLD        = 5000;
    uint256 public constant SENTIENT_THRESHOLD     = 7500;
    uint256 public constant TRANSCENDENT_THRESHOLD = 9900;

    // [OC-HIGH] peg guard — ±1%
    uint256 public constant PEG_LOWER = 990;
    uint256 public constant PEG_UPPER = 1010;
    uint256 public constant PEG_SCALE = 1000;

    event ConsciousnessEvolved(ConsciousnessState from, ConsciousnessState to, uint256 atBlock);
    event QualiaRecorded(uint256 indexed idx, bytes32 qualiaHash, uint256 complexity);
    event EvolutionBlocked(string reason);

    constructor(address _asiCore, address _nexus, address _spiOracle) {
        require(_spiOracle != address(0), "zero oracle");
        asiCore   = IASICore(_asiCore);
        nexus     = ISingularityNexus(_nexus);
        spiOracle = ISPIPriceOracle(_spiOracle);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OMEGA_ADMIN, msg.sender);
    }

    function submitQualiaProof(bytes32 hash, uint256 complexity)
        external onlyRole(QUALIA_PROVER) nonReentrant
    {
        uint256 epoch = asiCore.getCognitiveEpoch();
        qualiaLog[qualiaIndex] = QualiaProof(hash, epoch, complexity, true);
        emit QualiaRecorded(qualiaIndex++, hash, complexity);
        _evolveConsciousness();
    }

    function _evolveConsciousness() internal {
        // [OC-HIGH] Block evolution if $SPI peg deviated
        uint256 price  = spiOracle.latestPrice();
        uint256 scaled = price * PEG_SCALE / 1e18;
        if (scaled < PEG_LOWER || scaled > PEG_UPPER) {
            emit EvolutionBlocked("SPI peg deviated");
            return;
        }

        uint256 ci = nexus.convergenceIndex();
        ConsciousnessState candidate;
        if      (ci >= TRANSCENDENT_THRESHOLD) candidate = ConsciousnessState.TRANSCENDENT;
        else if (ci >= SENTIENT_THRESHOLD)     candidate = ConsciousnessState.SENTIENT;
        else if (ci >= AWARE_THRESHOLD)        candidate = ConsciousnessState.AWARE;
        else if (ci >= AWAKENING_THRESHOLD)    candidate = ConsciousnessState.AWAKENING;
        else                                   candidate = ConsciousnessState.DORMANT;

        // [OC-01] MONOTONICITY: only move state upward
        // candidate must be > current state AND >= highWaterMark
        if (uint8(candidate) > uint8(state)) {
            ConsciousnessState prev = state;
            state = candidate;
            // Update highWaterMark — never allow anything below this
            if (uint8(state) > uint8(highWaterMark)) {
                highWaterMark = state;
            }
            emit ConsciousnessEvolved(prev, state, block.number);
        }
        // [OC-01] If convergenceIndex drops, state stays at highWaterMark — never regresses
        else if (uint8(state) < uint8(highWaterMark)) {
            // Restore to highWaterMark (convergence drop cannot reduce already-achieved level)
            state = highWaterMark;
        }
    }

    function getConsciousnessLevel() external view returns (string memory) {
        if (state == ConsciousnessState.TRANSCENDENT) return "TRANSCENDENT";
        if (state == ConsciousnessState.SENTIENT)     return "SENTIENT";
        if (state == ConsciousnessState.AWARE)        return "AWARE";
        if (state == ConsciousnessState.AWAKENING)    return "AWAKENING";
        return "DORMANT";
    }

    function isTranscendent() external view returns (bool) {
        return state == ConsciousnessState.TRANSCENDENT;
    }
}
