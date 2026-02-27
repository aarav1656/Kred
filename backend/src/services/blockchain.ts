import { publicClient, getWalletClient, getAccount } from '../config/chain.js';
import {
  CONTRACTS,
  CREDSCORE_ABI,
  LENDING_POOL_ABI,
  SMART_COLLATERAL_ABI,
  CREDIT_SBT_ABI,
  BNPL_CHECKOUT_ABI,
} from '../config/contracts.js';
import { formatUnits, parseUnits } from 'viem';

// Helper to serialize bigints in objects
function serializeBigInts(obj: any): any {
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInts);
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInts(value);
    }
    return result;
  }
  return obj;
}

// ========== CredScore ==========

export async function getCredProfile(userAddress: `0x${string}`) {
  const profile = await publicClient.readContract({
    address: CONTRACTS.credScore,
    abi: CREDSCORE_ABI,
    functionName: 'getProfile',
    args: [userAddress],
  });
  return serializeBigInts(profile);
}

export async function hasCredProfile(userAddress: `0x${string}`) {
  return publicClient.readContract({
    address: CONTRACTS.credScore,
    abi: CREDSCORE_ABI,
    functionName: 'hasProfile',
    args: [userAddress],
  });
}

export async function setCredScore(
  userAddress: `0x${string}`,
  score: number,
  reportHash: `0x${string}`
) {
  const walletClient = getWalletClient();
  const account = getAccount();
  const hash = await walletClient.writeContract({
    address: CONTRACTS.credScore,
    abi: CREDSCORE_ABI,
    functionName: 'setScore',
    args: [userAddress, BigInt(score), reportHash],
    account,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, receipt: serializeBigInts(receipt) };
}

export async function recordLoanOutcome(
  userAddress: `0x${string}`,
  success: boolean,
  amount: bigint
) {
  const walletClient = getWalletClient();
  const account = getAccount();
  const hash = await walletClient.writeContract({
    address: CONTRACTS.credScore,
    abi: CREDSCORE_ABI,
    functionName: 'recordLoanOutcome',
    args: [userAddress, success, amount],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

// ========== LendingPool ==========

export async function createLoan(
  borrower: `0x${string}`,
  amount: bigint,
  installments: number,
  interestRate: number,
  collateralAmount: bigint
) {
  const walletClient = getWalletClient();
  const account = getAccount();
  const hash = await walletClient.writeContract({
    address: CONTRACTS.lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'createLoan',
    args: [borrower, amount, BigInt(installments), BigInt(interestRate), collateralAmount],
    account,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, receipt: serializeBigInts(receipt) };
}

export async function getLoan(loanId: number) {
  const loan = await publicClient.readContract({
    address: CONTRACTS.lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getLoan',
    args: [BigInt(loanId)],
  });
  return serializeBigInts(loan);
}

export async function getUserLoans(userAddress: `0x${string}`) {
  const loanIds = await publicClient.readContract({
    address: CONTRACTS.lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getUserLoans',
    args: [userAddress],
  });
  return loanIds;
}

export async function getPoolStats() {
  const stats = await publicClient.readContract({
    address: CONTRACTS.lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getPoolStats',
  });
  return {
    totalDeposits: stats[0].toString(),
    totalBorrowed: stats[1].toString(),
    available: stats[2].toString(),
    loansIssued: stats[3].toString(),
    loansRepaid: stats[4].toString(),
    totalDepositsFormatted: formatUnits(stats[0], 18),
    totalBorrowedFormatted: formatUnits(stats[1], 18),
    availableFormatted: formatUnits(stats[2], 18),
    utilizationRate: stats[0] > 0n
      ? Number((stats[1] * 10000n) / stats[0]) / 100
      : 0,
  };
}

export async function getActiveLoanCount(userAddress: `0x${string}`) {
  return publicClient.readContract({
    address: CONTRACTS.lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'activeLoanCount',
    args: [userAddress],
  });
}

// ========== SmartCollateral ==========

export async function depositCollateral(
  userAddress: `0x${string}`,
  amount: bigint,
  loanId: number
) {
  const walletClient = getWalletClient();
  const account = getAccount();
  const hash = await walletClient.writeContract({
    address: CONTRACTS.smartCollateral,
    abi: SMART_COLLATERAL_ABI,
    functionName: 'depositCollateral',
    args: [userAddress, amount, BigInt(loanId)],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

export async function getCollateralPosition(userAddress: `0x${string}`) {
  const position = await publicClient.readContract({
    address: CONTRACTS.smartCollateral,
    abi: SMART_COLLATERAL_ABI,
    functionName: 'getPosition',
    args: [userAddress],
  });

  const yieldEarned = await publicClient.readContract({
    address: CONTRACTS.smartCollateral,
    abi: SMART_COLLATERAL_ABI,
    functionName: 'calculateYield',
    args: [userAddress],
  });

  return {
    ...serializeBigInts(position),
    currentYield: yieldEarned.toString(),
    currentYieldFormatted: formatUnits(yieldEarned, 18),
    amountFormatted: formatUnits(position.amount, 18),
    totalValue: formatUnits(position.amount + yieldEarned, 18),
  };
}

// ========== CreditSBT ==========

export async function mintSBT(userAddress: `0x${string}`, initialScore: number) {
  const walletClient = getWalletClient();
  const account = getAccount();
  const hash = await walletClient.writeContract({
    address: CONTRACTS.creditSBT,
    abi: CREDIT_SBT_ABI,
    functionName: 'mint',
    args: [userAddress, BigInt(initialScore)],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

export async function updateSBTHistory(
  userAddress: `0x${string}`,
  newScore: number,
  loanSuccess: boolean,
  amount: bigint
) {
  const walletClient = getWalletClient();
  const account = getAccount();
  const hash = await walletClient.writeContract({
    address: CONTRACTS.creditSBT,
    abi: CREDIT_SBT_ABI,
    functionName: 'updateHistory',
    args: [userAddress, BigInt(newScore), loanSuccess, amount],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

export async function getSBTHistory(userAddress: `0x${string}`) {
  const history = await publicClient.readContract({
    address: CONTRACTS.creditSBT,
    abi: CREDIT_SBT_ABI,
    functionName: 'getHistory',
    args: [userAddress],
  });
  return serializeBigInts(history);
}

export async function getUserSBTToken(userAddress: `0x${string}`) {
  return publicClient.readContract({
    address: CONTRACTS.creditSBT,
    abi: CREDIT_SBT_ABI,
    functionName: 'userToken',
    args: [userAddress],
  });
}

// ========== BNPLCheckout ==========

export async function createBNPLPurchase(
  buyer: `0x${string}`,
  merchant: `0x${string}`,
  itemName: string,
  totalPrice: bigint,
  installments: number,
  loanId: number
) {
  const walletClient = getWalletClient();
  const account = getAccount();
  const hash = await walletClient.writeContract({
    address: CONTRACTS.bnplCheckout,
    abi: BNPL_CHECKOUT_ABI,
    functionName: 'createPurchase',
    args: [buyer, merchant, itemName, totalPrice, installments, BigInt(loanId)],
    account,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, receipt: serializeBigInts(receipt) };
}

export async function getBuyerPurchases(buyerAddress: `0x${string}`) {
  return publicClient.readContract({
    address: CONTRACTS.bnplCheckout,
    abi: BNPL_CHECKOUT_ABI,
    functionName: 'getBuyerPurchases',
    args: [buyerAddress],
  });
}
