// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BNPLCheckout - Buy Now Pay Later Installment Manager
 * @notice Manages BNPL purchases with installment tracking
 */
contract BNPLCheckout is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable stablecoin;
    address public lendingPool;

    struct Purchase {
        address buyer;
        address merchant;
        string itemName;
        uint256 totalPrice;
        uint256 paidAmount;
        uint256 installmentAmount;
        uint8 installmentsPaid;
        uint8 totalInstallments;
        uint256 loanId;
        uint256 createdAt;
        bool completed;
    }

    Purchase[] public purchases;
    mapping(address => uint256[]) public buyerPurchases;
    mapping(address => uint256[]) public merchantPurchases;

    uint256 public totalPurchaseVolume;
    uint256 public totalPurchaseCount;

    event PurchaseCreated(uint256 indexed purchaseId, address indexed buyer, address merchant, string itemName, uint256 price);
    event MerchantPaid(uint256 indexed purchaseId, address indexed merchant, uint256 amount);
    event InstallmentRecorded(uint256 indexed purchaseId, uint8 installmentNumber);
    event PurchaseCompleted(uint256 indexed purchaseId);

    constructor(address _stablecoin) Ownable(msg.sender) {
        stablecoin = IERC20(_stablecoin);
    }

    function setLendingPool(address _lendingPool) external onlyOwner {
        lendingPool = _lendingPool;
    }

    /// @notice Create a BNPL purchase — merchant gets paid instantly from pool
    function createPurchase(
        address buyer,
        address merchant,
        string calldata itemName,
        uint256 totalPrice,
        uint8 installments,
        uint256 loanId
    ) external onlyOwner returns (uint256) {
        require(installments >= 2 && installments <= 12, "2-12 installments");
        require(totalPrice > 0, "Zero price");

        uint256 purchaseId = purchases.length;
        uint256 installmentAmount = totalPrice / installments;

        purchases.push(Purchase({
            buyer: buyer,
            merchant: merchant,
            itemName: itemName,
            totalPrice: totalPrice,
            paidAmount: 0,
            installmentAmount: installmentAmount,
            installmentsPaid: 0,
            totalInstallments: installments,
            loanId: loanId,
            createdAt: block.timestamp,
            completed: false
        }));

        buyerPurchases[buyer].push(purchaseId);
        merchantPurchases[merchant].push(purchaseId);
        totalPurchaseVolume += totalPrice;
        totalPurchaseCount++;

        emit PurchaseCreated(purchaseId, buyer, merchant, itemName, totalPrice);
        emit MerchantPaid(purchaseId, merchant, totalPrice);

        return purchaseId;
    }

    /// @notice Record an installment payment
    function recordInstallmentPaid(uint256 purchaseId) external onlyOwner {
        Purchase storage p = purchases[purchaseId];
        require(!p.completed, "Already completed");

        p.installmentsPaid++;
        p.paidAmount += p.installmentAmount;

        emit InstallmentRecorded(purchaseId, p.installmentsPaid);

        if (p.installmentsPaid >= p.totalInstallments) {
            p.completed = true;
            emit PurchaseCompleted(purchaseId);
        }
    }

    function getPurchase(uint256 id) external view returns (Purchase memory) {
        return purchases[id];
    }

    function getBuyerPurchases(address buyer) external view returns (uint256[] memory) {
        return buyerPurchases[buyer];
    }

    function getMerchantPurchases(address merchant) external view returns (uint256[] memory) {
        return merchantPurchases[merchant];
    }

    function getPurchaseCount() external view returns (uint256) {
        return purchases.length;
    }

    function getStats() external view returns (uint256 volume, uint256 count) {
        return (totalPurchaseVolume, totalPurchaseCount);
    }
}
