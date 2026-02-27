// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LendingPool - Core Lending Logic
 * @notice Manages lender deposits, borrower loans, and installment repayments
 */
contract LendingPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable stablecoin;
    address public credScoreContract;
    address public collateralManager;

    struct Loan {
        address borrower;
        uint256 totalAmount;
        uint256 remainingAmount;
        uint256 collateralAmount;
        uint256 installmentAmount;
        uint256 installmentsPaid;
        uint256 totalInstallments;
        uint256 nextDueDate;
        uint256 interestRate; // basis points
        uint256 createdAt;
        bool active;
        bool defaulted;
    }

    Loan[] public loans;
    mapping(address => uint256[]) public userLoans;
    mapping(address => uint256) public activeLoanCount;

    // Lender deposits
    mapping(address => uint256) public lenderDeposits;
    uint256 public totalDeposits;
    uint256 public totalBorrowed;

    // Protocol stats
    uint256 public totalLoansIssued;
    uint256 public totalLoansRepaid;
    uint256 public totalInterestEarned;

    // Max utilization: 80%
    uint256 public constant MAX_UTILIZATION_BPS = 8000;

    event LoanCreated(address indexed borrower, uint256 indexed loanId, uint256 amount, uint256 installments);
    event InstallmentPaid(address indexed borrower, uint256 indexed loanId, uint256 amount, uint256 remaining);
    event LoanCompleted(address indexed borrower, uint256 indexed loanId);
    event LoanDefaulted(address indexed borrower, uint256 indexed loanId);
    event Deposited(address indexed lender, uint256 amount);
    event Withdrawn(address indexed lender, uint256 amount);

    constructor(address _stablecoin) Ownable(msg.sender) {
        stablecoin = IERC20(_stablecoin);
    }

    function setContracts(address _credScore, address _collateralManager) external onlyOwner {
        credScoreContract = _credScore;
        collateralManager = _collateralManager;
    }

    /// @notice Lenders deposit liquidity to earn yield
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        lenderDeposits[msg.sender] += amount;
        totalDeposits += amount;
        emit Deposited(msg.sender, amount);
    }

    /// @notice Lenders withdraw liquidity
    function withdraw(uint256 amount) external nonReentrant {
        require(lenderDeposits[msg.sender] >= amount, "Insufficient deposit");
        uint256 available = totalDeposits - totalBorrowed;
        require(amount <= available, "Insufficient liquidity");

        lenderDeposits[msg.sender] -= amount;
        totalDeposits -= amount;
        stablecoin.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Create a new loan (called by backend/owner after credit check)
    function createLoan(
        address borrower,
        uint256 amount,
        uint256 installments,
        uint256 interestRate,
        uint256 collateralAmount
    ) external onlyOwner nonReentrant returns (uint256) {
        require(amount > 0, "Zero amount");
        require(amount <= totalDeposits - totalBorrowed, "Insufficient pool liquidity");
        require(installments >= 2 && installments <= 12, "2-12 installments");
        require(activeLoanCount[borrower] == 0, "Has active loan");

        uint256 totalWithInterest = amount + (amount * interestRate / 10000);
        uint256 installmentAmount = totalWithInterest / installments;

        uint256 loanId = loans.length;
        loans.push(Loan({
            borrower: borrower,
            totalAmount: totalWithInterest,
            remainingAmount: totalWithInterest,
            collateralAmount: collateralAmount,
            installmentAmount: installmentAmount,
            installmentsPaid: 0,
            totalInstallments: installments,
            nextDueDate: block.timestamp + 30 days,
            interestRate: interestRate,
            createdAt: block.timestamp,
            active: true,
            defaulted: false
        }));

        userLoans[borrower].push(loanId);
        activeLoanCount[borrower]++;
        totalBorrowed += amount;
        totalLoansIssued++;

        // Disburse loan to borrower
        stablecoin.safeTransfer(borrower, amount);

        emit LoanCreated(borrower, loanId, amount, installments);
        return loanId;
    }

    /// @notice Borrower repays an installment
    function repayInstallment(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        require(msg.sender == loan.borrower, "Not borrower");

        uint256 payment = loan.installmentAmount;
        if (payment > loan.remainingAmount) {
            payment = loan.remainingAmount;
        }

        stablecoin.safeTransferFrom(msg.sender, address(this), payment);
        loan.remainingAmount -= payment;
        loan.installmentsPaid++;
        loan.nextDueDate = block.timestamp + 30 days;

        // Track interest earned (proportional interest per installment)
        uint256 principalPerInstallment = (loan.totalAmount - (loan.totalAmount * loan.interestRate / (10000 + loan.interestRate))) / loan.totalInstallments;
        if (payment > principalPerInstallment) {
            totalInterestEarned += payment - principalPerInstallment;
        }

        emit InstallmentPaid(msg.sender, loanId, payment, loan.remainingAmount);

        if (loan.remainingAmount == 0) {
            loan.active = false;
            activeLoanCount[msg.sender]--;
            totalLoansRepaid++;
            // Reduce totalBorrowed by original principal
            uint256 originalPrincipal = loan.totalAmount * 10000 / (10000 + loan.interestRate);
            if (totalBorrowed >= originalPrincipal) {
                totalBorrowed -= originalPrincipal;
            }
            emit LoanCompleted(msg.sender, loanId);
        }
    }

    /// @notice Mark a loan as defaulted (called by owner)
    function markDefault(uint256 loanId) external onlyOwner {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        loan.active = false;
        loan.defaulted = true;
        activeLoanCount[loan.borrower]--;
        emit LoanDefaulted(loan.borrower, loanId);
    }

    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }

    function getLoansCount() external view returns (uint256) {
        return loans.length;
    }

    function getPoolStats() external view returns (
        uint256 _totalDeposits,
        uint256 _totalBorrowed,
        uint256 _available,
        uint256 _loansIssued,
        uint256 _loansRepaid,
        uint256 _interestEarned
    ) {
        return (totalDeposits, totalBorrowed, totalDeposits - totalBorrowed, totalLoansIssued, totalLoansRepaid, totalInterestEarned);
    }
}
