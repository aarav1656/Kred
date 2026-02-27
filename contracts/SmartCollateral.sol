// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SmartCollateral - Yield-Earning Collateral Vault
 * @notice Collateral earns simulated yield while backing loans
 * @dev In production, would deploy to Venus Protocol for real yield
 */
contract SmartCollateral is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable collateralToken;
    address public lendingPool;

    struct CollateralPosition {
        address user;
        uint256 amount;
        uint256 yieldEarned;
        uint256 depositTimestamp;
        uint256 loanId;
        bool active;
    }

    mapping(address => CollateralPosition) public positions;
    uint256 public totalCollateral;
    uint256 public totalPositions;

    // Simulated yield: ~5% APY = ~0.014% per day
    uint256 public constant DAILY_YIELD_BPS = 14; // 0.14% per day in basis points of 10000

    event CollateralDeposited(address indexed user, uint256 amount, uint256 loanId);
    event CollateralWithdrawn(address indexed user, uint256 amount, uint256 yieldEarned);
    event CollateralSeized(address indexed user, uint256 amount);
    event YieldAccrued(address indexed user, uint256 yieldAmount);

    constructor(address _collateralToken) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
    }

    function setLendingPool(address _lendingPool) external onlyOwner {
        lendingPool = _lendingPool;
    }

    /// @notice Deposit collateral for a loan
    function depositCollateral(
        address user,
        uint256 amount,
        uint256 loanId
    ) external onlyOwner nonReentrant {
        require(!positions[user].active, "Already has collateral");
        require(amount > 0, "Zero amount");

        collateralToken.safeTransferFrom(user, address(this), amount);

        positions[user] = CollateralPosition({
            user: user,
            amount: amount,
            yieldEarned: 0,
            depositTimestamp: block.timestamp,
            loanId: loanId,
            active: true
        });

        totalCollateral += amount;
        totalPositions++;
        emit CollateralDeposited(user, amount, loanId);
    }

    /// @notice Withdraw collateral + yield after loan repayment
    function withdrawCollateral(address user) external onlyOwner nonReentrant {
        CollateralPosition storage pos = positions[user];
        require(pos.active, "No active collateral");

        uint256 yield_ = calculateYield(user);
        uint256 totalReturn = pos.amount + yield_;

        pos.yieldEarned = yield_;
        pos.active = false;
        totalCollateral -= pos.amount;

        // Return collateral + yield
        // Note: In production, yield comes from Venus. Here we simulate it.
        // The contract must hold enough tokens to cover yield.
        uint256 balance = collateralToken.balanceOf(address(this));
        uint256 transferAmount = totalReturn > balance ? balance : totalReturn;
        collateralToken.safeTransfer(user, transferAmount);

        emit CollateralWithdrawn(user, pos.amount, yield_);
    }

    /// @notice Seize collateral on loan default
    function seizeCollateral(address user) external onlyOwner nonReentrant {
        CollateralPosition storage pos = positions[user];
        require(pos.active, "No active collateral");

        uint256 amount = pos.amount;
        pos.active = false;
        totalCollateral -= amount;

        // Transfer seized collateral to lending pool
        collateralToken.safeTransfer(lendingPool, amount);

        emit CollateralSeized(user, amount);
    }

    /// @notice Calculate simulated yield for a position
    function calculateYield(address user) public view returns (uint256) {
        CollateralPosition memory pos = positions[user];
        if (!pos.active) return 0;

        uint256 daysElapsed = (block.timestamp - pos.depositTimestamp) / 1 days;
        uint256 yield_ = (pos.amount * DAILY_YIELD_BPS * daysElapsed) / 10000;
        return yield_;
    }

    function getPosition(address user) external view returns (CollateralPosition memory) {
        return positions[user];
    }
}
