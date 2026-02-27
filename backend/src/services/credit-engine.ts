import OpenAI from 'openai';
import axios from 'axios';
import { TIER_NAMES, TIER_COLLATERAL_RATIOS, TIER_CREDIT_LIMITS, TIER_INTEREST_RATES } from '../types/index.js';
import 'dotenv/config';

const BSCSCAN_API = 'https://api-testnet.bscscan.com/api';
const BSCSCAN_KEY = process.env.BSCSCAN_API_KEY || '';

interface WalletData {
  address: string;
  balance: string;
  txCount: number;
  firstTxDate: number | null;
  lastTxDate: number | null;
  uniqueContracts: number;
  tokenTransfers: number;
  txList: any[];
}

interface CreditScoreResult {
  score: number;
  tier: number;
  tierName: string;
  collateralRatio: number;
  creditLimit: number;
  interestRate: number;
  breakdown: {
    walletMaturity: number;
    defiExperience: number;
    transactionQuality: number;
    assetHealth: number;
    repaymentHistory: number;
    socialVerification: number;
  };
  aiReport: string;
  reportHash: `0x${string}`;
}

// Fetch on-chain data from BSCScan
async function fetchWalletData(address: string): Promise<WalletData> {
  try {
    // Fetch balance and tx list in parallel
    const [balanceRes, txListRes, tokenTxRes] = await Promise.all([
      axios.get(BSCSCAN_API, {
        params: { module: 'account', action: 'balance', address, apikey: BSCSCAN_KEY },
      }),
      axios.get(BSCSCAN_API, {
        params: { module: 'account', action: 'txlist', address, startblock: 0, endblock: 99999999, sort: 'asc', apikey: BSCSCAN_KEY },
      }),
      axios.get(BSCSCAN_API, {
        params: { module: 'account', action: 'tokentx', address, startblock: 0, endblock: 99999999, sort: 'asc', apikey: BSCSCAN_KEY },
      }),
    ]);

    const balance = balanceRes.data.result || '0';
    const txList = Array.isArray(txListRes.data.result) ? txListRes.data.result : [];
    const tokenTxs = Array.isArray(tokenTxRes.data.result) ? tokenTxRes.data.result : [];

    const uniqueContracts = new Set(
      txList.filter((tx: any) => tx.to && tx.input !== '0x').map((tx: any) => tx.to.toLowerCase())
    ).size;

    return {
      address,
      balance,
      txCount: txList.length,
      firstTxDate: txList.length > 0 ? parseInt(txList[0].timeStamp) : null,
      lastTxDate: txList.length > 0 ? parseInt(txList[txList.length - 1].timeStamp) : null,
      uniqueContracts,
      tokenTransfers: tokenTxs.length,
      txList: txList.slice(0, 50), // Keep last 50 for AI analysis
    };
  } catch (error) {
    console.error('BSCScan fetch error:', error);
    // Return minimal data — the scoring will still work with defaults
    return {
      address,
      balance: '0',
      txCount: 0,
      firstTxDate: null,
      lastTxDate: null,
      uniqueContracts: 0,
      tokenTransfers: 0,
      txList: [],
    };
  }
}

// Calculate credit score from wallet data
function calculateScore(data: WalletData): CreditScoreResult['breakdown'] {
  const now = Math.floor(Date.now() / 1000);

  // 1. Wallet Maturity (max 180 pts, 20% weight)
  let walletMaturity = 0;
  if (data.firstTxDate) {
    const ageInDays = (now - data.firstTxDate) / 86400;
    walletMaturity = Math.min(180, Math.floor(ageInDays / 365 * 90)); // Max at 2 years
    // Activity recency bonus
    if (data.lastTxDate && (now - data.lastTxDate) < 30 * 86400) {
      walletMaturity = Math.min(180, walletMaturity + 30);
    }
  }

  // 2. DeFi Experience (max 225 pts, 25% weight)
  let defiExperience = 0;
  defiExperience += Math.min(100, data.uniqueContracts * 15); // Contract interactions
  defiExperience += Math.min(75, data.tokenTransfers * 5);     // Token activity
  defiExperience += Math.min(50, data.txCount * 2);            // General tx volume
  defiExperience = Math.min(225, defiExperience);

  // 3. Transaction Quality (max 180 pts, 20% weight)
  let transactionQuality = 0;
  if (data.txCount > 0) {
    // More diverse interactions = higher quality
    const diversityRatio = data.uniqueContracts / Math.max(1, data.txCount);
    transactionQuality = Math.min(180, Math.floor(diversityRatio * 300) + Math.min(80, data.txCount));
  }

  // 4. Asset Health (max 135 pts, 15% weight)
  let assetHealth = 0;
  const balanceBNB = parseFloat(data.balance) / 1e18;
  if (balanceBNB > 0) {
    assetHealth += Math.min(70, Math.floor(Math.log10(balanceBNB + 1) * 35));
    assetHealth += Math.min(35, data.tokenTransfers > 0 ? 35 : 0); // Has token diversity
    assetHealth += Math.min(30, balanceBNB > 0.1 ? 30 : Math.floor(balanceBNB * 300));
  }
  assetHealth = Math.min(135, assetHealth);

  // 5. Repayment History (max 135 pts, 15% weight) — starts at 0, grows with Kred usage
  const repaymentHistory = 0; // Will be populated from on-chain CredScore data

  // 6. Social Verification (max 45 pts, 5% weight)
  let socialVerification = 0;
  if (data.txCount > 20) socialVerification += 15; // Active participant
  if (data.uniqueContracts > 5) socialVerification += 15; // Protocol diversity
  if (data.tokenTransfers > 10) socialVerification += 15; // Token ecosystem
  socialVerification = Math.min(45, socialVerification);

  return {
    walletMaturity,
    defiExperience,
    transactionQuality,
    assetHealth,
    repaymentHistory,
    socialVerification,
  };
}

// Generate AI credit report using Claude
async function generateAIReport(
  address: string,
  data: WalletData,
  breakdown: CreditScoreResult['breakdown'],
  totalScore: number,
  tierName: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Fallback report without AI
    return `Credit Analysis for ${address.slice(0, 6)}...${address.slice(-4)}\n\n` +
      `CredScore: ${totalScore}/900 (${tierName})\n\n` +
      `Wallet Age: ${data.firstTxDate ? Math.floor((Date.now() / 1000 - data.firstTxDate) / 86400) : 0} days\n` +
      `Transactions: ${data.txCount}\n` +
      `Contracts Interacted: ${data.uniqueContracts}\n` +
      `Token Transfers: ${data.tokenTransfers}\n\n` +
      `Score Breakdown:\n` +
      `- Wallet Maturity: ${breakdown.walletMaturity}/180\n` +
      `- DeFi Experience: ${breakdown.defiExperience}/225\n` +
      `- Transaction Quality: ${breakdown.transactionQuality}/180\n` +
      `- Asset Health: ${breakdown.assetHealth}/135\n` +
      `- Repayment History: ${breakdown.repaymentHistory}/135\n` +
      `- Social Verification: ${breakdown.socialVerification}/45\n`;
  }

  try {
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    });
    const response = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are Kred's AI credit analyst. Generate a brief, professional credit report for this BNB Chain wallet.

Wallet: ${address}
Total Score: ${totalScore}/900 (${tierName} tier)

On-chain data:
- Wallet age: ${data.firstTxDate ? Math.floor((Date.now() / 1000 - data.firstTxDate) / 86400) : 0} days
- Total transactions: ${data.txCount}
- Unique contracts: ${data.uniqueContracts}
- Token transfers: ${data.tokenTransfers}
- BNB balance: ${(parseFloat(data.balance) / 1e18).toFixed(4)} BNB

Score breakdown:
- Wallet Maturity: ${breakdown.walletMaturity}/180
- DeFi Experience: ${breakdown.defiExperience}/225
- Transaction Quality: ${breakdown.transactionQuality}/180
- Asset Health: ${breakdown.assetHealth}/135
- Repayment History: ${breakdown.repaymentHistory}/135
- Social Verification: ${breakdown.socialVerification}/45

Write a 3-4 sentence credit assessment explaining WHY they got this score. Be specific about their strengths and areas for improvement. Keep it professional but friendly.`,
      }],
    });

    return response.choices[0]?.message?.content || 'Credit report generation failed.';
  } catch (error) {
    console.error('AI report error:', error);
    return `CredScore ${totalScore}/900 (${tierName}). Based on ${data.txCount} transactions across ${data.uniqueContracts} protocols.`;
  }
}

// Main credit scoring function
export async function analyzeCreditScore(walletAddress: string): Promise<CreditScoreResult> {
  // 1. Fetch on-chain data
  const walletData = await fetchWalletData(walletAddress);

  // 2. Calculate score breakdown
  const breakdown = calculateScore(walletData);

  // 3. Sum total score (minimum 300)
  const rawScore = breakdown.walletMaturity +
    breakdown.defiExperience +
    breakdown.transactionQuality +
    breakdown.assetHealth +
    breakdown.repaymentHistory +
    breakdown.socialVerification;
  const score = Math.max(300, Math.min(900, rawScore + 300)); // Base 300 + earned points

  // 4. Determine tier
  let tier: number;
  if (score >= 800) tier = 3;      // Platinum
  else if (score >= 700) tier = 2; // Gold
  else if (score >= 550) tier = 1; // Silver
  else tier = 0;                    // Bronze

  const tierName = TIER_NAMES[tier];

  // 5. Generate AI report
  const aiReport = await generateAIReport(walletAddress, walletData, breakdown, score, tierName);

  // 6. Create report hash (simple hash of report for on-chain storage)
  const encoder = new TextEncoder();
  const data = encoder.encode(aiReport);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const reportHash = ('0x' + Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;

  return {
    score,
    tier,
    tierName,
    collateralRatio: TIER_COLLATERAL_RATIOS[tier],
    creditLimit: TIER_CREDIT_LIMITS[tier],
    interestRate: TIER_INTEREST_RATES[tier],
    breakdown,
    aiReport,
    reportHash,
  };
}
