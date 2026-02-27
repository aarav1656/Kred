import { createPublicClient, createWalletClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

// BSC Testnet chain definition
export const bscTestnet = defineChain({
  id: 97,
  name: 'BNB Smart Chain Testnet',
  nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://testnet.bscscan.com' },
  },
  testnet: true,
});

// Public client for read operations
export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545'),
});

// Wallet client for write operations (backend is contract owner)
export function getWalletClient() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not set in environment');
  }
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545'),
  });
}

export function getAccount() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not set in environment');
  }
  return privateKeyToAccount(privateKey as `0x${string}`);
}
