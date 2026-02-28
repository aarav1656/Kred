# Kred — Presentation Script (10 Slides)

## Slide 1: Title
**Kred**
*Your on-chain reputation is your new credit card.*

AI-Powered Undercollateralized Lending & BNPL on BNB Chain

BNB Hack Bengaluru 2026 | Smart Collateral for Web3 Credit & BNPL

---

## Slide 2: The Problem
**DeFi has a $200B credit problem.**

- 1.4 billion people have crypto wallets but ZERO credit history
- Borrowing $100 in DeFi? Lock up $150+. That's the standard.
- Aave, Venus, Compound — all require 130-200% overcollateralization
- No credit scoring exists on-chain. A 5-year DeFi veteran gets the same terms as a day-1 wallet.
- No Buy Now Pay Later in Web3. Zero installment payments for on-chain commerce.

**Result: A credit desert where your on-chain history means nothing.**

*Speaker notes: "Imagine you've been responsibly using DeFi for 3 years — hundreds of transactions, multiple protocols, perfect repayment history. You go to borrow $1,000 and you're told: deposit $1,500 first. That's the reality today. Your reputation counts for nothing."*

---

## Slide 3: The Solution
**Kred — AI credit scoring meets undercollateralized lending.**

Your BSC mainnet transaction history → AI analysis → CredScore (300-900) → Borrow with 25-80% collateral

Flow:
1. Connect wallet
2. AI analyzes your REAL BSC mainnet history (not testnet, not mocks)
3. Get a CredScore across 6 dimensions
4. Borrow with reduced collateral OR use BNPL for purchases
5. Every repayment improves your score

**The key insight: Your on-chain history IS your credit history. We just need AI to read it.**

*Speaker notes: "We don't ask users to fill out forms or KYC. We read what's already there — your real BSC mainnet transactions. The more responsible your history, the less collateral you need."*

---

## Slide 4: How It Works — Credit Scoring
**6-Dimension AI Credit Analysis**

| Dimension | Weight | What We Analyze |
|-----------|--------|----------------|
| Wallet Maturity | 20% | How old is the wallet? Recent activity? |
| DeFi Experience | 25% | How many protocols? Lending? LP? Staking? |
| Transaction Quality | 20% | Success rate? Contract diversity? |
| Asset Health | 15% | BNB balance? Token diversity? |
| Repayment History | 15% | Previous loan repayments? |
| Social Verification | 5% | NFTs? Governance? Bridge usage? |

**Score: 300-900** (just like traditional FICO)
**Data source: Real BSC Mainnet** via NodeReal API — not simulated, not mock data.

*Speaker notes: "We analyze real mainnet transactions. During this demo, if you connect your wallet, you'll see YOUR actual score based on YOUR real transaction history. This isn't staged."*

---

## Slide 5: Credit Tiers & Benefits
**Higher score = Less collateral = More credit**

| Tier | Score | Collateral | Credit Limit | Interest |
|------|-------|-----------|--------------|----------|
| 🥉 Bronze | 300-499 | 80% | $500 | 15% APR |
| 🥈 Silver | 500-649 | 60% | $2,000 | 10% APR |
| 🥇 Gold | 650-799 | 40% | $10,000 | 7% APR |
| 💎 Platinum | 800-900 | 25% | $50,000 | 5% APR |

**Compare:** Aave requires 130-200% collateral for EVERYONE.
**Kred:** A Platinum user borrows $1,000 with just $250 collateral.

Plus: Your collateral **earns 8% APR yield** while backing your loan.

*Speaker notes: "A Gold-tier user deposits $400 to borrow $1,000. That $400 earns yield while it sits there. When they repay, they get their collateral back PLUS the yield earned. This is Smart Collateral."*

---

## Slide 6: Key Features
**What makes Kred unique**

1. **AI Credit Reports** — Not just a number. Full AI-generated analysis explaining WHY you got your score. Powered by OpenRouter (multi-model).

2. **Smart Collateral** — Your collateral isn't just locked. It earns 8% APR. You get principal + yield back when you repay.

3. **BNPL Checkout** — Browse marketplace. Pick a product. Pay in 3 installments. Merchant gets paid instantly, you pay over time.

4. **Soulbound Credit Tokens (SBT)** — Non-transferable ERC-721 tokens on BSC. Can't be bought, sold, or transferred. They represent YOUR reputation.

5. **Credit Building** — Every on-time repayment boosts your CredScore. Start at Bronze, work your way to Platinum.

*Speaker notes: "The Soulbound Token is key — it's non-transferable. You can't buy someone else's credit score. It's earned through real behavior, stored permanently on-chain."*

---

## Slide 7: Architecture & Tech Stack
**Three-layer protocol, two-chain design**

```
BSC Mainnet (READ-ONLY)          BSC Testnet (EXECUTION)
┌─────────────────────┐          ┌─────────────────────┐
│ Real Tx History     │          │ 6 Smart Contracts   │
│ NodeReal API        │ ──AI──→ │ CredScore           │
│ Balance, Tokens     │  Score   │ LendingPool         │
│ DeFi Activity       │          │ SmartCollateral     │
└─────────────────────┘          │ CreditSBT           │
                                 │ BNPLCheckout        │
Frontend ← Hono API → Backend   │ MockUSDT            │
Next.js 15  OpenRouter  viem    └─────────────────────┘
```

**Smart Contracts:** Solidity 0.8.24 + OpenZeppelin
**Backend:** Hono + TypeScript + viem
**Frontend:** Next.js 15 + React 19 + wagmi v2 + RainbowKit
**AI:** OpenRouter (multi-model) for credit reports
**Data:** NodeReal API for real BSC mainnet history
**Tests:** 35/35 passing (Hardhat + Chai)
**Infra:** Docker (docker-compose up runs everything)

*Speaker notes: "The architecture separation is deliberate. We READ from mainnet — your real history. We EXECUTE on testnet — the lending contracts. No mainnet funds are ever touched by our contracts."*

---

## Slide 8: Live Demo
**[LIVE DEMO — 2 minutes]**

1. Open Kred dashboard → Connect MetaMask
2. Watch CredScore load from REAL BSC mainnet history
3. Show the AI credit report — personalized analysis
4. Show the radar chart — 6 dimensions visualized
5. Browse BNPL marketplace — 8 products
6. Show "Pay in 3" checkout flow
7. Show lender dashboard — pool stats, APY chart

**Contract on BSCScan:**
`0x6aB8B76ab4a7db790F64adE917e8029F6515e076` (CredScore)

*Speaker notes: "This is live. I'm connecting my real wallet. The score you see is based on my actual BSC mainnet transaction history — not mock data. Let me walk through the flow..."*

---

## Slide 9: Market & Traction
**Why now? Why BNB Chain?**

**Market:**
- $200B+ locked as overcollateral across DeFi
- BNPL market growing 25% YoY (traditional fintech)
- Zero undercollateralized lending protocols on BSC

**Why BNB Chain:**
- Largest EVM-compatible L1 by daily active users
- Low gas fees make BNPL installments economical
- Rich on-chain data for credit scoring (PancakeSwap, Venus, etc.)
- opBNB L2 ready for micro-transaction BNPL

**Built during hackathon:**
- 6 smart contracts deployed on BSC Testnet
- 35/35 tests passing
- Real mainnet credit scoring working
- Full-stack frontend with 4 pages
- Docker support

*Speaker notes: "There is literally zero competition in this track. No one else is doing undercollateralized lending on BSC with AI credit scoring. We're first."*

---

## Slide 10: Roadmap & Vision
**From hackathon to credit layer of BNB Chain**

**Month 1-2:** Protocol Hardening
- Chainlink price feeds for collateral valuation
- Venus Protocol integration for real yield
- Liquidation bot + BSC Mainnet deployment

**Month 3-4:** Ecosystem Growth
- Launch on opBNB for micro-BNPL
- BNB Greenfield for decentralized credit storage
- Open CredScore API — let any BSC protocol query credit
- Merchant SDK for dApp BNPL integration

**Month 5-6:** Scale
- Multi-chain credit aggregation (BSC as primary)
- ZK credit proofs for privacy
- $KRED governance token
- Target: $5M TVL, 10K scored wallets, 50+ merchants

**Vision:** Kred becomes the credit layer of BNB Chain. Every lending protocol, every marketplace, every dApp can query a user's CredScore. One score, infinite use cases.

*Speaker notes: "Our vision is simple — Kred becomes to BNB Chain what FICO is to traditional finance. A universal credit score that any protocol can read. We start with lending and BNPL, but the CredScore is composable — any BSC dApp can use it."*
