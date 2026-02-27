import { Hono } from 'hono';
import { getCollateralPosition } from '../services/blockchain.js';

const collateral = new Hono();

// GET /api/collateral/:address — Get collateral position with yield
collateral.get('/:address', async (c) => {
  try {
    const address = c.req.param('address') as `0x${string}`;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json({ error: 'Invalid wallet address' }, 400);
    }

    const position = await getCollateralPosition(address);

    if (!position.active) {
      return c.json({
        success: true,
        data: {
          address,
          hasActiveCollateral: false,
          message: 'No active collateral position',
        },
      });
    }

    const depositDate = new Date(Number(position.depositTimestamp) * 1000);
    const daysDeposited = Math.floor((Date.now() - depositDate.getTime()) / (1000 * 60 * 60 * 24));

    return c.json({
      success: true,
      data: {
        address,
        hasActiveCollateral: true,
        collateralAmount: position.amountFormatted,
        yieldEarned: position.currentYieldFormatted,
        totalValue: position.totalValue,
        depositDate: depositDate.toISOString(),
        daysDeposited,
        estimatedAPY: '5%',
        strategy: 'Venus Protocol Supply',
        loanId: position.loanId,
      },
    });
  } catch (error: any) {
    console.error('Collateral position error:', error);
    return c.json({ error: 'Failed to fetch collateral position', details: error.message }, 500);
  }
});

export default collateral;
