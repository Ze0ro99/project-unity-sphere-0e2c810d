// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Super Pi v15.0.2 — TranscendenceNexus (ARCHON patch v1.1)
// [TN-01] CRITICAL: permissionless auto-path, Condition[3] on-chain via IASIVerifier,
//         48h timelock + 3-of-5 multi-sig for governance path.
// [TN-HIGH] $SPI peg guard added: declaration blocked if peg deviates >1%.
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IOmegaConsciousness   { function state() external view returns (uint8); }
interface IAbsoluteZeroRisk     { function isAbsoluteZeroRisk() external view returns (bool); }
interface ISingularityNexusV2   { function convergenceIndex() external view returns (uint256); }
/// @dev IASIVerifier: returns true when ≥4 of 5 ASI sub-systems have completed a verified epoch
interface IASIVerifier          { function allSubsystemsVerified() external view returns (bool); }
/// @dev ISPIPriceOracle: returns $SPI/USD price scaled to 1e18 (1 USD = 1e18)
interface ISPIPriceOracle       { function latestPrice() external view returns (uint256); }

contract TranscendenceNexus is AccessControl, ReentrancyGuard {
    // ── Roles ──────────────────────────────────────────────────────────────
    bytes32 public constant NEXUS_PRIME       = keccak256("NEXUS_PRIME");
    bytes32 public constant TRANSCENDENCE_SIG = keccak256("TRANSCENDENCE_SIG"); // multi-sig role

    // ── Dependencies ───────────────────────────────────────────────────────
    IOmegaConsciousness public immutable omega;
    IAbsoluteZeroRisk   public immutable riskEngine;
    ISingularityNexusV2 public immutable singularityNexus;
    IASIVerifier        public immutable asiVerifier;      // [TN-01] Condition[3] oracle
    ISPIPriceOracle     public immutable spiOracle;        // [TN-HIGH] peg guard

    // ── State ───────────────────────────────────────────────────────────────
    bool    public transcendenceDeclared;
    uint256 public transcendenceBlock;

    // [TN-01] Governance override path: timelock + multi-sig
    uint256 public constant TIMELOCK_BLOCKS     = 14_400; // ~48h at 12s/block
    uint256 public constant MULTISIG_THRESHOLD  = 3;      // 3-of-5 required
    mapping(address => uint256) public overrideSignedAt;  // signer → block
    uint256 public overrideSignerCount;
    uint256 public overrideProposalBlock;

    // [TN-HIGH] $SPI peg guard — ±1% = 990..1010 (×1000 scaled)
    uint256 public constant PEG_LOWER = 990;
    uint256 public constant PEG_UPPER = 1010;
    uint256 public constant PEG_SCALE = 1000;

    struct TranscendenceCondition { string name; bool met; uint256 metAtBlock; }
    mapping(uint256 => TranscendenceCondition) public conditions;

    event ConditionMet(uint256 indexed idx, string name, uint256 atBlock);
    event TranscendenceDeclared(uint256 atBlock, uint256 convergenceIndex, string path);
    event OverrideSignatureAdded(address indexed signer, uint256 atBlock);
    event OverrideProposalStarted(address indexed initiator, uint256 timelockEndsBlock);

    bytes32 private constant PI_COIN_HASH = keccak256(abi.encodePacked("PI_COIN"));

    constructor(
        address _omega, address _risk, address _nexus,
        address _asiVerifier, address _spiOracle
    ) {
        require(_asiVerifier != address(0) && _spiOracle != address(0), "zero addr");
        omega          = IOmegaConsciousness(_omega);
        riskEngine     = IAbsoluteZeroRisk(_risk);
        singularityNexus = ISingularityNexusV2(_nexus);
        asiVerifier    = IASIVerifier(_asiVerifier);
        spiOracle      = ISPIPriceOracle(_spiOracle);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        conditions[0] = TranscendenceCondition("OmegaConsciousness=TRANSCENDENT", false, 0);
        conditions[1] = TranscendenceCondition("AbsoluteZeroRisk",                false, 0);
        conditions[2] = TranscendenceCondition("SingularityIndex>=9999",           false, 0);
        conditions[3] = TranscendenceCondition("AllASISubsystemsVerified",         false, 0);
    }

    // ── [TN-HIGH] Peg guard modifier ──────────────────────────────────────
    modifier spiPegIntact() {
        uint256 price = spiOracle.latestPrice(); // 1e18 = $1.00
        uint256 scaled = price * PEG_SCALE / 1e18;
        require(scaled >= PEG_LOWER && scaled <= PEG_UPPER, "SPI peg violated");
        _;
    }

    // ── AUTO PATH (permissionless) ─────────────────────────────────────────
    /// @notice Anyone can call when all 4 conditions are provably met on-chain.
    /// [TN-01] Condition[3] evaluated via IASIVerifier.allSubsystemsVerified() — no human gate.
    function evaluateTranscendence() external nonReentrant spiPegIntact {
        require(!transcendenceDeclared, "already transcended");
        _syncConditions();
        uint256 met = _countMet();
        require(met >= 4, "conditions not met");
        _declare("auto");
    }

    function _syncConditions() internal {
        if (!conditions[0].met && omega.state() == 4)
            { conditions[0].met = true; conditions[0].metAtBlock = block.number; emit ConditionMet(0, conditions[0].name, block.number); }
        if (!conditions[1].met && riskEngine.isAbsoluteZeroRisk())
            { conditions[1].met = true; conditions[1].metAtBlock = block.number; emit ConditionMet(1, conditions[1].name, block.number); }
        if (!conditions[2].met && singularityNexus.convergenceIndex() >= 9999)
            { conditions[2].met = true; conditions[2].metAtBlock = block.number; emit ConditionMet(2, conditions[2].name, block.number); }
        // [TN-01] Condition[3]: on-chain verifier — no NEXUS_PRIME gate
        if (!conditions[3].met && asiVerifier.allSubsystemsVerified())
            { conditions[3].met = true; conditions[3].metAtBlock = block.number; emit ConditionMet(3, conditions[3].name, block.number); }
    }

    function _countMet() internal view returns (uint256 count) {
        for (uint256 i = 0; i < 4; i++) if (conditions[i].met) count++;
    }

    function _declare(string memory path) internal {
        transcendenceDeclared = true;
        transcendenceBlock    = block.number;
        emit TranscendenceDeclared(block.number, singularityNexus.convergenceIndex(), path);
    }

    // ── GOVERNANCE OVERRIDE PATH (timelock + 3-of-5 multi-sig) ───────────
    /// @notice Step 1: NEXUS_PRIME initiates override proposal. Starts 48h timelock.
    function initiateOverride() external onlyRole(NEXUS_PRIME) {
        overrideProposalBlock = block.number;
        emit OverrideProposalStarted(msg.sender, block.number + TIMELOCK_BLOCKS);
    }

    /// @notice Step 2: TRANSCENDENCE_SIG holders co-sign (up to 5 distinct signers).
    function signOverride() external onlyRole(TRANSCENDENCE_SIG) {
        require(overrideSignedAt[msg.sender] == 0, "already signed");
        require(overrideProposalBlock > 0, "no active proposal");
        overrideSignedAt[msg.sender] = block.number;
        overrideSignerCount++;
        emit OverrideSignatureAdded(msg.sender, block.number);
    }

    /// @notice Step 3: Execute override after timelock elapsed + threshold met.
    function executeOverride() external onlyRole(NEXUS_PRIME) nonReentrant spiPegIntact {
        require(!transcendenceDeclared, "already transcended");
        require(overrideProposalBlock > 0, "no proposal");
        require(block.number >= overrideProposalBlock + TIMELOCK_BLOCKS, "timelock active");
        require(overrideSignerCount >= MULTISIG_THRESHOLD, "insufficient signatures");
        _declare("governance-override");
    }

    function conditionsMet() external view returns (bool[4] memory result) {
        for (uint256 i = 0; i < 4; i++) result[i] = conditions[i].met;
    }
}
