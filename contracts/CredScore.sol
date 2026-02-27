// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CredScore - On-Chain Credit Registry
 * @notice AI-powered credit scoring stored on-chain for BNB Chain lending
 * @dev Owner (backend) sets scores after AI analysis of wallet history
 */
contract CredScore is Ownable {
    struct CreditProfile {
        uint256 score;           // 300-900
        uint256 tier;            // 0=Bronze, 1=Silver, 2=Gold, 3=Platinum
        uint256 creditLimit;     // in USDT (18 decimals)
        uint256 collateralRatio; // basis points (5000 = 50%, 12500 = 125%)
        uint256 loansCompleted;
        uint256 loansFailed;
        uint256 totalBorrowed;
        uint256 totalRepaid;
        bytes32 reportHash;      // IPFS hash of AI credit report
        uint256 lastUpdated;
    }

    mapping(address => CreditProfile) public profiles;
    mapping(address => bool) public hasProfile;

    // Authorized callers (LendingPool, etc.)
    mapping(address => bool) public authorized;

    uint256[4] public tierThresholds = [300, 550, 700, 800];
    uint256[4] public tierCollateralRatios = [12500, 10000, 7500, 5000]; // 125%, 100%, 75%, 50%
    uint256[4] public tierCreditLimits = [500e18, 1000e18, 2000e18, 5000e18];
    uint256[4] public tierInterestRates = [800, 600, 400, 200]; // 8%, 6%, 4%, 2% in bps

    uint256 public totalProfiles;

    event CreditScoreSet(address indexed user, uint256 score, uint256 tier, uint256 creditLimit);
    event CreditScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore);
    event LoanRecorded(address indexed user, bool success, uint256 amount);
    event AuthorizedCaller(address indexed caller, bool status);

    modifier onlyAuthorized() {
        require(msg.sender == owner() || authorized[msg.sender], "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setAuthorized(address caller, bool status) external onlyOwner {
        authorized[caller] = status;
        emit AuthorizedCaller(caller, status);
    }

    function setScore(
        address user,
        uint256 score,
        bytes32 reportHash
    ) external onlyOwner {
        require(score >= 300 && score <= 900, "Score must be 300-900");

        uint256 tier = _getTier(score);
        uint256 oldScore = profiles[user].score;

        profiles[user].score = score;
        profiles[user].tier = tier;
        profiles[user].creditLimit = tierCreditLimits[tier];
        profiles[user].collateralRatio = tierCollateralRatios[tier];
        profiles[user].reportHash = reportHash;
        profiles[user].lastUpdated = block.timestamp;

        if (!hasProfile[user]) {
            hasProfile[user] = true;
            totalProfiles++;
            emit CreditScoreSet(user, score, tier, tierCreditLimits[tier]);
        } else {
            emit CreditScoreUpdated(user, oldScore, score);
        }
    }

    function recordLoanOutcome(
        address user,
        bool success,
        uint256 amount
    ) external onlyAuthorized {
        require(hasProfile[user], "No profile");

        if (success) {
            profiles[user].loansCompleted++;
            profiles[user].totalRepaid += amount;
            // Boost score by 15 points (max 900)
            uint256 newScore = profiles[user].score + 15;
            profiles[user].score = newScore > 900 ? 900 : newScore;
        } else {
            profiles[user].loansFailed++;
            // Penalize by 100 points (min 300)
            uint256 currentScore = profiles[user].score;
            profiles[user].score = currentScore > 400 ? currentScore - 100 : 300;
        }

        profiles[user].totalBorrowed += amount;
        profiles[user].tier = _getTier(profiles[user].score);
        profiles[user].collateralRatio = tierCollateralRatios[profiles[user].tier];
        profiles[user].creditLimit = tierCreditLimits[profiles[user].tier];
        profiles[user].lastUpdated = block.timestamp;

        emit LoanRecorded(user, success, amount);
    }

    function getProfile(address user) external view returns (CreditProfile memory) {
        return profiles[user];
    }

    function getInterestRate(address user) external view returns (uint256) {
        if (!hasProfile[user]) return tierInterestRates[0]; // default Bronze rate
        return tierInterestRates[profiles[user].tier];
    }

    function _getTier(uint256 score) internal pure returns (uint256) {
        if (score >= 800) return 3; // Platinum
        if (score >= 700) return 2; // Gold
        if (score >= 550) return 1; // Silver
        return 0; // Bronze
    }
}
