import 'dotenv/config';

// Contract addresses from environment
export const CONTRACTS = {
  credScore: (process.env.CREDSCORE_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  lendingPool: (process.env.LENDING_POOL_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  smartCollateral: (process.env.SMART_COLLATERAL_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  creditSBT: (process.env.CREDIT_SBT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  bnplCheckout: (process.env.BNPL_CHECKOUT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  stablecoin: (process.env.STABLECOIN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
} as const;

// CredScore ABI
export const CREDSCORE_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'score', type: 'uint256' }, { name: 'reportHash', type: 'bytes32' }],
    name: 'setScore',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'success', type: 'bool' }, { name: 'amount', type: 'uint256' }],
    name: 'recordLoanOutcome',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getProfile',
    outputs: [{
      components: [
        { name: 'score', type: 'uint256' },
        { name: 'tier', type: 'uint256' },
        { name: 'creditLimit', type: 'uint256' },
        { name: 'collateralRatio', type: 'uint256' },
        { name: 'loansCompleted', type: 'uint256' },
        { name: 'loansFailed', type: 'uint256' },
        { name: 'totalBorrowed', type: 'uint256' },
        { name: 'totalRepaid', type: 'uint256' },
        { name: 'reportHash', type: 'bytes32' },
        { name: 'lastUpdated', type: 'uint256' },
      ],
      name: '',
      type: 'tuple',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'hasProfile',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// LendingPool ABI
export const LENDING_POOL_ABI = [
  {
    inputs: [
      { name: 'borrower', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'installments', type: 'uint256' },
      { name: 'interestRate', type: 'uint256' },
      { name: 'collateralAmount', type: 'uint256' },
    ],
    name: 'createLoan',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'loanId', type: 'uint256' }],
    name: 'repayInstallment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'loanId', type: 'uint256' }],
    name: 'getLoan',
    outputs: [{
      components: [
        { name: 'borrower', type: 'address' },
        { name: 'totalAmount', type: 'uint256' },
        { name: 'remainingAmount', type: 'uint256' },
        { name: 'collateralAmount', type: 'uint256' },
        { name: 'installmentAmount', type: 'uint256' },
        { name: 'installmentsPaid', type: 'uint256' },
        { name: 'totalInstallments', type: 'uint256' },
        { name: 'nextDueDate', type: 'uint256' },
        { name: 'interestRate', type: 'uint256' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'active', type: 'bool' },
        { name: 'defaulted', type: 'bool' },
      ],
      name: '',
      type: 'tuple',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserLoans',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPoolStats',
    outputs: [
      { name: '_totalDeposits', type: 'uint256' },
      { name: '_totalBorrowed', type: 'uint256' },
      { name: '_available', type: 'uint256' },
      { name: '_loansIssued', type: 'uint256' },
      { name: '_loansRepaid', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalDeposits',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalBorrowed',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'activeLoanCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// SmartCollateral ABI
export const SMART_COLLATERAL_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'loanId', type: 'uint256' }],
    name: 'depositCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'withdrawCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'seizeCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'calculateYield',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getPosition',
    outputs: [{
      components: [
        { name: 'user', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'yieldEarned', type: 'uint256' },
        { name: 'depositTimestamp', type: 'uint256' },
        { name: 'loanId', type: 'uint256' },
        { name: 'active', type: 'bool' },
      ],
      name: '',
      type: 'tuple',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalCollateral',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// CreditSBT ABI
export const CREDIT_SBT_ABI = [
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'initialScore', type: 'uint256' }],
    name: 'mint',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'newScore', type: 'uint256' },
      { name: 'loanSuccess', type: 'bool' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'updateHistory',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getHistory',
    outputs: [{
      components: [
        { name: 'score', type: 'uint256' },
        { name: 'tier', type: 'uint256' },
        { name: 'loansCompleted', type: 'uint256' },
        { name: 'loansFailed', type: 'uint256' },
        { name: 'totalBorrowed', type: 'uint256' },
        { name: 'totalRepaid', type: 'uint256' },
        { name: 'longestStreak', type: 'uint256' },
        { name: 'currentStreak', type: 'uint256' },
        { name: 'firstCreditDate', type: 'uint256' },
        { name: 'lastUpdated', type: 'uint256' },
      ],
      name: '',
      type: 'tuple',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'userToken',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// BNPLCheckout ABI
export const BNPL_CHECKOUT_ABI = [
  {
    inputs: [
      { name: 'buyer', type: 'address' },
      { name: 'merchant', type: 'address' },
      { name: 'itemName', type: 'string' },
      { name: 'totalPrice', type: 'uint256' },
      { name: 'installments', type: 'uint8' },
      { name: 'loanId', type: 'uint256' },
    ],
    name: 'createPurchase',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'purchaseId', type: 'uint256' }],
    name: 'recordInstallmentPaid',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'getPurchase',
    outputs: [{
      components: [
        { name: 'buyer', type: 'address' },
        { name: 'merchant', type: 'address' },
        { name: 'itemName', type: 'string' },
        { name: 'totalPrice', type: 'uint256' },
        { name: 'paidAmount', type: 'uint256' },
        { name: 'installmentAmount', type: 'uint256' },
        { name: 'installmentsPaid', type: 'uint8' },
        { name: 'totalInstallments', type: 'uint8' },
        { name: 'loanId', type: 'uint256' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'completed', type: 'bool' },
      ],
      name: '',
      type: 'tuple',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'buyer', type: 'address' }],
    name: 'getBuyerPurchases',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalPurchaseVolume',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalPurchases',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
