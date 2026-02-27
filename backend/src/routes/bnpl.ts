import { Hono } from 'hono';
import { parseUnits, formatUnits } from 'viem';
import {
  getCredProfile,
  hasCredProfile,
  createLoan,
  createBNPLPurchase,
  depositCollateral,
  getActiveLoanCount,
} from '../services/blockchain.js';

const bnpl = new Hono();

const TIER_INTEREST_BPS = [800, 600, 400, 200]; // Bronze, Silver, Gold, Platinum

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

    const buyer = buyerAddress as `0x${string}`;
    const merchant = merchantAddress as `0x${string}`;

    // 1. Check credit
    const has = await hasCredProfile(buyer);
    if (!has) {
      return c.json({ error: 'No credit profile. Get scored first at POST /api/credit/score' }, 400);
    }

    const profile = await getCredProfile(buyer);
    const creditLimit = parseFloat(formatUnits(BigInt(profile.creditLimit), 18));
    if (priceNum > creditLimit) {
      return c.json({ error: `Purchase exceeds credit limit of $${creditLimit}`, creditLimit }, 400);
    }

    // 2. Check no active loan
    const activeLoans = await getActiveLoanCount(buyer);
    if (activeLoans > 0n) {
      return c.json({ error: 'Already has an active loan. Complete current loan first.' }, 400);
    }

    // 3. Calculate collateral and interest
    const tier = Number(profile.tier);
    const collateralRatio = Number(profile.collateralRatio);
    const interestRate = TIER_INTEREST_BPS[tier];
    const collateralNeeded = (priceNum * collateralRatio) / 10000;
    const priceWei = parseUnits(totalPrice, 18);
    const collateralWei = parseUnits(collateralNeeded.toFixed(18), 18);

    // 4. Deposit collateral
    try {
      await depositCollateral(buyer, collateralWei, 0);
    } catch (err: any) {
      console.error('BNPL collateral deposit failed:', err.message);
    }

    // 5. Create loan backing the purchase
    const loanResult = await createLoan(buyer, priceWei, installmentCount, interestRate, collateralWei);

    // 6. Create BNPL purchase record
    const purchaseResult = await createBNPLPurchase(buyer, merchant, itemName, priceWei, installmentCount, 0);

    // 7. Build response
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
        purchaseTx: purchaseResult.hash,
        loanTx: loanResult.hash,
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
      },
    });
  } catch (error: any) {
    console.error('BNPL checkout error:', error);
    return c.json({ error: 'BNPL checkout failed', details: error.message }, 500);
  }
});

export default bnpl;
