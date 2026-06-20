// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Super Pi v15.0.2 — AbsoluteZeroRiskEngine (ARCHON patch v1.1)
// [AZ-01] CRITICAL: real Groth16 verifier integrated — no more bytes32-only proof acceptance.
// [AZ-HIGH] Granular coverage-weighted riskScore (0-10000) replacing binary 0/1.
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @dev Groth16 on-chain verifier interface (compatible with SnarkJS output)
interface IGroth16Verifier {
    function verifyProof(
        uint256[2]    calldata a,
        uint256[2][2] calldata b,
        uint256[2]    calldata c,
        uint256[]     calldata pubInputs
    ) external view returns (bool);
}

contract AbsoluteZeroRiskEngine is AccessControl, ReentrancyGuard {
    bytes32 public constant RISK_PROVER = keccak256("RISK_PROVER");

    // [AZ-01] Real verifier — immutable, set once in constructor
    IGroth16Verifier public immutable zkVerifier;

    struct InvariantProof {
        bytes32 invariantId;
        string  description;
        bytes32 proofHash;      // keccak256 of the full proof tuple (audit trail)
        uint256 verifiedAtBlock;
        bool    active;
        uint256 coverageScore;  // [AZ-HIGH] granular /10000
    }

    mapping(bytes32 => InvariantProof) public invariants;
    bytes32[] public activeInvariants;

    // [AZ-HIGH] Granular weighted risk score (0 = absolute zero, 10000 = max risk)
    uint256 public riskScore;
    uint256 public constant ABSOLUTE_ZERO_THRESHOLD = 100; // ≤1% aggregate gap = "absolute zero"
    uint256 public constant MIN_COVERAGE = 9900;           // 99% minimum per invariant

    event InvariantProven(bytes32 indexed id, string description, uint256 coverage, uint256 newRiskScore);
    event InvariantViolated(bytes32 indexed id, string reason);
    event AbsoluteZeroAchieved(uint256 atBlock, uint256 invariantCount);

    bytes32 private constant PI_COIN_HASH = keccak256(abi.encodePacked("PI_COIN"));
    bytes32 private constant PI_BAN_INV   = keccak256("PI_COIN_BAN_INVARIANT");
    bytes32 private constant PEG_INV      = keccak256("SPI_PEG_INVARIANT");

    constructor(address _zkVerifier) {
        require(_zkVerifier != address(0), "zero verifier");
        zkVerifier = IGroth16Verifier(_zkVerifier); // [AZ-01] immutable real verifier
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _registerCoreInvariants();
    }

    function _registerCoreInvariants() internal {
        invariants[PEG_INV] = InvariantProof(PEG_INV, "$SPI always 1:1 USD within 0.5%",  bytes32(0), 0, true, 0);
        activeInvariants.push(PEG_INV);
        invariants[PI_BAN_INV] = InvariantProof(PI_BAN_INV, "Pi Coin permanently banned", bytes32(0), 0, true, 0);
        activeInvariants.push(PI_BAN_INV);
    }

    /// @notice Prove an invariant with a real Groth16 ZK proof.
    /// [AZ-01] Full on-chain cryptographic verification via IGroth16Verifier.
    function proveInvariant(
        bytes32         id,
        uint256         coverage,
        uint256[2]      calldata proofA,
        uint256[2][2]   calldata proofB,
        uint256[2]      calldata proofC,
        uint256[]       calldata pubInputs  // pubInputs[0] = invariantId as uint256
    ) external onlyRole(RISK_PROVER) nonReentrant {
        require(invariants[id].active, "unknown invariant");
        require(coverage >= MIN_COVERAGE, "coverage below minimum");
        // pubInputs[0] must match the invariant id being proven
        require(pubInputs.length >= 1 && bytes32(pubInputs[0]) == id, "pubInput invariantId mismatch");

        // [AZ-01] Real cryptographic verification — not just a stored hash
        require(zkVerifier.verifyProof(proofA, proofB, proofC, pubInputs), "ZK proof invalid");

        invariants[id].proofHash      = keccak256(abi.encode(proofA, proofB, proofC, pubInputs));
        invariants[id].verifiedAtBlock = block.number;
        invariants[id].coverageScore  = coverage;

        // [AZ-HIGH] Recompute granular weighted risk score
        riskScore = _computeWeightedRisk();
        emit InvariantProven(id, invariants[id].description, coverage, riskScore);
        if (riskScore <= ABSOLUTE_ZERO_THRESHOLD) emit AbsoluteZeroAchieved(block.number, activeInvariants.length);
    }

    /// @notice Register a new invariant. Resets its proof until re-proven.
    function registerInvariant(bytes32 id, string calldata description)
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(!invariants[id].active, "already registered");
        require(id != PI_COIN_HASH, "Pi Coin banned");
        invariants[id] = InvariantProof(id, description, bytes32(0), 0, true, 0);
        activeInvariants.push(id);
        riskScore = _computeWeightedRisk();
    }

    /// [AZ-HIGH] Granular weighted risk: sum of coverage gaps across all active invariants.
    function _computeWeightedRisk() internal view returns (uint256 totalGap) {
        uint256 n = activeInvariants.length;
        if (n == 0) return 0;
        for (uint256 i = 0; i < n; i++) {
            uint256 cov = invariants[activeInvariants[i]].coverageScore;
            if (cov < 10000) totalGap += (10000 - cov) / n;
        }
    }

    function isAbsoluteZeroRisk() external view returns (bool) {
        return riskScore <= ABSOLUTE_ZERO_THRESHOLD;
    }

    function getRiskScore() external view returns (uint256) { return riskScore; }
}
