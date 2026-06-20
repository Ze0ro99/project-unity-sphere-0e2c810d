// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Super Pi v15.0.2 — QuantumEntanglementLedger (ARCHON patch v1.1)
// [QE-HIGH-1] pairId collision: deterministic pairId computed on-chain, not user-supplied.
// [QE-HIGH-2] no pair expiry: PAIR_EXPIRY_BLOCKS enforced — collapse must happen within window.
// [QE-HIGH-3] $SPI peg guard on pair creation.
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ISPIPriceOracle { function latestPrice() external view returns (uint256); }

contract QuantumEntanglementLedger is AccessControl, ReentrancyGuard {
    bytes32 public constant ENTANGLEMENT_NODE = keccak256("ENTANGLEMENT_NODE");

    // [QE-HIGH-2] Pairs must collapse within this window
    uint256 public constant PAIR_EXPIRY_BLOCKS = 7_200; // ~24h
    uint256 public constant MIN_STRENGTH       = 9_000; // /10000

    // [QE-HIGH-3] peg guard
    ISPIPriceOracle public immutable spiOracle;
    uint256 public constant PEG_LOWER = 990;
    uint256 public constant PEG_UPPER = 1010;
    uint256 public constant PEG_SCALE = 1000;

    struct EntangledPair {
        bytes32 aliceHash;
        bytes32 bobHash;
        uint256 entanglementStrength; // /10000
        uint256 createdAtBlock;
        uint256 expiresAtBlock;       // [QE-HIGH-2]
        bool    collapsed;
        bool    verified;
    }

    // [QE-HIGH-1] pairId generated on-chain via _pairNonce
    uint256 private _pairNonce;
    mapping(bytes32 => EntangledPair) public pairs;
    mapping(bytes32 => bytes32)       public txToPair; // txHash → pairId

    event PairEntangled(bytes32 indexed pairId, bytes32 aliceHash, bytes32 bobHash, uint256 strength, uint256 expiresAtBlock);
    event PairCollapsed(bytes32 indexed pairId, bool outcome);
    event PairExpired(bytes32 indexed pairId);
    event EntanglementViolation(bytes32 indexed pairId, string reason);

    constructor(address _spiOracle) {
        require(_spiOracle != address(0), "zero oracle");
        spiOracle = ISPIPriceOracle(_spiOracle);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier spiPegIntact() {
        uint256 scaled = spiOracle.latestPrice() * PEG_SCALE / 1e18;
        require(scaled >= PEG_LOWER && scaled <= PEG_UPPER, "SPI peg violated");
        _;
    }

    /// @notice Create entangled pair. [QE-HIGH-1] pairId is deterministic, not caller-supplied.
    function entangle(bytes32 aliceHash, bytes32 bobHash, uint256 strength)
        external
        onlyRole(ENTANGLEMENT_NODE)
        nonReentrant
        spiPegIntact  // [QE-HIGH-3]
        returns (bytes32 pairId)
    {
        require(strength >= MIN_STRENGTH, "strength too low");
        require(aliceHash != bytes32(0) && bobHash != bytes32(0), "zero hash");
        require(txToPair[aliceHash] == bytes32(0), "aliceHash already paired");
        require(txToPair[bobHash]   == bytes32(0), "bobHash already paired");

        // [QE-HIGH-1] Deterministic, collision-free pairId
        pairId = keccak256(abi.encodePacked(aliceHash, bobHash, block.number, _pairNonce++));

        uint256 expiresAt = block.number + PAIR_EXPIRY_BLOCKS;
        pairs[pairId] = EntangledPair(aliceHash, bobHash, strength, block.number, expiresAt, false, false);
        txToPair[aliceHash] = pairId;
        txToPair[bobHash]   = pairId;
        emit PairEntangled(pairId, aliceHash, bobHash, strength, expiresAt);
    }

    /// @notice Collapse (finalize) a pair. [QE-HIGH-2] Enforces expiry window.
    function collapse(bytes32 pairId, bool outcome)
        external
        onlyRole(ENTANGLEMENT_NODE)
        nonReentrant
    {
        EntangledPair storage p = pairs[pairId];
        require(p.createdAtBlock > 0, "pair not found");
        require(!p.collapsed, "already collapsed");

        // [QE-HIGH-2] Must collapse within expiry window
        if (block.number > p.expiresAtBlock) {
            emit PairExpired(pairId);
            emit EntanglementViolation(pairId, "pair expired before collapse");
            revert("pair expired");
        }
        require(p.entanglementStrength >= MIN_STRENGTH, "strength degraded");

        p.collapsed = true;
        p.verified  = outcome;
        emit PairCollapsed(pairId, outcome);
    }

    /// @notice Expire a stale pair (callable by anyone after expiry).
    function expirePair(bytes32 pairId) external {
        EntangledPair storage p = pairs[pairId];
        require(p.createdAtBlock > 0, "pair not found");
        require(!p.collapsed, "already collapsed");
        require(block.number > p.expiresAtBlock, "not expired yet");
        p.collapsed = true;
        p.verified  = false;
        emit PairExpired(pairId);
    }

    function isFinalized(bytes32 pairId) external view returns (bool) {
        return pairs[pairId].collapsed && pairs[pairId].verified;
    }

    function isPairExpired(bytes32 pairId) external view returns (bool) {
        EntangledPair storage p = pairs[pairId];
        return p.createdAtBlock > 0 && !p.collapsed && block.number > p.expiresAtBlock;
    }
}
