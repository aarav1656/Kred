export const TIERS = {
  0: { name: "Bronze", color: "#CD7F32", bg: "from-amber-900/20 to-amber-800/10", border: "border-amber-700/30", text: "text-amber-500", collateral: "125%", limit: "$500", rate: "8%" },
  1: { name: "Silver", color: "#C0C0C0", bg: "from-slate-400/20 to-slate-500/10", border: "border-slate-400/30", text: "text-slate-300", collateral: "100%", limit: "$1,000", rate: "6%" },
  2: { name: "Gold", color: "#FFD700", bg: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/30", text: "text-yellow-400", collateral: "75%", limit: "$2,000", rate: "4%" },
  3: { name: "Platinum", color: "#00D4FF", bg: "from-cyan-400/20 to-cyan-500/10", border: "border-cyan-400/30", text: "text-cyan-400", collateral: "50%", limit: "$5,000", rate: "2%" },
} as const;

export function getTier(score: number): 0 | 1 | 2 | 3 {
  if (score >= 800) return 3;
  if (score >= 700) return 2;
  if (score >= 550) return 1;
  return 0;
}

export function getScoreColor(score: number): string {
  if (score >= 800) return "#00D4FF";
  if (score >= 700) return "#FFD700";
  if (score >= 550) return "#C0C0C0";
  return "#CD7F32";
}

export const mockCreditProfile = {
  score: 782,
  breakdown: {
    walletMaturity: 156,
    defiExperience: 198,
    transactionQuality: 145,
    assetHealth: 112,
    repaymentHistory: 121,
    socialVerification: 38,
  },
  aiReport: `**Credit Assessment Summary**

Your wallet demonstrates strong DeFi engagement over 18 months across BNB Chain. Key highlights:

- **Wallet Maturity (156/180):** Active since June 2024, consistent weekly transactions with no dormant periods exceeding 14 days. This shows sustained engagement and reliability.

- **DeFi Experience (198/225):** Extensive lending on Venus Protocol ($12,400 supplied), active LP positions on PancakeSwap (3 pairs), and staking on multiple validators. Your protocol diversity score is in the top 15%.

- **Transaction Quality (145/180):** 92% of interactions are with audited, verified protocols. Minor exposure to 2 unverified contracts, which slightly impacts this score.

- **Asset Health (112/135):** Well-diversified portfolio with 45% stablecoins, 30% BNB, 15% blue-chip tokens, 10% other. Healthy stablecoin ratio indicates risk-aware behavior.

- **Repayment History (121/135):** 4 out of 4 previous CredShield loans repaid on time. Perfect repayment streak of 120+ days.

- **Social Verification (38/45):** Active governance participation in PancakeSwap and Venus. No ENS domain registered.

**Recommendation:** Pre-approved for Gold tier with path to Platinum. Continue on-time repayments and increase audited protocol interactions to reach 800+.`,
  loansCompleted: 4,
  loansFailed: 0,
  totalBorrowed: 2800,
  totalRepaid: 2856,
};

export const mockProducts = [
  {
    id: 1,
    name: "Premium .bnb Domain",
    category: "Digital Goods",
    price: 150,
    image: "🌐",
    description: "Secure your premium .bnb domain name for 2 years. Includes ENS-compatible resolution.",
    seller: "BNB Name Service",
  },
  {
    id: 2,
    name: "DeFi Yield Bundle",
    category: "DeFi Positions",
    price: 500,
    image: "📈",
    description: "Curated LP position across top 3 PancakeSwap pools. Auto-compounding enabled.",
    seller: "YieldMax Protocol",
  },
  {
    id: 3,
    name: "Generative Art NFT",
    category: "NFTs",
    price: 300,
    image: "🎨",
    description: "Limited edition 1/100 generative art piece from renowned on-chain artist collective.",
    seller: "ArtBlocks BNB",
  },
  {
    id: 4,
    name: "Cloud GPU Credits",
    category: "Digital Goods",
    price: 200,
    image: "☁️",
    description: "100 hours of A100 GPU compute credits for AI/ML workloads. No expiry.",
    seller: "DeCloud Network",
  },
  {
    id: 5,
    name: "Validator Stake Package",
    category: "DeFi Positions",
    price: 1000,
    image: "🔒",
    description: "Delegated BNB staking position with top-performing validator. ~4.2% APY.",
    seller: "StakeHub",
  },
  {
    id: 6,
    name: "Gaming NFT Bundle",
    category: "NFTs",
    price: 250,
    image: "🎮",
    description: "Starter pack: 3 hero NFTs + 1000 in-game tokens for top BNB Chain game.",
    seller: "GameFi Studios",
  },
  {
    id: 7,
    name: "API Access Pass",
    category: "Digital Goods",
    price: 120,
    image: "🔑",
    description: "12-month unlimited access to premium blockchain data APIs. Rate limit: 1000 req/min.",
    seller: "ChainData Pro",
  },
  {
    id: 8,
    name: "Lending Pool Entry",
    category: "DeFi Positions",
    price: 750,
    image: "🏦",
    description: "Auto-managed lending position across Venus + Radiant. Optimized for max yield.",
    seller: "LendOptimizer",
  },
];

export const mockLoans = [
  {
    id: 1,
    item: "DeFi Yield Bundle",
    totalAmount: 500,
    remainingAmount: 166.67,
    installmentAmount: 166.67,
    installmentsPaid: 2,
    totalInstallments: 3,
    collateralAmount: 375,
    collateralYield: 4.68,
    interestRate: 4,
    nextDueDate: "2026-03-15",
    createdAt: "2026-01-15",
    active: true,
    status: "on-track",
  },
  {
    id: 2,
    item: "Premium .bnb Domain",
    totalAmount: 150,
    remainingAmount: 50,
    installmentAmount: 50,
    installmentsPaid: 2,
    totalInstallments: 3,
    collateralAmount: 112.5,
    collateralYield: 2.11,
    interestRate: 4,
    nextDueDate: "2026-03-10",
    createdAt: "2026-01-10",
    active: true,
    status: "on-track",
  },
];

export const mockPaymentHistory = [
  { date: "2026-01-15", amount: 166.67, loan: "DeFi Yield Bundle", status: "paid" },
  { date: "2026-01-10", amount: 50, loan: "Premium .bnb Domain", status: "paid" },
  { date: "2026-02-15", amount: 166.67, loan: "DeFi Yield Bundle", status: "paid" },
  { date: "2026-02-10", amount: 50, loan: "Premium .bnb Domain", status: "paid" },
  { date: "2026-03-15", amount: 166.67, loan: "DeFi Yield Bundle", status: "upcoming" },
  { date: "2026-03-10", amount: 50, loan: "Premium .bnb Domain", status: "upcoming" },
];

export const mockPoolStats = {
  totalDeposits: 1_250_000,
  totalBorrowed: 875_000,
  utilization: 70,
  lenderAPY: 8.4,
  totalLoansIssued: 342,
  totalLoansRepaid: 298,
  defaultRate: 2.1,
  protocolRevenue: 12_450,
};

export const mockLenderPosition = {
  deposited: 5000,
  earnedYield: 187.50,
  currentAPY: 8.4,
  depositDate: "2025-12-01",
};
