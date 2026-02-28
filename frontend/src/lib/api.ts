const API_BASE = "http://localhost:3001";

export interface CreditScoreResponse {
  score: number;
  tier: number;
  tierName: string;
  breakdown: {
    walletMaturity: number;
    defiExperience: number;
    transactionQuality: number;
    assetHealth: number;
    repaymentHistory: number;
    socialVerification: number;
  };
  aiReport: string;
  collateralRatio: number;
  creditLimit: number;
  interestRate: number;
  loansCompleted?: number;
  loansFailed?: number;
  totalBorrowed?: number;
  totalRepaid?: number;
}

export interface Loan {
  id: number;
  item: string;
  totalAmount: number;
  remainingAmount: number;
  installmentAmount: number;
  installmentsPaid: number;
  totalInstallments: number;
  collateralAmount: number;
  collateralYield: number;
  interestRate: number;
  nextDueDate: string;
  createdAt: string;
  active: boolean;
  status: string;
}

export interface PoolStats {
  totalDeposits: number;
  totalBorrowed: number;
  utilization: number;
  lenderAPY: number;
  totalLoansIssued: number;
  totalLoansRepaid: number;
  defaultRate: number;
  protocolRevenue: number;
}

export interface CollateralPosition {
  deposited: number;
  earnedYield: number;
  currentAPY: number;
  depositDate: string;
}

export async function fetchCreditScore(address: string): Promise<CreditScoreResponse> {
  const res = await fetch(`${API_BASE}/api/credit-score/${address}`);
  if (!res.ok) throw new Error(`Failed to fetch credit score: ${res.statusText}`);
  return res.json();
}

export async function fetchLoans(address: string): Promise<Loan[]> {
  const res = await fetch(`${API_BASE}/api/loans/${address}`);
  if (!res.ok) throw new Error(`Failed to fetch loans: ${res.statusText}`);
  const data = await res.json();
  return data.loans || data;
}

export async function fetchPoolStats(): Promise<PoolStats> {
  const res = await fetch(`${API_BASE}/api/pool/stats`);
  if (!res.ok) throw new Error(`Failed to fetch pool stats: ${res.statusText}`);
  return res.json();
}

export async function fetchCollateral(address: string): Promise<CollateralPosition> {
  const res = await fetch(`${API_BASE}/api/collateral/${address}`);
  if (!res.ok) throw new Error(`Failed to fetch collateral: ${res.statusText}`);
  return res.json();
}

export async function createLoan(borrower: string, amount: number, collateralAmount: number) {
  const res = await fetch(`${API_BASE}/api/loans/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ borrower, amount, collateralAmount }),
  });
  if (!res.ok) throw new Error(`Failed to create loan: ${res.statusText}`);
  return res.json();
}

export async function repayLoan(borrower: string, loanId: number, amount: number) {
  const res = await fetch(`${API_BASE}/api/loans/repay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ borrower, loanId, amount }),
  });
  if (!res.ok) throw new Error(`Failed to repay loan: ${res.statusText}`);
  return res.json();
}

export async function bnplCheckout(buyer: string, merchant: string, amount: number, productName: string) {
  const res = await fetch(`${API_BASE}/api/bnpl/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buyer, merchant, amount, productName }),
  });
  if (!res.ok) throw new Error(`Failed to checkout: ${res.statusText}`);
  return res.json();
}
