# CredShield

**AI-Powered Undercollateralized BNPL Protocol on BNB Chain**

Built for BNB Hack Bengaluru 2026 | Smart Collateral for Web3 Credit & BNPL Track

## What is CredShield?

CredShield is the first undercollateralized lending and Buy Now Pay Later (BNPL) protocol on BNB Chain. It uses AI to analyze a user's real BSC mainnet transaction history — wallet age, DeFi activity, token holdings, repayment patterns — and generates an on-chain credit score (300-900) that determines borrowing power.

Users with strong on-chain history can borrow with as low as 25% collateral (vs. the standard 150%+ in DeFi), unlocking credit for the 1.4 billion unbanked people who have crypto wallets but no traditional credit history.

## Key Features

- **AI Credit Scoring** — Analyzes real BSC mainnet tx history across 6 dimensions using Claude AI
- **Undercollateralized Lending** — Borrow with 25-80% collateral based on your CredScore tier
- **Smart Collateral** — Your collateral earns yield while backing your loan
- **BNPL Checkout** — Pay-in-3 installments for on-chain purchases, merchant gets paid instantly
- **Soulbound Credit Tokens (SBT)** — Non-transferable tokens that build your on-chain credit reputation
- **Credit Tiers** — Bronze (300-499), Silver (500-649), Gold (650-799), Platinum (800-900)

## Architecture

Credit scoring reads from **BSC Mainnet** (real user history). Lending contracts execute on **BSC Testnet**.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full technical architecture.

## Deployed Contracts (BSC Testnet)

| Contract | Address |
|----------|---------|
| MockUSDT | [`0xf10BDa04E2a5ff41329Edc0d9BA8a7e52956A27D`](https://testnet.bscscan.com/address/0xf10BDa04E2a5ff41329Edc0d9BA8a7e52956A27D) |
| CredScore | [`0x6aB8B76ab4a7db790F64adE917e8029F6515e076`](https://testnet.bscscan.com/address/0x6aB8B76ab4a7db790F64adE917e8029F6515e076) |
| LendingPool | [`0x73bebEd5658B3d6d2f341035e9aA0124C7AB3f2c`](https://testnet.bscscan.com/address/0x73bebEd5658B3d6d2f341035e9aA0124C7AB3f2c) |
| SmartCollateral | [`0xaAdc99b3928898D692C59f165f6f5D3D9605affF`](https://testnet.bscscan.com/address/0xaAdc99b3928898D692C59f165f6f5D3D9605affF) |
| CreditSBT | [`0xAAA1930451fDA7c569E844a6CbE93D2B793d8103`](https://testnet.bscscan.com/address/0xAAA1930451fDA7c569E844a6CbE93D2B793d8103) |
| BNPLCheckout | [`0xE0CF917AA5463d29158EcE406BeD6D9D8EC16af8`](https://testnet.bscscan.com/address/0xE0CF917AA5463d29158EcE406BeD6D9D8EC16af8) |

## Project Structure

```
credshield/
├── contracts/           # Solidity smart contracts
│   ├── CredScore.sol        # On-chain credit registry (300-900 scores, 4 tiers)
│   ├── LendingPool.sol      # Core lending logic (deposit/borrow/repay)
│   ├── SmartCollateral.sol  # Yield-earning collateral vault
│   ├── CreditSBT.sol       # Soulbound credit tokens (ERC-721, non-transferable)
│   ├── BNPLCheckout.sol     # Buy Now Pay Later installment manager
│   └── MockUSDT.sol         # Test stablecoin for testnet
├── backend/             # Hono + TypeScript API server
│   └── src/
│       ├── bscscan.ts       # Real BSC mainnet data fetcher (NodeReal API)
│       ├── scoring.ts       # 6-dimension credit scoring algorithm
│       ├── ai-report.ts     # Claude AI credit report generator
│       ├── routes/          # API endpoints (credit, loans, bnpl, pool, collateral)
│       └── services/        # Blockchain interaction layer
├── frontend/            # Next.js 15 + TailwindCSS dashboard
│   └── src/
│       ├── app/             # Pages: dashboard, marketplace, loans, lend
│       └── components/      # Credit gauge, tier badge, checkout modal, etc.
├── scripts/deploy.js    # BSC Testnet deployment + wiring script
├── test/                # 35 contract tests (Hardhat + Chai)
└── hardhat.config.js    # Hardhat config for BSC Testnet
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, OpenZeppelin, Hardhat |
| Backend | Hono, TypeScript, viem, Anthropic Claude API |
| Frontend | Next.js 15, React 19, TailwindCSS, shadcn/ui, wagmi v2, RainbowKit, Recharts |
| Data | NodeReal API (BSC mainnet tx history), BSC RPC |
| Deployment | BSC Testnet (Chain ID: 97) |

## Getting Started

### Prerequisites

- Node.js 18+
- A BSC Testnet wallet with tBNB

### Install & Run

```bash
# Install contract dependencies
npm install

# Run tests (35/35 passing)
npm test

# Deploy to BSC Testnet
cp .env.example .env
# Add your PRIVATE_KEY to .env
npm run deploy:testnet

# Start backend
cd backend
npm install
npm run dev    # Runs on port 3001

# Start frontend
cd frontend
npm install
npm run dev    # Runs on port 3000
```

### Environment Variables

```bash
# .env (root - contracts)
PRIVATE_KEY=0x...
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.bnbchain.org:8545

# backend/.env
ANTHROPIC_API_KEY=sk-...     # For AI credit reports
PORT=3001
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credit-score/:address` | Full credit score + AI report from mainnet history |
| GET | `/api/credit-score/:address/breakdown` | Quick score breakdown (no AI report) |
| POST | `/api/loans/create` | Create undercollateralized loan |
| POST | `/api/loans/repay` | Repay loan installment |
| GET | `/api/loans/:address` | Get user's active loans |
| POST | `/api/bnpl/checkout` | BNPL purchase (pay-in-3) |
| GET | `/api/pool/stats` | Lending pool statistics |
| GET | `/api/collateral/:address` | User's collateral position + yield |

## Credit Scoring Dimensions

| Dimension | Weight | What it Measures |
|-----------|--------|-----------------|
| Wallet Maturity | 20% | Wallet age, activity consistency, transaction volume |
| DeFi Experience | 25% | Protocol diversity, lending/LP/staking activity |
| Transaction Quality | 20% | Success rate, audited protocol usage, contract diversity |
| Asset Health | 15% | BNB balance, token diversity, stablecoin/blue-chip holdings |
| Repayment History | 15% | Lending repayments, recurring transaction partners |
| Social Verification | 5% | NFT/domain activity, governance participation, bridge usage |

## Credit Tiers

| Tier | Score Range | Collateral Required | Credit Limit | Interest Rate |
|------|------------|--------------------|--------------|--------------|
| Bronze | 300-499 | 80% | $500 | 15% APR |
| Silver | 500-649 | 60% | $2,000 | 10% APR |
| Gold | 650-799 | 40% | $10,000 | 7% APR |
| Platinum | 800-900 | 25% | $50,000 | 5% APR |

## License

MIT

## Hackathon

Built for **BNB Chain x YZi Labs Hack Series: Bengaluru** (Feb 27-28, 2026)

Track: Smart Collateral for Web3 Credit & BNPL

[@BNBChain](https://twitter.com/BNBChain) #BNBHack
