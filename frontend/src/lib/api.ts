const API_BASE = "http://localhost:3001";

// Parse "$123.45" or "123.45" strings to number
function parseAmount(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  return parseFloat(val.replace(/[$,]/g, "")) || 0;
}

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

// ── Credit Score ──────────────────────────────────────

const TIER_MAP: Record<string, number> = {
  Bronze: 0,
  Silver: 1,
  Gold: 2,
  Platinum: 3,
};

function getDimensionScore(
  dimensions: Array<{ name: string; score: number; maxScore: number }>,
  name: string
): number {
  const dim = dimensions.find((d) => d.name === name);
  if (!dim) return 0;
  return Math.round((dim.score / dim.maxScore) * 100);
}

export async function fetchCreditScore(address: string): Promise<CreditScoreResponse> {
  const res = await fetch(`${API_BASE}/api/credit-score/${address}`);
  if (!res.ok) throw new Error(`Failed to fetch credit score: ${res.statusText}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = await res.json();

  const dimensions = raw.dimensions || [];
  return {
    score: raw.credScore ?? raw.score ?? 0,
    tier: TIER_MAP[raw.tier] ?? 0,
    tierName: raw.tier || "Bronze",
    breakdown: {
      walletMaturity: getDimensionScore(dimensions, "Wallet Maturity"),
      defiExperience: getDimensionScore(dimensions, "DeFi Experience"),
      transactionQuality: getDimensionScore(dimensions, "Transaction Quality"),
      assetHealth: getDimensionScore(dimensions, "Asset Health"),
      repaymentHistory: getDimensionScore(dimensions, "Repayment History"),
      socialVerification: getDimensionScore(dimensions, "Social Verification"),
    },
    aiReport: raw.aiReport || "",
    collateralRatio: raw.collateralRatio ?? 12500,
    creditLimit: raw.creditLimit ?? 500,
    interestRate: raw.interestRate ?? 8,
    loansCompleted: raw.loansCompleted ?? 0,
    loansFailed: raw.loansFailed ?? 0,
    totalBorrowed: raw.totalBorrowed ?? 0,
    totalRepaid: raw.totalRepaid ?? 0,
  };
}

// ── Loans ─────────────────────────────────────────────

export async function fetchLoans(address: string): Promise<Loan[]> {
  const res = await fetch(`${API_BASE}/api/loans/${address}`);
  if (!res.ok) throw new Error(`Failed to fetch loans: ${res.statusText}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = await res.json();
  const loans = raw.loans || raw.data?.loans || (Array.isArray(raw) ? raw : []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return loans.map((l: any) => {
    const schedule = l.schedule || [];
    const nextDue = schedule.find((s: { status: string }) => s.status === "due" || s.status === "upcoming");
    return {
      id: l.loanId ?? l.id ?? 0,
      item: l.itemName || l.item || "Loan",
      totalAmount: parseAmount(l.totalAmount),
      remainingAmount: parseAmount(l.remainingAmount),
      installmentAmount: parseAmount(l.installmentAmount),
      installmentsPaid: l.installmentsPaid ?? l.paidCount ?? 0,
      totalInstallments: l.totalInstallments ?? schedule.length ?? 3,
      collateralAmount: parseAmount(l.collateralAmount),
      collateralYield: parseAmount(l.collateralYield ?? l.yieldEarned),
      interestRate: parseFloat(l.interestRate) || 0,
      nextDueDate: nextDue?.dueDate || l.nextDueDate || "",
      createdAt: l.createdAt || "",
      active: l.active ?? l.status === "active",
      status: l.status === "active" ? "on-track" : (l.status || "on-track"),
    };
  });
}

// ── Pool Stats ────────────────────────────────────────

export async function fetchPoolStats(): Promise<PoolStats> {
  const res = await fetch(`${API_BASE}/api/pool/stats`);
  if (!res.ok) throw new Error(`Failed to fetch pool stats: ${res.statusText}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = await res.json();
  const data = raw.data || raw;

  return {
    totalDeposits: parseAmount(data.totalDeposits),
    totalBorrowed: parseAmount(data.totalBorrowed),
    utilization: parseFloat(String(data.utilizationRate || data.utilization || "0").replace("%", "")) || 0,
    lenderAPY: parseFloat(String(data.lenderAPY || "5").replace("%", "")) || 5,
    totalLoansIssued: data.totalLoansIssued ?? 0,
    totalLoansRepaid: data.totalLoansRepaid ?? 0,
    defaultRate: data.defaultRate ?? 0,
    protocolRevenue: parseAmount(data.protocolRevenue),
  };
}

// ── Collateral ────────────────────────────────────────

export async function fetchCollateral(address: string): Promise<CollateralPosition> {
  const res = await fetch(`${API_BASE}/api/collateral/${address}`);
  if (!res.ok) throw new Error(`Failed to fetch collateral: ${res.statusText}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = await res.json();
  const data = raw.data || raw;

  if (!data.hasActiveCollateral) {
    return { deposited: 0, earnedYield: 0, currentAPY: 5, depositDate: "" };
  }

  return {
    deposited: parseAmount(data.collateralAmount),
    earnedYield: parseAmount(data.yieldEarned),
    currentAPY: parseFloat(String(data.estimatedAPY || "5").replace("%", "")) || 5,
    depositDate: data.depositDate || "",
  };
}

// ── Create Loan ───────────────────────────────────────

export async function createLoan(borrower: string, amount: number, installments: number = 3) {
  const res = await fetch(`${API_BASE}/api/loans/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: borrower, amount, installments }),
  });
  if (!res.ok) throw new Error(`Failed to create loan: ${res.statusText}`);
  return res.json();
}

// ── Repay Loan ────────────────────────────────────────

export async function repayLoan(borrower: string, loanId: number, _amount: number) {
  const res = await fetch(`${API_BASE}/api/loans/repay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: borrower, loanId }),
  });
  if (!res.ok) throw new Error(`Failed to repay loan: ${res.statusText}`);
  return res.json();
}

// ── BNPL Checkout ─────────────────────────────────────

export async function bnplCheckout(buyer: string, merchant: string, amount: number, productName: string) {
  const res = await fetch(`${API_BASE}/api/bnpl/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyerAddress: buyer.toLowerCase(),
      merchantAddress: merchant.toLowerCase(),
      totalPrice: amount,
      itemName: productName,
      installments: 3,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Failed to checkout: ${res.statusText}`);
  }
  return res.json();
}
