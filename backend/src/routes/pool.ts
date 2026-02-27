import { Hono } from 'hono';
import { getPoolStats } from '../services/blockchain.js';

const pool = new Hono();

// GET /api/pool/stats — Lending pool statistics
pool.get('/stats', async (c) => {
  try {
    const stats = await getPoolStats();

    return c.json({
      success: true,
      data: {
        totalDeposits: stats.totalDepositsFormatted,
        totalBorrowed: stats.totalBorrowedFormatted,
        availableLiquidity: stats.availableFormatted,
        utilizationRate: `${stats.utilizationRate.toFixed(2)}%`,
        totalLoansIssued: stats.loansIssued,
        totalLoansRepaid: stats.loansRepaid,
        // Protocol info
        protocol: {
          name: 'CredShield Lending Pool',
          chain: 'BNB Smart Chain Testnet',
          stablecoin: 'USDT',
          maxUtilization: '80%',
          lenderAPY: '5-12%',
        },
      },
    });
  } catch (error: any) {
    console.error('Pool stats error:', error);
    return c.json({ error: 'Failed to fetch pool stats', details: error.message }, 500);
  }
});

export default pool;
