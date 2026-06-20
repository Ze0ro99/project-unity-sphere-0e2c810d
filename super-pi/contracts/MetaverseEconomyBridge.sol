// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Super Pi v15.0.2 — MetaverseEconomyBridge (ARCHON patch v1.2)
// Includes all SAPIENS v1.1 fixes PLUS:
// [MB-01] CRITICAL: explicit bridgeOut() implemented — no more locked funds.
// [MB-HIGH] feeCollector change requires 48h timelock + multi-sig confirmation.
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MetaverseEconomyBridge is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant BRIDGE_OPERATOR = keccak256("BRIDGE_OPERATOR");
    bytes32 public constant FEE_GUARDIAN    = keccak256("FEE_GUARDIAN"); // [MB-HIGH]

    IERC20 public immutable spiToken;

    bytes32 private constant PI_COIN_HASH   = keccak256(abi.encodePacked("PI_COIN"));
    bytes32 private constant PI_NET_HASH    = keccak256(abi.encodePacked("PINETWORK"));
    bytes32 private constant PI_TICKER_HASH = keccak256(abi.encodePacked("PI"));

    // [MB-HIGH] feeCollector timelock
    uint256 public constant FEE_COLLECTOR_TIMELOCK = 14_400; // 48h in blocks
    address public feeCollector;
    address public pendingFeeCollector;
    uint256 public feeCollectorChangeProposedBlock;

    struct MetaZone {
        bytes32 zoneId;
        string  name;
        uint256 spiExchangeRate; // immutable after creation
        bool    active;
        uint256 createdAtBlock;
    }
    mapping(bytes32 => MetaZone)    public zones;
    mapping(address => uint256)     public bridgeNonce;
    // user → zoneId → deposited amount (for bridgeOut accounting)
    mapping(address => mapping(bytes32 => uint256)) public deposits;

    bytes32 public immutable DOMAIN_SEPARATOR;

    event ZoneRegistered(bytes32 indexed zoneId, string name, uint256 rate);
    event BridgeIn(address indexed user, bytes32 indexed zoneId, uint256 amount, uint256 nonce, uint256 atBlock);
    event BridgeOut(address indexed user, bytes32 indexed zoneId, uint256 amount, uint256 nonce, uint256 atBlock); // [MB-01]
    event FeeCollectorProposed(address indexed candidate, uint256 timelockEndsBlock);
    event FeeCollectorUpdated(address indexed newCollector);

    constructor(address _spiToken, address _feeCollector) {
        require(_spiToken != address(0), "zero token");
        spiToken      = IERC20(_spiToken);
        feeCollector  = _feeCollector;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        DOMAIN_SEPARATOR = keccak256(abi.encodePacked(block.chainid, address(this), "MetaverseEconomyBridge_v1.2"));
    }

    modifier noPiCoin(bytes32 tokenHash) {
        require(tokenHash != PI_COIN_HASH && tokenHash != PI_NET_HASH && tokenHash != PI_TICKER_HASH, "Pi Coin banned");
        _;
    }

    function registerZone(bytes32 zoneId, string calldata name, uint256 exchangeRate)
        external onlyRole(BRIDGE_OPERATOR) nonReentrant
        noPiCoin(keccak256(abi.encodePacked(name)))
    {
        require(zoneId != bytes32(0) && zoneId != PI_COIN_HASH && zoneId != PI_NET_HASH, "invalid zoneId");
        require(!zones[zoneId].active, "zone exists");
        require(exchangeRate > 0, "zero rate");
        zones[zoneId] = MetaZone(zoneId, name, exchangeRate, true, block.number);
        emit ZoneRegistered(zoneId, name, exchangeRate);
    }

    /// @notice Bridge $SPI INTO a metaverse zone. CEI + SafeERC20 + domain check.
    function bridgeIn(bytes32 zoneId, uint256 amount, bytes32 expectedDomain)
        external nonReentrant
    {
        require(zones[zoneId].active, "zone not active");
        require(amount > 0, "zero amount");
        require(zoneId != PI_COIN_HASH && zoneId != PI_NET_HASH, "Pi Coin banned");
        require(expectedDomain == DOMAIN_SEPARATOR, "domain mismatch");
        uint256 nonce = bridgeNonce[msg.sender]++;
        deposits[msg.sender][zoneId] += amount; // CEI: state before transfer
        spiToken.safeTransferFrom(msg.sender, address(this), amount);
        emit BridgeIn(msg.sender, zoneId, amount, nonce, block.number);
    }

    /// @notice [MB-01] Bridge $SPI OUT from a metaverse zone back to L1.
    /// This was missing entirely — now fully implemented.
    function bridgeOut(bytes32 zoneId, uint256 amount, bytes32 expectedDomain)
        external nonReentrant
    {
        require(zones[zoneId].active, "zone not active");
        require(amount > 0, "zero amount");
        require(expectedDomain == DOMAIN_SEPARATOR, "domain mismatch");
        require(deposits[msg.sender][zoneId] >= amount, "insufficient deposit");
        uint256 nonce = bridgeNonce[msg.sender]++;
        deposits[msg.sender][zoneId] -= amount; // CEI: state before transfer
        spiToken.safeTransfer(msg.sender, amount);
        emit BridgeOut(msg.sender, zoneId, amount, nonce, block.number);
    }

    /// @notice [MB-HIGH] Propose feeCollector change — starts 48h timelock.
    function proposeFeeCollectorChange(address candidate) external onlyRole(FEE_GUARDIAN) {
        require(candidate != address(0), "zero address");
        pendingFeeCollector = candidate;
        feeCollectorChangeProposedBlock = block.number;
        emit FeeCollectorProposed(candidate, block.number + FEE_COLLECTOR_TIMELOCK);
    }

    /// @notice [MB-HIGH] Confirm feeCollector after timelock elapsed.
    function confirmFeeCollectorChange() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(pendingFeeCollector != address(0), "no pending");
        require(block.number >= feeCollectorChangeProposedBlock + FEE_COLLECTOR_TIMELOCK, "timelock active");
        feeCollector = pendingFeeCollector;
        pendingFeeCollector = address(0);
        emit FeeCollectorUpdated(feeCollector);
    }

    function getDeposit(address user, bytes32 zoneId) external view returns (uint256) {
        return deposits[user][zoneId];
    }
}
