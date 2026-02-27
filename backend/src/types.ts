export interface BSCScanTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasUsed: string;
  isError: string;
  functionName: string;
  contractAddress: string;
}

export interface BSCScanTokenTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
}

export interface BSCScanInternalTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  isError: string;
  type: string;
}

export interface WalletData {
  address: string;
  balance: string;
  transactions: BSCScanTx[];
  tokenTransfers: BSCScanTokenTx[];
  internalTxs: BSCScanInternalTx[];
}

export interface DimensionScore {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  weightedScore: number;
  details: string;
}

export interface CreditScoreResult {
  address: string;
  credScore: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  creditLimit: number;
  collateralRatio: number;
  interestRate: number;
  dimensions: DimensionScore[];
  aiReport: string;
  analyzedAt: string;
}

export const TIER_CONFIG = {
  Platinum: { min: 800, max: 900, collateralRatio: 50, creditLimit: 5000, interestRate: 2 },
  Gold: { min: 700, max: 799, collateralRatio: 75, creditLimit: 2000, interestRate: 4 },
  Silver: { min: 550, max: 699, collateralRatio: 100, creditLimit: 1000, interestRate: 6 },
  Bronze: { min: 300, max: 549, collateralRatio: 125, creditLimit: 500, interestRate: 8 },
} as const;

// Known DeFi protocol addresses on BSC
export const KNOWN_DEFI_PROTOCOLS: Record<string, string> = {
  // PancakeSwap
  "0x10ed43c718714eb63d5aa57b78b54704e256024e": "PancakeSwap Router V2",
  "0x13f4ea83d0bd40e75c8222255bc855a974568dd4": "PancakeSwap Router V3",
  "0x556b9306565093c855aea9c3e43b7bcdd55a8f40": "PancakeSwap MasterChef",
  // Venus Protocol
  "0xfd36e2c2a6789db23113685031d7f16329158384": "Venus Comptroller",
  "0xa07c5b74c9b40447a954e1466938b865b6bbea36": "Venus vBNB",
  "0xeca88125a5adbe82614ffc12d0db554e2e2867c8": "Venus vUSDC",
  "0xfd5840cd36d94d7229439859c0112a4185bc0255": "Venus vUSDT",
  // Alpaca Finance
  "0xa625ab01b08ce023b2a342dbb12a16f2c8489a8f": "Alpaca Finance",
  // Biswap
  "0x3a6d8ca21d1cf76f653a67577fa0d27453350dd8": "Biswap Router",
  // Thena
  "0xd4ae6eca985340dd434d38f470accce4dc78d109": "Thena Router",
  // Wombat
  "0x19609b03c976cca288fbdae5c21d4290e9a4add7": "Wombat Exchange",
  // Stargate
  "0x4a364f8c717caad9a442737eb7b8a55cc6cf18d8": "Stargate Router",
  // BNB Staking
  "0x0000000000000000000000000000000000002001": "BNB Staking",
  // AAVE on BSC
  "0x6807dc923806fe8fd134338eabfb4bc76a1b6219": "Aave Pool BSC",
};

// Known audited protocol addresses (broader set)
export const AUDITED_PROTOCOLS = new Set([
  "0x10ed43c718714eb63d5aa57b78b54704e256024e", // PancakeSwap V2
  "0x13f4ea83d0bd40e75c8222255bc855a974568dd4", // PancakeSwap V3
  "0xfd36e2c2a6789db23113685031d7f16329158384", // Venus
  "0xa07c5b74c9b40447a954e1466938b865b6bbea36", // Venus vBNB
  "0xeca88125a5adbe82614ffc12d0db554e2e2867c8", // Venus vUSDC
  "0xfd5840cd36d94d7229439859c0112a4185bc0255", // Venus vUSDT
  "0xa625ab01b08ce023b2a342dbb12a16f2c8489a8f", // Alpaca
  "0x3a6d8ca21d1cf76f653a67577fa0d27453350dd8", // Biswap
  "0x4a364f8c717caad9a442737eb7b8a55cc6cf18d8", // Stargate
  "0x0000000000000000000000000000000000002001", // BNB Staking
  "0x6807dc923806fe8fd134338eabfb4bc76a1b6219", // Aave
]);

// Stablecoins on BSC
export const STABLECOINS: Record<string, string> = {
  "0x55d398326f99059ff775485246999027b3197955": "USDT",
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "USDC",
  "0xe9e7cea3dedca5984780bafc599bd69add087d56": "BUSD",
  "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3": "DAI",
};

// Blue-chip tokens on BSC
export const BLUE_CHIP_TOKENS: Record<string, string> = {
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": "WBNB",
  "0x2170ed0880ac9a755fd29b2688956bd959f933f8": "ETH",
  "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c": "BTCB",
  ...STABLECOINS,
};
