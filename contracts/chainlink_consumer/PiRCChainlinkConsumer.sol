// SPDX-License-Identifier: PiOS
pragma solidity ^0.8.28;

/**
 * PiRC-214 — Chainlink Consumer
 * Reads AggregatorV3 proxies with heartbeat + deviation guards and exposes a
 * normalised 18-decimal answer plus a purchasing-power basket index used by the
 * PiDEX economic core (PiRC-101 Φ Justice Engine).
 */
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

contract PiRCChainlinkConsumer {
    struct Feed {
        AggregatorV3Interface aggregator;
        uint32 heartbeat; // seconds
        uint16 weightBps; // basket weight, 0 = not in basket
        uint128 refPrice18; // genesis reference price, 18 decimals
        bool active;
    }

    address public owner;
    bytes32[] private _ids;
    mapping(bytes32 => Feed) public feeds;

    event FeedSet(bytes32 indexed id, address aggregator, uint32 heartbeat, uint16 weightBps);
    event FeedRemoved(bytes32 indexed id);

    error NotOwner();
    error UnknownFeed();
    error StaleAnswer(bytes32 id, uint256 updatedAt);
    error InvalidAnswer(bytes32 id);
    error NoBasketCoverage();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "zero owner");
        owner = next;
    }

    function setFeed(
        bytes32 id,
        address aggregator,
        uint32 heartbeat,
        uint16 weightBps,
        uint128 refPrice18
    ) external onlyOwner {
        require(aggregator != address(0), "zero aggregator");
        require(heartbeat > 0, "zero heartbeat");
        require(weightBps <= 10_000, "weight > 100%");
        if (!feeds[id].active) _ids.push(id);
        feeds[id] = Feed(AggregatorV3Interface(aggregator), heartbeat, weightBps, refPrice18, true);
        emit FeedSet(id, aggregator, heartbeat, weightBps);
    }

    function removeFeed(bytes32 id) external onlyOwner {
        if (!feeds[id].active) revert UnknownFeed();
        delete feeds[id];
        uint256 n = _ids.length;
        for (uint256 i; i < n; ++i) {
            if (_ids[i] == id) {
                _ids[i] = _ids[n - 1];
                _ids.pop();
                break;
            }
        }
        emit FeedRemoved(id);
    }

    function feedIds() external view returns (bytes32[] memory) {
        return _ids;
    }

    /// @notice Latest answer normalised to 18 decimals, reverting when stale.
    function price18(bytes32 id) public view returns (uint256 answer18, uint256 updatedAt) {
        Feed memory f = feeds[id];
        if (!f.active) revert UnknownFeed();
        (, int256 raw, , uint256 ts, ) = f.aggregator.latestRoundData();
        if (raw <= 0) revert InvalidAnswer(id);
        if (ts == 0 || block.timestamp > ts + f.heartbeat) revert StaleAnswer(id, ts);
        uint8 d = f.aggregator.decimals();
        answer18 = d <= 18 ? uint256(raw) * (10 ** (18 - d)) : uint256(raw) / (10 ** (d - 18));
        updatedAt = ts;
    }

    /// @notice Non-reverting variant used by keepers.
    function tryPrice18(bytes32 id) external view returns (bool ok, uint256 answer18, uint256 updatedAt) {
        try this.price18(id) returns (uint256 a, uint256 ts) {
            return (true, a, ts);
        } catch {
            return (false, 0, 0);
        }
    }

    /**
     * @notice Purchasing-power index (1e18 == genesis basket) over all weighted,
     *         fresh feeds. Weights are renormalised across live legs only.
     */
    function purchasingPowerIndex() external view returns (uint256 ppi18, uint256 coverageBps) {
        uint256 acc;
        uint256 wsum;
        uint256 n = _ids.length;
        for (uint256 i; i < n; ++i) {
            Feed memory f = feeds[_ids[i]];
            if (f.weightBps == 0 || f.refPrice18 == 0) continue;
            (bool ok, uint256 a, ) = this.tryPrice18(_ids[i]);
            if (!ok) continue;
            acc += ((a * 1e18) / f.refPrice18) * f.weightBps;
            wsum += f.weightBps;
        }
        if (wsum == 0) revert NoBasketCoverage();
        ppi18 = acc / wsum;
        coverageBps = wsum;
    }

    /// @notice Purchasing power of `piUsd18` expressed in basket units (18 decimals).
    function piPurchasingPower(uint256 piUsd18) external view returns (uint256) {
        (uint256 ppi18, ) = this.purchasingPowerIndex();
        return ppi18 == 0 ? 0 : (piUsd18 * 1e18) / ppi18;
    }
}
