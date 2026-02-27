// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreditSBT - Soulbound Credit Token
 * @notice Non-transferable token representing on-chain credit reputation
 * @dev Overrides _update to prevent transfers (soulbound)
 */
contract CreditSBT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    struct CreditHistory {
        uint256 score;
        uint256 tier;
        uint256 loansCompleted;
        uint256 loansFailed;
        uint256 totalBorrowed;
        uint256 totalRepaid;
        uint256 longestStreak;
        uint256 currentStreak;
        uint256 firstCreditDate;
        uint256 lastUpdated;
    }

    mapping(uint256 => CreditHistory) public history;
    mapping(address => uint256) public userToken;

    uint256 public totalMinted;

    event CreditSBTMinted(address indexed user, uint256 indexed tokenId);
    event CreditHistoryUpdated(address indexed user, uint256 score, uint256 loansCompleted);

    constructor() ERC721("CredShield Credit", "CRED") Ownable(msg.sender) {}

    /// @notice Mint a soulbound credit token for a user
    function mint(address to, uint256 initialScore) external onlyOwner returns (uint256) {
        require(userToken[to] == 0, "Already has SBT");
        require(initialScore >= 300 && initialScore <= 900, "Invalid score");

        uint256 tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);
        userToken[to] = tokenId;

        history[tokenId] = CreditHistory({
            score: initialScore,
            tier: _getTier(initialScore),
            loansCompleted: 0,
            loansFailed: 0,
            totalBorrowed: 0,
            totalRepaid: 0,
            longestStreak: 0,
            currentStreak: 0,
            firstCreditDate: block.timestamp,
            lastUpdated: block.timestamp
        });

        totalMinted++;
        emit CreditSBTMinted(to, tokenId);
        return tokenId;
    }

    /// @notice Update credit history after loan outcome
    function updateHistory(
        address user,
        uint256 newScore,
        bool loanSuccess,
        uint256 amount
    ) external onlyOwner {
        uint256 tokenId = userToken[user];
        require(tokenId != 0, "No SBT");

        CreditHistory storage h = history[tokenId];
        h.score = newScore;
        h.tier = _getTier(newScore);
        h.lastUpdated = block.timestamp;

        if (loanSuccess) {
            h.loansCompleted++;
            h.totalRepaid += amount;
            h.currentStreak++;
            if (h.currentStreak > h.longestStreak) {
                h.longestStreak = h.currentStreak;
            }
        } else {
            h.loansFailed++;
            h.currentStreak = 0;
        }

        h.totalBorrowed += amount;
        emit CreditHistoryUpdated(user, newScore, h.loansCompleted);
    }

    /// @dev SOULBOUND: Block all transfers except minting
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "Soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }

    function getHistory(address user) external view returns (CreditHistory memory) {
        return history[userToken[user]];
    }

    function hasSBT(address user) external view returns (bool) {
        return userToken[user] != 0;
    }

    function _getTier(uint256 score) internal pure returns (uint256) {
        if (score >= 800) return 3;
        if (score >= 700) return 2;
        if (score >= 550) return 1;
        return 0;
    }
}
