import { Hono } from 'hono';
import { fetchWalletData } from '../bscscan.js';
import { calculateCredScore } from '../scoring.js';
import { generateAIReport } from '../ai-report.js';
import { TIER_CONFIG } from '../types.js';
import { setCredScore, getCredProfile, hasCredProfile, mintSBT, getUserSBTToken } from '../services/blockchain.js';

const credit = new Hono();

function getTier(score: number): 'Platinum' | 'Gold' | 'Silver' | 'Bronze' {
  if (score >= 800) return 'Platinum';
  if (score >= 700) return 'Gold';
  if (score >= 550) return 'Silver';
  return 'Bronze';
}

function getTierIndex(tier: string): number {
  if (tier === 'Platinum') return 3;
  if (tier === 'Gold') return 2;
  if (tier === 'Silver') return 1;
  return 0;
}

// POST /api/credit/score — Analyze wallet and generate AI credit score
credit.post('/score', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = body;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return c.json({ error: 'Invalid wallet address' }, 400);
    }

    const address = walletAddress as `0x${string}`;
    console.log(`[CredScore] Analyzing wallet: ${address}`);

    // 1. Fetch on-chain data from BSCScan
    const walletData = await fetchWalletData(walletAddress);
    console.log(`[CredScore] Fetched: ${walletData.transactions.length} txs`);

    // 2. Calculate CredScore
    const { credScore, dimensions } = calculateCredScore(walletData);
    const tier = getTier(credScore);
    const tierConfig = TIER_CONFIG[tier];
    console.log(`[CredScore] Score: ${credScore}, Tier: ${tier}`);

    // 3. Generate AI report
    const aiReport = await generateAIReport(walletAddress, credScore, tier, dimensions, walletData);

    // 4. Store score on-chain via CredScore contract
    const reportBytes = new TextEncoder().encode(aiReport);
    const hashBuffer = await crypto.subtle.digest('SHA-256', reportBytes);
    const hashArray = new Uint8Array(hashBuffer);
    const reportHash = ('0x' + Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;

    let txResult;
    try {
      txResult = await setCredScore(address, credScore, reportHash);
    } catch (err: any) {
      console.error('On-chain score storage failed:', err.message);
      txResult = null;
    }

    // 5. Mint SBT if user doesn't have one yet
    let sbtMinted = false;
    try {
      const existingToken = await getUserSBTToken(address);
      if (existingToken === 0n) {
        await mintSBT(address, credScore);
        sbtMinted = true;
      }
    } catch (err: any) {
      console.error('SBT mint check/mint failed:', err.message);
    }

    return c.json({
      success: true,
      data: {
        address: walletAddress,
        credScore,
        tier,
        tierIndex: getTierIndex(tier),
        creditLimit: tierConfig.creditLimit,
        collateralRatio: tierConfig.collateralRatio,
        interestRate: tierConfig.interestRate,
        dimensions,
        aiReport,
        onChainTx: txResult?.hash || null,
        sbtMinted,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Credit score error:', error);
    return c.json({ error: 'Credit scoring failed', details: error.message }, 500);
  }
});

// GET /api/credit/:address — Get existing credit profile (on-chain + fresh analysis)
credit.get('/:address', async (c) => {
  try {
    const address = c.req.param('address');

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json({ error: 'Invalid wallet address' }, 400);
    }

    // Try on-chain profile first
    let onChainProfile = null;
    try {
      const has = await hasCredProfile(address as `0x${string}`);
      if (has) {
        onChainProfile = await getCredProfile(address as `0x${string}`);
      }
    } catch (err: any) {
      console.error('On-chain profile fetch failed:', err.message);
    }

    // Always run fresh analysis
    const walletData = await fetchWalletData(address);
    const { credScore, dimensions } = calculateCredScore(walletData);
    const tier = getTier(credScore);
    const tierConfig = TIER_CONFIG[tier];

    return c.json({
      success: true,
      data: {
        address,
        credScore,
        tier,
        creditLimit: tierConfig.creditLimit,
        collateralRatio: tierConfig.collateralRatio,
        interestRate: tierConfig.interestRate,
        dimensions,
        onChainProfile,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Failed to fetch credit profile', details: error.message }, 500);
  }
});

export default credit;
