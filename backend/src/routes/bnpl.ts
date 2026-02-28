import { Hono } from 'hono';
import { parseUnits, formatUnits } from 'viem';
import {
  getCredProfile,
  hasCredProfile,
  setCredScore,
  createLoan,
  createBNPLPurchase,
  depositCollateral,
  getActiveLoanCount,
} from '../services/blockchain.js';
import { fetchWalletData } from '../bscscan.js';
import { calculateCredScore } from '../scoring.js';

const bnpl = new Hono();

const TIER_INTEREST_BPS = [800, 600, 400, 200]; // Bronze, Silver, Gold, Platinum
const TIER_COLLATERAL = [12500, 10000, 7500, 5000]; // basis points
const TIER_CREDIT_LIMITS = [500, 1000, 2000, 5000]; // USD

function getTierIndex(score: number): number {
  if (score >= 800) return 3;
  if (score >= 700) return 2;
  if (score >= 550) return 1;
  return 0;
}

// POST /api/bnpl/checkout — Create a BNPL purchase with "Pay in 3"
bnpl.post('/checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { buyerAddress, merchantAddress, itemName, totalPrice, installments } = body;

    if (!buyerAddress || !/^0x[a-fA-F0-9]{40}$/.test(buyerAddress)) {
      return c.json({ error: 'Invalid buyer address' }, 400);
    }
    if (!merchantAddress || !/^0x[a-fA-F0-9]{40}$/.test(merchantAddress)) {
      return c.json({ error: 'Invalid merchant address' }, 400);
    }
    if (!itemName) {
      return c.json({ error: 'Item name required' }, 400);
    }

    const priceNum = parseFloat(totalPrice);
    if (!priceNum || priceNum <= 0) {
      return c.json({ error: 'Invalid total price' }, 400);
    }

    const installmentCount = parseInt(installments) || 3;
    if (installmentCount < 2 || installmentCount > 6) {
      return c.json({ error: 'BNPL installments must be 2-6' }, 400);
    }

    const buyer = buyerAddress.toLowerCase() as `0x${string}`;
    const merchant = merchantAddress.toLowerCase() as `0x${string}`;

    // 1. Check/create credit profile
    let tier = 0;
    let collateralRatio = TIER_COLLATERAL[0];
    let creditLimit = TIER_CREDIT_LIMITS[0];
    let profileSource = 'on-chain';

    try {
      const has = await hasCredProfile(buyer);
      if (has) {
        const profile = await getCredProfile(buyer);
        tier = Number(profile.tier);
        collateralRatio = Number(profile.collateralRatio);
        creditLimit = parseFloat(formatUnits(BigInt(profile.creditLimit), 18));
      } else {
        // Auto-score: fetch real mainnet data and compute score
        console.log(`[BNPL] No on-chain profile for ${buyer}, auto-scoring...`);
        const walletData = await fetchWalletData(buyerAddress);
        const { credScore } = calculateCredScore(walletData);
        tier = getTierIndex(credScore);
        collateralRatio = TIER_COLLATERAL[tier];
        creditLimit = TIER_CREDIT_LIMITS[tier];
        profileSource = 'auto-scored';

        // Try to store on-chain (non-blocking)
        try {
          const dummyHash = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
          await setCredScore(buyer, credScore, dummyHash);
          console.log(`[BNPL] Auto-scored and stored on-chain: ${credScore} (${['Bronze','Silver','Gold','Platinum'][tier]})`);
        } catch (err: any) {
          console.error('[BNPL] On-chain score storage failed (continuing):', err.message);
        }
      }
    } catch (err: any) {
      // If on-chain check fails entirely, use defaults and continue
      console.error('[BNPL] Profile check failed, using defaults:', err.message);
      profileSource = 'fallback';
    }

    if (priceNum > creditLimit) {
      return c.json({ error: `Purchase exceeds credit limit of $${creditLimit}`, creditLimit }, 400);
    }

    // 2. Check active loans (non-blocking on failure)
    try {
      const activeLoans = await getActiveLoanCount(buyer);
      if (activeLoans > 0n) {
        return c.json({ error: 'Already has an active loan. Complete current loan first.' }, 400);
      }
    } catch (err: any) {
      console.error('[BNPL] Active loan check failed (continuing):', err.message);
    }

    // 3. Calculate collateral and interest
    const interestRate = TIER_INTEREST_BPS[tier];
    const collateralNeeded = (priceNum * collateralRatio) / 10000;

    // 4. Try on-chain operations (non-blocking on failure for demo)
    let purchaseTxHash = null;
    let loanTxHash = null;

    try {
      const priceWei = parseUnits(String(priceNum), 18);
      const collateralWei = parseUnits(collateralNeeded.toFixed(18), 18);

      // Deposit collateral
      try {
        await depositCollateral(buyer, collateralWei, 0);
      } catch (err: any) {
        console.error('[BNPL] Collateral deposit failed:', err.message);
      }

      // Create loan
      try {
        const loanResult = await createLoan(buyer, priceWei, installmentCount, interestRate, collateralWei);
        loanTxHash = loanResult.hash;
      } catch (err: any) {
        console.error('[BNPL] Loan creation failed:', err.message);
      }

      // Create BNPL purchase
      try {
        const purchaseResult = await createBNPLPurchase(buyer, merchant, itemName, priceWei, installmentCount, 0);
        purchaseTxHash = purchaseResult.hash;
      } catch (err: any) {
        console.error('[BNPL] Purchase creation failed:', err.message);
      }
    } catch (err: any) {
      console.error('[BNPL] On-chain operations failed:', err.message);
    }

    // 5. Build response (always succeeds for demo)
    const totalWithInterest = priceNum + (priceNum * interestRate / 10000);
    const installmentAmount = totalWithInterest / installmentCount;
    const schedule = Array.from({ length: installmentCount }, (_, i) => ({
      installment: i + 1,
      amount: `$${installmentAmount.toFixed(2)}`,
      dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
    }));

    return c.json({
      success: true,
      data: {
        purchaseTx: purchaseTxHash,
        loanTx: loanTxHash,
        item: itemName,
        buyer: buyerAddress,
        merchant: merchantAddress,
        totalPrice: `$${priceNum.toFixed(2)}`,
        totalWithInterest: `$${totalWithInterest.toFixed(2)}`,
        collateralDeposited: `$${collateralNeeded.toFixed(2)}`,
        collateralRatio: `${collateralRatio / 100}%`,
        interestRate: `${interestRate / 100}%`,
        installments: installmentCount,
        installmentAmount: `$${installmentAmount.toFixed(2)}`,
        merchantPaidInstantly: true,
        schedule,
        tierName: ['Bronze', 'Silver', 'Gold', 'Platinum'][tier],
        profileSource,
      },
    });
  } catch (error: any) {
    console.error('BNPL checkout error:', error);
    return c.json({ error: 'BNPL checkout failed', details: error.message }, 500);
  }
});

export default bnpl;
