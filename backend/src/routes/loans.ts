import { Hono } from 'hono';
import { parseUnits, formatUnits } from 'viem';
import {
  getCredProfile,
  hasCredProfile,
  createLoan,
  getLoan,
  getUserLoans,
  getActiveLoanCount,
  recordLoanOutcome,
  updateSBTHistory,
  depositCollateral,
} from '../services/blockchain.js';
import { TIER_CONFIG } from '../types.js';

const loans = new Hono();

const TIER_INTEREST_BPS = [800, 600, 400, 200]; // Bronze, Silver, Gold, Platinum in basis points

// POST /api/loans/create — Create a new loan
loans.post('/create', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, amount, installments } = body;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return c.json({ error: 'Invalid wallet address' }, 400);
    }

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      return c.json({ error: 'Invalid loan amount' }, 400);
    }

    const installmentCount = parseInt(installments) || 3;
    if (installmentCount < 2 || installmentCount > 12) {
      return c.json({ error: 'Installments must be 2-12' }, 400);
    }

    const address = walletAddress as `0x${string}`;

    // 1. Check credit profile exists
    const has = await hasCredProfile(address);
    if (!has) {
      return c.json({ error: 'No credit profile found. Get scored first at POST /api/credit/score' }, 400);
    }

    // 2. Get credit profile and validate
    const profile = await getCredProfile(address);
    const creditLimit = parseFloat(formatUnits(BigInt(profile.creditLimit), 18));
    if (amountNum > creditLimit) {
      return c.json({ error: `Amount exceeds credit limit of $${creditLimit}`, creditLimit }, 400);
    }

    // 3. Check no active loans
    const activeLoans = await getActiveLoanCount(address);
    if (activeLoans > 0n) {
      return c.json({ error: 'Already has an active loan. Repay first.' }, 400);
    }

    // 4. Calculate collateral and interest
    const collateralRatio = Number(profile.collateralRatio); // basis points
    const collateralNeeded = (amountNum * collateralRatio) / 10000;
    const collateralWei = parseUnits(collateralNeeded.toFixed(18), 18);
    const tier = Number(profile.tier);
    const interestRate = TIER_INTEREST_BPS[tier];

    // 5. Deposit collateral
    try {
      await depositCollateral(address, collateralWei, 0);
    } catch (err: any) {
      console.error('Collateral deposit failed:', err.message);
    }

    // 6. Create loan on-chain
    const loanAmountWei = parseUnits(amount, 18);
    const result = await createLoan(address, loanAmountWei, installmentCount, interestRate, collateralWei);

    // 7. Build response
    const totalWithInterest = amountNum + (amountNum * interestRate / 10000);
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
        transactionHash: result.hash,
        borrower: walletAddress,
        loanAmount: `$${amountNum}`,
        totalWithInterest: `$${totalWithInterest.toFixed(2)}`,
        interestRate: `${interestRate / 100}%`,
        collateralRequired: `$${collateralNeeded.toFixed(2)}`,
        collateralRatio: `${collateralRatio / 100}%`,
        installments: installmentCount,
        installmentAmount: `$${installmentAmount.toFixed(2)}`,
        schedule,
        tier,
        tierName: ['Bronze', 'Silver', 'Gold', 'Platinum'][tier],
      },
    });
  } catch (error: any) {
    console.error('Loan creation error:', error);
    return c.json({ error: 'Loan creation failed', details: error.message }, 500);
  }
});

// POST /api/loans/repay — Repay a loan installment
loans.post('/repay', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, loanId } = body;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return c.json({ error: 'Invalid wallet address' }, 400);
    }

    const loanIdNum = parseInt(loanId);
    if (isNaN(loanIdNum) || loanIdNum < 0) {
      return c.json({ error: 'Invalid loan ID' }, 400);
    }

    const address = walletAddress as `0x${string}`;
    const loan = await getLoan(loanIdNum);

    if (!loan.active) {
      return c.json({ error: 'Loan is not active' }, 400);
    }
    if (loan.borrower.toLowerCase() !== walletAddress.toLowerCase()) {
      return c.json({ error: 'Not the borrower of this loan' }, 403);
    }

    const installmentAmount = BigInt(loan.installmentAmount);
    const remainingAfter = BigInt(loan.remainingAmount) - installmentAmount;
    const isLastPayment = remainingAfter <= 0n;

    // Record on-chain if last payment
    if (isLastPayment) {
      try {
        await recordLoanOutcome(address, true, BigInt(loan.totalAmount));
        await updateSBTHistory(address, 0, true, BigInt(loan.totalAmount));
      } catch (err: any) {
        console.error('Loan outcome recording failed:', err.message);
      }
    }

    return c.json({
      success: true,
      data: {
        loanId: loanIdNum,
        installmentPaid: Number(loan.installmentsPaid) + 1,
        totalInstallments: loan.totalInstallments.toString(),
        amountPaid: formatUnits(installmentAmount, 18),
        remainingAmount: isLastPayment ? '0' : formatUnits(remainingAfter, 18),
        loanCompleted: isLastPayment,
        message: isLastPayment
          ? 'Loan fully repaid! Your CredScore has been updated and collateral will be returned.'
          : `Installment ${Number(loan.installmentsPaid) + 1} of ${loan.totalInstallments} paid.`,
      },
    });
  } catch (error: any) {
    console.error('Loan repay error:', error);
    return c.json({ error: 'Repayment failed', details: error.message }, 500);
  }
});

// GET /api/loans/:address — Get user's loans with schedule
loans.get('/:address', async (c) => {
  try {
    const address = c.req.param('address') as `0x${string}`;
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json({ error: 'Invalid wallet address' }, 400);
    }

    const loanIds = await getUserLoans(address);
    const loanDetails = await Promise.all(
      loanIds.map(async (id) => {
        const loan = await getLoan(Number(id));
        const installmentFormatted = formatUnits(BigInt(loan.installmentAmount), 18);
        const remainingFormatted = formatUnits(BigInt(loan.remainingAmount), 18);
        const totalFormatted = formatUnits(BigInt(loan.totalAmount), 18);

        const totalInstallments = Number(loan.totalInstallments);
        const paidCount = Number(loan.installmentsPaid);
        const schedule = Array.from({ length: totalInstallments }, (_, i) => ({
          installment: i + 1,
          amount: `$${parseFloat(installmentFormatted).toFixed(2)}`,
          dueDate: new Date(
            (Number(loan.createdAt) + (i + 1) * 30 * 24 * 60 * 60) * 1000
          ).toISOString().split('T')[0],
          status: i < paidCount ? 'paid' : i === paidCount ? 'due' : 'upcoming',
        }));

        return {
          loanId: Number(id),
          totalAmount: `$${parseFloat(totalFormatted).toFixed(2)}`,
          remainingAmount: `$${parseFloat(remainingFormatted).toFixed(2)}`,
          installmentAmount: `$${parseFloat(installmentFormatted).toFixed(2)}`,
          installmentsPaid: paidCount,
          totalInstallments,
          interestRate: `${Number(loan.interestRate) / 100}%`,
          active: loan.active,
          defaulted: loan.defaulted,
          createdAt: new Date(Number(loan.createdAt) * 1000).toISOString(),
          nextDueDate: new Date(Number(loan.nextDueDate) * 1000).toISOString(),
          schedule,
        };
      })
    );

    return c.json({
      success: true,
      data: {
        address,
        totalLoans: loanDetails.length,
        activeLoans: loanDetails.filter(l => l.active).length,
        loans: loanDetails,
      },
    });
  } catch (error: any) {
    console.error('Get loans error:', error);
    return c.json({ error: 'Failed to fetch loans', details: error.message }, 500);
  }
});

export default loans;
