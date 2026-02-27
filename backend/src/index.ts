import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import 'dotenv/config';

// Legacy credit scoring endpoints (existing)
import { fetchWalletData } from './bscscan.js';
import { calculateCredScore } from './scoring.js';
import { generateAIReport } from './ai-report.js';
import { TIER_CONFIG } from './types.js';
import type { CreditScoreResult } from './types.js';

// New modular routes
import credit from './routes/credit.js';
import loans from './routes/loans.js';
import bnpl from './routes/bnpl.js';
import pool from './routes/pool.js';
import collateral from './routes/collateral.js';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// ========================
// Health check / API docs
// ========================
app.get('/', (c) => {
  return c.json({
    name: 'CredShield API',
    version: '1.0.0',
    description: 'AI-Powered Undercollateralized BNPL Protocol on BNB Chain',
    chain: 'BSC Testnet (chainId: 97)',
    endpoints: {
      credit: {
        'POST /api/credit/score': 'Analyze wallet and generate AI credit score (stores on-chain)',
        'GET /api/credit/:address': 'Get credit profile with fresh analysis',
        'GET /api/credit-score/:address': 'Quick credit score (legacy, no on-chain storage)',
        'GET /api/credit-score/:address/breakdown': 'Score breakdown only (fast, no AI report)',
      },
      loans: {
        'POST /api/loans/create': 'Create a new loan with collateral',
        'POST /api/loans/repay': 'Repay a loan installment',
        'GET /api/loans/:address': 'Get user loans with installment schedule',
      },
      bnpl: {
        'POST /api/bnpl/checkout': 'BNPL checkout — Pay in installments',
      },
      pool: {
        'GET /api/pool/stats': 'Lending pool statistics',
      },
      collateral: {
        'GET /api/collateral/:address': 'Collateral position with yield earned',
      },
    },
  });
});

// ========================
// Legacy credit scoring endpoints (kept for backward compat)
// ========================
function getTier(score: number): 'Platinum' | 'Gold' | 'Silver' | 'Bronze' {
  if (score >= 800) return 'Platinum';
  if (score >= 700) return 'Gold';
  if (score >= 550) return 'Silver';
  return 'Bronze';
}

app.get('/api/credit-score/:address', async (c) => {
  const address = c.req.param('address');
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return c.json({ error: 'Invalid BSC wallet address' }, 400);
  }

  try {
    console.log(`[CredScore] Analyzing wallet: ${address}`);
    const startTime = Date.now();

    const walletData = await fetchWalletData(address);
    const { credScore, dimensions } = calculateCredScore(walletData);
    const tier = getTier(credScore);
    const tierConfig = TIER_CONFIG[tier];
    const aiReport = await generateAIReport(address, credScore, tier, dimensions, walletData);

    const elapsed = Date.now() - startTime;
    console.log(`[CredScore] Done in ${elapsed}ms — Score: ${credScore}, Tier: ${tier}`);

    const result: CreditScoreResult = {
      address,
      credScore,
      tier,
      creditLimit: tierConfig.creditLimit,
      collateralRatio: tierConfig.collateralRatio,
      interestRate: tierConfig.interestRate,
      dimensions,
      aiReport,
      analyzedAt: new Date().toISOString(),
    };

    return c.json(result);
  } catch (err) {
    console.error('[CredScore] Error:', err);
    return c.json({ error: 'Failed to analyze wallet', details: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

// Batch scoring (multiple wallets)
app.post('/api/credit-score/batch', async (c) => {
  const body = await c.req.json<{ addresses: string[] }>();
  if (!body.addresses || !Array.isArray(body.addresses) || body.addresses.length === 0) {
    return c.json({ error: 'Provide an array of addresses' }, 400);
  }
  if (body.addresses.length > 5) {
    return c.json({ error: 'Maximum 5 addresses per batch' }, 400);
  }
  const results = await Promise.all(
    body.addresses.map(async (address) => {
      try {
        const walletData = await fetchWalletData(address);
        const { credScore, dimensions } = calculateCredScore(walletData);
        const tier = getTier(credScore);
        const tierConfig = TIER_CONFIG[tier];
        return { address, credScore, tier, creditLimit: tierConfig.creditLimit, collateralRatio: tierConfig.collateralRatio };
      } catch {
        return { address, error: 'Failed to analyze' };
      }
    })
  );
  return c.json({ results });
});

app.get('/api/credit-score/:address/breakdown', async (c) => {
  const address = c.req.param('address');
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return c.json({ error: 'Invalid BSC wallet address' }, 400);
  }

  try {
    const walletData = await fetchWalletData(address);
    const { credScore, dimensions } = calculateCredScore(walletData);
    const tier = getTier(credScore);
    const tierConfig = TIER_CONFIG[tier];

    return c.json({
      address,
      credScore,
      tier,
      creditLimit: tierConfig.creditLimit,
      collateralRatio: tierConfig.collateralRatio,
      interestRate: tierConfig.interestRate,
      dimensions,
    });
  } catch (err) {
    return c.json({ error: 'Failed to analyze wallet' }, 500);
  }
});

// ========================
// New modular API routes
// ========================
app.route('/api/credit', credit);
app.route('/api/loans', loans);
app.route('/api/bnpl', bnpl);
app.route('/api/pool', pool);
app.route('/api/collateral', collateral);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Endpoint not found', docs: 'GET / for API documentation' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

// Start server
const port = parseInt(process.env.PORT || '3001');
console.log(`
╔═══════════════════════════════════════════════════════╗
║           CredShield API Server                       ║
║           AI-Powered BNPL Protocol on BNB Chain       ║
╠═══════════════════════════════════════════════════════╣
║  Port: ${port}                                          ║
║  Docs: http://localhost:${port}/                         ║
╚═══════════════════════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port });
