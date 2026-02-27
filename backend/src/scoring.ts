import type { WalletData, DimensionScore } from "./types.js";
import {
  KNOWN_DEFI_PROTOCOLS,
  AUDITED_PROTOCOLS,
  STABLECOINS,
  BLUE_CHIP_TOKENS,
} from "./types.js";

const BASE_SCORE = 300;

function clamp(value: number, min: number, max: number): number {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

// --- Dimension 1: Wallet Maturity (20%, max 180 points) ---
function scoreWalletMaturity(data: WalletData): DimensionScore {
  const maxScore = 180;
  let raw = 0;
  const details: string[] = [];

  if (data.transactions.length === 0) {
    return { name: "Wallet Maturity", score: 0, maxScore, weight: 0.2, weightedScore: 0, details: "No transaction history found." };
  }

  // Wallet age (oldest tx timestamp)
  const timestamps = data.transactions.map((tx) => parseInt(tx.timeStamp));
  const oldestTx = Math.min(...timestamps);
  const newestTx = Math.max(...timestamps);
  const now = Math.floor(Date.now() / 1000);
  const ageInDays = (now - oldestTx) / 86400;
  const ageInMonths = ageInDays / 30;

  // Age score: 0-60 points (max at 24+ months)
  const ageScore = clamp(Math.floor((ageInMonths / 24) * 60), 0, 60);
  raw += ageScore;
  details.push(`Wallet age: ${Math.floor(ageInMonths)} months (${ageScore}/60)`);

  // Activity consistency: active months / total months (0-60 points)
  const activeMonths = new Set<string>();
  timestamps.forEach((ts) => {
    const d = new Date(ts * 1000);
    activeMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
  });
  const totalMonths = Math.max(1, ageInMonths);
  const consistencyRatio = activeMonths.size / totalMonths;
  const consistencyScore = clamp(Math.floor(consistencyRatio * 60), 0, 60);
  raw += consistencyScore;
  details.push(`Active ${activeMonths.size}/${Math.floor(totalMonths)} months (${consistencyScore}/60)`);

  // Transaction volume: 0-60 points (max at 200+ txs)
  const txCount = data.transactions.length;
  const volumeScore = clamp(Math.floor((txCount / 200) * 60), 0, 60);
  raw += volumeScore;
  details.push(`${txCount} transactions (${volumeScore}/60)`);

  const score = clamp(raw, 0, maxScore);
  return { name: "Wallet Maturity", score, maxScore, weight: 0.2, weightedScore: score, details: details.join("; ") };
}

// --- Dimension 2: DeFi Experience (25%, max 225 points) ---
function scoreDeFiExperience(data: WalletData): DimensionScore {
  const maxScore = 225;
  let raw = 0;
  const details: string[] = [];

  const defiInteractions = new Map<string, number>();
  const allTxs = [...data.transactions, ...data.internalTxs];

  for (const tx of allTxs) {
    const to = tx.to?.toLowerCase();
    if (to && KNOWN_DEFI_PROTOCOLS[to]) {
      defiInteractions.set(to, (defiInteractions.get(to) || 0) + 1);
    }
  }

  // Number of unique DeFi protocols used (0-75 points, max at 5+)
  const uniqueProtocols = defiInteractions.size;
  const protocolScore = clamp(Math.floor((uniqueProtocols / 5) * 75), 0, 75);
  raw += protocolScore;
  const protocolNames = Array.from(defiInteractions.keys()).map((addr) => KNOWN_DEFI_PROTOCOLS[addr]).slice(0, 5);
  details.push(`${uniqueProtocols} DeFi protocols used: ${protocolNames.join(", ") || "none"} (${protocolScore}/75)`);

  // Total DeFi interactions (0-75 points, max at 50+)
  const totalInteractions = Array.from(defiInteractions.values()).reduce((a, b) => a + b, 0);
  const interactionScore = clamp(Math.floor((totalInteractions / 50) * 75), 0, 75);
  raw += interactionScore;
  details.push(`${totalInteractions} total DeFi interactions (${interactionScore}/75)`);

  // Check for lending/staking specific patterns (0-75 points)
  const hasLending = allTxs.some((tx) => {
    const to = tx.to?.toLowerCase();
    return to && (
      KNOWN_DEFI_PROTOCOLS[to]?.includes("Venus") ||
      KNOWN_DEFI_PROTOCOLS[to]?.includes("Aave") ||
      KNOWN_DEFI_PROTOCOLS[to]?.includes("Alpaca")
    );
  });
  const hasLP = allTxs.some((tx) => {
    const to = tx.to?.toLowerCase();
    return to && (
      KNOWN_DEFI_PROTOCOLS[to]?.includes("PancakeSwap") ||
      KNOWN_DEFI_PROTOCOLS[to]?.includes("Biswap") ||
      KNOWN_DEFI_PROTOCOLS[to]?.includes("Thena")
    );
  });
  const hasStaking = allTxs.some((tx) => {
    const to = tx.to?.toLowerCase();
    return to && (
      KNOWN_DEFI_PROTOCOLS[to]?.includes("Staking") ||
      KNOWN_DEFI_PROTOCOLS[to]?.includes("MasterChef")
    );
  });

  let diversityScore = 0;
  if (hasLending) { diversityScore += 25; details.push("Lending activity detected (+25)"); }
  if (hasLP) { diversityScore += 25; details.push("LP/DEX activity detected (+25)"); }
  if (hasStaking) { diversityScore += 25; details.push("Staking activity detected (+25)"); }
  raw += diversityScore;

  const score = clamp(raw, 0, maxScore);
  return { name: "DeFi Experience", score, maxScore, weight: 0.25, weightedScore: score, details: details.join("; ") };
}

// --- Dimension 3: Transaction Quality (20%, max 180 points) ---
function scoreTransactionQuality(data: WalletData): DimensionScore {
  const maxScore = 180;
  let raw = 0;
  const details: string[] = [];

  if (data.transactions.length === 0) {
    return { name: "Transaction Quality", score: 0, maxScore, weight: 0.2, weightedScore: 0, details: "No transactions." };
  }

  // Success rate (0-60 points)
  const totalTxs = data.transactions.length;
  const failedTxs = data.transactions.filter((tx) => tx.isError === "1").length;
  const successRate = (totalTxs - failedTxs) / totalTxs;
  const successScore = clamp(Math.floor(successRate * 60), 0, 60);
  raw += successScore;
  details.push(`${Math.floor(successRate * 100)}% success rate (${successScore}/60)`);

  // Audited protocol interaction ratio (0-60 points)
  const contractTxs = data.transactions.filter((tx) => tx.to && tx.functionName);
  const auditedTxs = contractTxs.filter((tx) => AUDITED_PROTOCOLS.has(tx.to.toLowerCase()));
  const auditedRatio = contractTxs.length > 0 ? auditedTxs.length / contractTxs.length : 0;
  const auditedScore = clamp(Math.floor(auditedRatio * 60), 0, 60);
  raw += auditedScore;
  details.push(`${Math.floor(auditedRatio * 100)}% interactions with audited protocols (${auditedScore}/60)`);

  // Contract interaction diversity (0-60 points)
  const uniqueContracts = new Set(contractTxs.map((tx) => tx.to.toLowerCase()));
  const contractDiversity = clamp(Math.floor((uniqueContracts.size / 20) * 60), 0, 60);
  raw += contractDiversity;
  details.push(`${uniqueContracts.size} unique contracts interacted with (${contractDiversity}/60)`);

  const score = clamp(raw, 0, maxScore);
  return { name: "Transaction Quality", score, maxScore, weight: 0.2, weightedScore: score, details: details.join("; ") };
}

// --- Dimension 4: Asset Health (15%, max 135 points) ---
function scoreAssetHealth(data: WalletData): DimensionScore {
  const maxScore = 135;
  let raw = 0;
  const details: string[] = [];

  // BNB balance (0-45 points)
  const bnbBalance = parseFloat(data.balance || "0") / 1e18 || 0;
  const bnbScore = clamp(Math.floor((bnbBalance / 5) * 45), 0, 45);
  raw += bnbScore;
  details.push(`${bnbBalance.toFixed(4)} BNB balance (${bnbScore}/45)`);

  // Token diversity from transfers (0-45 points)
  const uniqueTokens = new Set(data.tokenTransfers.map((t) => t.contractAddress.toLowerCase()));
  const tokenDiversityScore = clamp(Math.floor((uniqueTokens.size / 10) * 45), 0, 45);
  raw += tokenDiversityScore;
  details.push(`${uniqueTokens.size} unique tokens held/transferred (${tokenDiversityScore}/45)`);

  // Stablecoin & blue-chip ratio (0-45 points)
  const blueChipTokens = new Set<string>();
  const stablecoinTokens = new Set<string>();
  for (const transfer of data.tokenTransfers) {
    const addr = transfer.contractAddress.toLowerCase();
    if (BLUE_CHIP_TOKENS[addr]) blueChipTokens.add(addr);
    if (STABLECOINS[addr]) stablecoinTokens.add(addr);
  }
  let qualityScore = 0;
  if (stablecoinTokens.size > 0) { qualityScore += 20; details.push("Stablecoin holdings detected (+20)"); }
  if (blueChipTokens.size >= 2) { qualityScore += 15; details.push("Blue-chip diversification (+15)"); }
  if (blueChipTokens.size >= 4) { qualityScore += 10; details.push("Excellent diversification (+10)"); }
  raw += qualityScore;

  const score = clamp(raw, 0, maxScore);
  return { name: "Asset Health", score, maxScore, weight: 0.15, weightedScore: score, details: details.join("; ") };
}

// --- Dimension 5: Repayment History (15%, max 135 points) ---
function scoreRepaymentHistory(data: WalletData): DimensionScore {
  const maxScore = 135;
  const details: string[] = [];

  // Since Kred is new, we use proxy signals:
  // 1. Lending protocol repayments (Venus/Aave withdrawals after deposits)
  // 2. Consistent outflows suggesting debt servicing

  let raw = 0;

  // Check for lending protocol interactions (proxy for repayment behavior)
  const lendingTxs = data.transactions.filter((tx) => {
    const to = tx.to?.toLowerCase();
    return to && (
      KNOWN_DEFI_PROTOCOLS[to]?.includes("Venus") ||
      KNOWN_DEFI_PROTOCOLS[to]?.includes("Aave") ||
      KNOWN_DEFI_PROTOCOLS[to]?.includes("Alpaca")
    );
  });

  if (lendingTxs.length > 0) {
    // Has lending history (0-67 points)
    const lendingScore = clamp(Math.floor((lendingTxs.length / 20) * 67), 0, 67);
    raw += lendingScore;
    details.push(`${lendingTxs.length} lending protocol interactions (${lendingScore}/67)`);
  } else {
    details.push("No lending protocol history found (0/67)");
  }

  // Token transfer patterns suggesting financial responsibility (0-68 points)
  // Regular outflows to same addresses = consistent behavior
  const outflowAddresses = new Map<string, number>();
  for (const tx of data.transactions) {
    if (tx.from.toLowerCase() === data.address.toLowerCase() && tx.to) {
      outflowAddresses.set(tx.to.toLowerCase(), (outflowAddresses.get(tx.to.toLowerCase()) || 0) + 1);
    }
  }
  const recurringPartners = Array.from(outflowAddresses.values()).filter((count) => count >= 3).length;
  const partnerScore = clamp(Math.floor((recurringPartners / 5) * 68), 0, 68);
  raw += partnerScore;
  details.push(`${recurringPartners} recurring transaction partners (${partnerScore}/68)`);

  const score = clamp(raw, 0, maxScore);
  return { name: "Repayment History", score, maxScore, weight: 0.15, weightedScore: score, details: details.join("; ") };
}

// --- Dimension 6: Social Verification (5%, max 45 points) ---
function scoreSocialVerification(data: WalletData): DimensionScore {
  const maxScore = 45;
  let raw = 0;
  const details: string[] = [];

  // ENS/domain ownership proxy: check for NFT-like or domain contract interactions
  const hasNFTActivity = data.tokenTransfers.some((t) => t.tokenDecimal === "0");
  if (hasNFTActivity) {
    raw += 15;
    details.push("NFT/domain activity detected (+15)");
  }

  // Governance participation: interactions with governance contracts
  const hasGovernance = data.transactions.some((tx) =>
    tx.functionName?.toLowerCase().includes("vote") ||
    tx.functionName?.toLowerCase().includes("delegate") ||
    tx.functionName?.toLowerCase().includes("propose")
  );
  if (hasGovernance) {
    raw += 15;
    details.push("Governance participation detected (+15)");
  }

  // Multi-chain indicator: internal transactions from bridges
  const hasBridge = data.transactions.some((tx) => {
    const fn = tx.functionName?.toLowerCase() || "";
    return fn.includes("bridge") || fn.includes("relay") || fn.includes("swap");
  });
  if (hasBridge) {
    raw += 15;
    details.push("Cross-chain/bridge activity detected (+15)");
  }

  if (raw === 0) {
    details.push("No social verification signals found");
  }

  const score = clamp(raw, 0, maxScore);
  return { name: "Social Verification", score, maxScore, weight: 0.05, weightedScore: score, details: details.join("; ") };
}

// --- Main Scoring Function ---
export function calculateCredScore(data: WalletData): { credScore: number; dimensions: DimensionScore[] } {
  const dimensions = [
    scoreWalletMaturity(data),
    scoreDeFiExperience(data),
    scoreTransactionQuality(data),
    scoreAssetHealth(data),
    scoreRepaymentHistory(data),
    scoreSocialVerification(data),
  ];

  // Total raw score = sum of all dimension scores (max 900)
  const totalRaw = dimensions.reduce((sum, d) => sum + d.score, 0);

  // Ensure minimum of 300
  const credScore = clamp(BASE_SCORE + Math.floor((totalRaw / 900) * 600), 300, 900);

  return { credScore, dimensions };
}
