# Kred Architecture

## System Overview

Kred is a three-layer protocol that bridges off-chain AI credit analysis with on-chain lending execution.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                    │
│  Credit Dashboard │ BNPL Marketplace │ Loan Manager │ Lender   │
│                                                                 │
│  wagmi v2 + viem ──── RainbowKit ──── Recharts                 │
└────────────┬────────────────────────────┬───────────────────────┘
             │ API Calls                  │ Contract Reads/Writes
             ▼                            ▼
┌────────────────────────┐    ┌──────────────────────────────────┐
│   BACKEND (Hono API)   │    │     BSC TESTNET CONTRACTS        │
│                        │    │                                  │
│  ┌──────────────────┐  │    │  CredScore ◄─── LendingPool     │
│  │  Credit Engine   │  │    │      │              │   ▲        │
│  │                  │  │    │      ▼              ▼   │        │
│  │  BSC Mainnet ────┼──┼──► │  CreditSBT    SmartCollateral   │
│  │  (Real Tx Data)  │  │    │                    │             │
│  │       │          │  │    │  BNPLCheckout ◄────┘             │
│  │       ▼          │  │    │                                  │
│  │  6-Dimension     │  │    │  MockUSDT (test stablecoin)      │
│  │  Scoring Engine  │  │    └──────────────────────────────────┘
│  │       │          │  │
│  │       ▼          │  │
│  │  Claude AI       │  │
│  │  Report Generator│  │
│  └──────────────────┘  │
│                        │
│  Routes: /credit       │
│          /loans        │
│          /bnpl         │
│          /pool         │
│          /collateral   │
└────────────────────────┘
             │
             ▼
┌────────────────────────┐
│    BSC MAINNET         │
│    (Read-Only)         │
│                        │
│  NodeReal API          │
│  ├── External Txs      │
│  ├── ERC-20 Transfers  │
│  └── Internal Txs      │
│                        │
│  BSC RPC               │
│  ├── eth_getBalance    │
│  └── eth_getTransCount │
└────────────────────────┘
```

## Data Flow

### 1. Credit Score Generation

```
User connects wallet
        │
        ▼
Backend fetches REAL BSC Mainnet data
├── Balance via BSC RPC (free, no key)
├── Tx count via BSC RPC (free, no key)
├── Outgoing txs via NodeReal nr_getAssetTransfers
└── Incoming txs via NodeReal nr_getAssetTransfers
        │
        ▼
Scoring Engine analyzes across 6 dimensions
├── Wallet Maturity (20%)    ← age, consistency, volume
├── DeFi Experience (25%)    ← protocol diversity, lending/LP/staking
├── Transaction Quality (20%) ← success rate, audited protocols
├── Asset Health (15%)        ← BNB balance, token diversity
├── Repayment History (15%)   ← lending repayments, recurring partners
└── Social Verification (5%)  ← NFTs, governance, bridges
        │
        ▼
CredScore computed: 300-900
Tier assigned: Bronze/Silver/Gold/Platinum
        │
        ▼
Claude AI generates human-readable credit report
        │
        ▼
Score + report hash stored on-chain (CredScore.sol)
Soulbound Credit Token minted (CreditSBT.sol)
```

### 2. Undercollateralized Loan Flow

```
Borrower requests loan
        │
        ▼
CredScore.sol checks credit profile
├── Score determines collateral ratio (25-80%)
├── Tier determines credit limit ($500-$50,000)
└── Interest rate set by tier (5-15% APR)
        │
        ▼
Borrower deposits reduced collateral
├── SmartCollateral.sol accepts deposit
├── Collateral earns yield (8% APR simulated)
└── Yield tracked and claimable on repayment
        │
        ▼
LendingPool.sol creates loan
├── Funds disbursed from lending pool
├── Installment schedule created (3-12 months)
└── CredScore.setAuthorized enables score updates
        │
        ▼
Borrower repays installments
├── Each repayment recorded on-chain
├── CredScore boosted on successful repayment
├── CreditSBT streak counter incremented
└── On final payment: collateral + yield returned
```

### 3. BNPL Purchase Flow

```
Buyer selects product in marketplace
        │
        ▼
Checkout with "Pay in 3 installments"
        │
        ▼
BNPLCheckout.sol creates purchase record
├── Merchant receives full payment instantly
├── LendingPool creates micro-loan for buyer
├── SmartCollateral locks reduced collateral
└── 3 installment schedule created
        │
        ▼
Buyer repays 3 installments over time
├── Each payment: BNPLCheckout.recordInstallmentPaid()
├── Final payment: loan closed, collateral returned
└── Credit score updated based on repayment success
```

## Smart Contract Architecture

### Contract Relationships

```
                    ┌──────────────┐
                    │  CredScore   │
                    │              │
                    │ score: 300-900
                    │ tier: 0-3    │
                    │ creditLimit  │
                    │ collateralRatio
                    └──────┬───────┘
                           │ reads score
                           ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│  CreditSBT   │   │ LendingPool  │──▶│ SmartCollateral   │
│              │   │              │   │                  │
│ ERC-721 (SBT)│   │ deposits[]   │   │ deposits[]       │
│ non-transfer │   │ loans[]      │   │ yield tracking   │
│ history      │   │ installments │   │ seize on default │
│ streaks      │   │              │   │                  │
└──────────────┘   └──────┬───────┘   └──────────────────┘
                          │ linked
                          ▼
                   ┌──────────────┐
                   │ BNPLCheckout │
                   │              │
                   │ purchases[]  │
                   │ installments │
                   │ merchant pay │
                   └──────────────┘
```

### CredScore.sol

- Stores credit profiles: score (300-900), tier (Bronze-Platinum), credit limits, collateral ratios
- Records loan outcomes (success/failure) and adjusts scores accordingly
- Only authorized contracts (LendingPool) can update scores
- Emits `ScoreUpdated` events for off-chain indexing
- Maps scores to interest rates: Platinum 500bp, Gold 700bp, Silver 1000bp, Bronze 1500bp

### LendingPool.sol

- Core lending engine accepting USDT deposits from lenders
- Creates loans with undercollateralized amounts based on CredScore tier
- Tracks installment payments with due dates
- Integrates with SmartCollateral for collateral management
- Tracks pool-level stats: totalDeposits, totalBorrowed, loansIssued, loansRepaid
- Enforces one active loan per borrower

### SmartCollateral.sol

- Accepts collateral deposits linked to specific loans
- Simulates yield generation (8% APR) on deposited collateral
- Returns collateral + accrued yield on loan completion
- Seizes collateral on loan default (transfers to pool)
- Only LendingPool can trigger seize operations

### CreditSBT.sol

- ERC-721 with transfer restrictions (soulbound)
- One token per address, tracks complete credit history
- Records: loans completed, loans failed, total borrowed/repaid
- Maintains streak counters (current + longest) for consecutive repayments
- Score validation: rejects initial scores outside 300-900 range

### BNPLCheckout.sol

- Manages BNPL purchases with installment tracking
- Supports 3, 6, or 12 installment schedules
- Links each purchase to a LendingPool loan
- Tracks buyer and merchant purchase histories
- Records aggregate stats: total purchases, total volume

## Backend Architecture

### API Layer (Hono)

```
src/
├── index.ts              # Server entry point (port 3001)
├── config.ts             # Environment config
├── bscscan.ts            # BSC Mainnet data fetcher (NodeReal API)
├── scoring.ts            # 6-dimension credit scoring algorithm
├── ai-report.ts          # Claude AI report generator
├── types.ts              # Shared type definitions
├── routes/
│   ├── credit.ts         # GET /api/credit-score/:address
│   ├── loans.ts          # POST /api/loans/create, /repay, GET /:address
│   ├── bnpl.ts           # POST /api/bnpl/checkout
│   ├── pool.ts           # GET /api/pool/stats
│   └── collateral.ts     # GET /api/collateral/:address
├── services/
│   ├── blockchain.ts     # viem client for BSC Testnet contract calls
│   └── credit-engine.ts  # Orchestrates scoring + on-chain storage
└── config/
    ├── chain.ts          # BSC Testnet chain config
    └── contracts.ts      # Contract addresses + ABIs
```

### Data Sources

| Source | Network | Purpose | Auth |
|--------|---------|---------|------|
| NodeReal `nr_getAssetTransfers` | BSC Mainnet | Real tx history (external, ERC-20, internal) | Free tier |
| BSC RPC `eth_getBalance` | BSC Mainnet | Wallet BNB balance | None needed |
| BSC RPC `eth_getTransactionCount` | BSC Mainnet | Wallet nonce (tx count) | None needed |
| Claude API | N/A | AI-generated credit reports | API key |
| BSC Testnet RPC | BSC Testnet | Contract reads/writes | Private key |

### Known DeFi Protocols (Scoring)

The scoring engine recognizes interactions with major BSC protocols:
- **DEXes**: PancakeSwap, Biswap, Thena, DODO
- **Lending**: Venus, Alpaca Finance, Radiant
- **Bridges**: Multichain, Stargate, cBridge
- **Staking**: Various MasterChef contracts

## Frontend Architecture

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Credit Dashboard | `/` | Score gauge (SVG animated), radar chart breakdown, AI report, tier badge |
| BNPL Marketplace | `/marketplace` | 8 products, category filters, Pay-in-3 checkout modal |
| Loan Management | `/loans` | Active loan cards, progress bars, payment history timeline |
| Lender Dashboard | `/lend` | Deposit/withdraw, pool stats, APY history chart |

### Component Tree

```
Layout
├── Header (wallet connect via RainbowKit)
├── Sidebar (navigation)
└── Page Content
    ├── Credit Dashboard
    │   ├── ScoreGauge (animated SVG arc, 300-900)
    │   ├── TierBadge (Bronze/Silver/Gold/Platinum)
    │   ├── ScoreBreakdown (Recharts radar chart)
    │   └── AIReport (Claude-generated analysis)
    ├── Marketplace
    │   ├── ProductCard (price, category, BNPL badge)
    │   └── CheckoutModal (installment schedule, collateral calc)
    ├── Loans
    │   └── LoanCard (progress bar, payments, collateral yield)
    └── Lender
        ├── DepositForm / WithdrawForm
        ├── PoolStats (TVL, utilization, APY)
        └── APYChart (Recharts area chart)
```

### Web3 Stack

- **wagmi v2** — React hooks for contract reads/writes
- **viem** — TypeScript Ethereum client
- **RainbowKit** — Wallet connection UI (MetaMask, WalletConnect, etc.)
- **BSC Testnet** — Chain ID 97

## Security Considerations

1. **Credit score manipulation** — Only authorized contracts can update scores. Owner sets authorization.
2. **Soulbound enforcement** — CreditSBT overrides `_update` to block all transfers except mint/burn.
3. **Collateral safety** — Only LendingPool can trigger collateral seizure via `onlyLendingPool` modifier.
4. **One loan per user** — LendingPool enforces single active loan to prevent over-borrowing.
5. **Score bounds** — Hardcoded 300-900 range prevents score overflow/underflow.
6. **Mainnet vs Testnet separation** — Credit analysis is read-only on mainnet; no mainnet funds are ever touched.

## Future Improvements

- Chainlink price feeds for dynamic collateral valuation
- Venus Protocol integration for real yield on collateral
- Multi-chain credit scoring (Ethereum, Polygon, Arbitrum history)
- ZK proofs for privacy-preserving credit verification
- Governance token for protocol parameter voting
- Liquidation bot for defaulted positions
