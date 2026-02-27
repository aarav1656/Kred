export interface CreditProfile {
  score: bigint;
  tier: bigint;
  creditLimit: bigint;
  collateralRatio: bigint;
  loansCompleted: bigint;
  loansFailed: bigint;
  totalBorrowed: bigint;
  totalRepaid: bigint;
  reportHash: `0x${string}`;
  lastUpdated: bigint;
}

export interface Loan {
  borrower: `0x${string}`;
  totalAmount: bigint;
  remainingAmount: bigint;
  collateralAmount: bigint;
  installmentAmount: bigint;
  installmentsPaid: bigint;
  totalInstallments: bigint;
  nextDueDate: bigint;
  interestRate: bigint;
  createdAt: bigint;
  active: boolean;
  defaulted: boolean;
}

export interface CollateralPosition {
  user: `0x${string}`;
  amount: bigint;
  yieldEarned: bigint;
  depositTimestamp: bigint;
  loanId: bigint;
  active: boolean;
}

export interface CreditHistory {
  score: bigint;
  tier: bigint;
  loansCompleted: bigint;
  loansFailed: bigint;
  totalBorrowed: bigint;
  totalRepaid: bigint;
  longestStreak: bigint;
  currentStreak: bigint;
  firstCreditDate: bigint;
  lastUpdated: bigint;
}

export interface Purchase {
  buyer: `0x${string}`;
  merchant: `0x${string}`;
  itemName: string;
  totalPrice: bigint;
  paidAmount: bigint;
  installmentAmount: bigint;
  installmentsPaid: number;
  totalInstallments: number;
  loanId: bigint;
  createdAt: bigint;
  completed: boolean;
}

export interface CreditScoreRequest {
  walletAddress: string;
}

export interface LoanCreateRequest {
  walletAddress: string;
  amount: string; // in USDT, e.g. "1000"
  installments: number; // 2-12
}

export interface LoanRepayRequest {
  walletAddress: string;
  loanId: number;
}

export interface BNPLCheckoutRequest {
  buyerAddress: string;
  merchantAddress: string;
  itemName: string;
  totalPrice: string; // in USDT
  installments: number; // typically 3
}

// Tier names and config
export const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const;
export const TIER_COLLATERAL_RATIOS = [12500, 10000, 7500, 5000] as const; // basis points
export const TIER_CREDIT_LIMITS = [500, 1000, 2000, 5000] as const; // in USDT
export const TIER_INTEREST_RATES = [800, 600, 400, 200] as const; // basis points
