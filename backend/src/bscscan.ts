import axios from "axios";
import type { BSCScanTx, BSCScanTokenTx, BSCScanInternalTx, WalletData } from "./types.js";

const BSC_RPC = "https://bsc-dataseed.bnbchain.org";
const NODEREAL_RPC = "https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3";

// --- BSC RPC: balance (free, no key) ---
async function getRealBalance(address: string): Promise<string> {
  try {
    const { data } = await axios.post(BSC_RPC, {
      jsonrpc: "2.0", method: "eth_getBalance", params: [address, "latest"], id: 1,
    }, { timeout: 10000 });
    return data.result ? BigInt(data.result).toString() : "0";
  } catch { return "0"; }
}

// --- BSC RPC: tx count (free, no key) ---
async function getRealTxCount(address: string): Promise<number> {
  try {
    const { data } = await axios.post(BSC_RPC, {
      jsonrpc: "2.0", method: "eth_getTransactionCount", params: [address, "latest"], id: 1,
    }, { timeout: 10000 });
    return data.result ? Number(BigInt(data.result)) : 0;
  } catch { return 0; }
}

// --- NodeReal: real mainnet tx history (free tier) ---
interface NodeRealTransfer {
  category: string;
  blockNum: string;
  from: string;
  to: string;
  value: string;
  asset: string;
  name: string;
  hash: string;
  contractAddress: string;
  blockTimeStamp: number;
  gasPrice: number;
  gasUsed: number;
  receiptsStatus: number;
  gas: number;
  input: string;
}

async function fetchNodeRealTransfers(address: string, direction: "from" | "to"): Promise<NodeRealTransfer[]> {
  try {
    const params: Record<string, unknown> = {
      category: ["external", "internal", "20"],
      maxCount: "0x64", // 100 results
    };
    if (direction === "from") params.fromAddress = address;
    else params.toAddress = address;

    const { data } = await axios.post(NODEREAL_RPC, {
      jsonrpc: "2.0", method: "nr_getAssetTransfers", params: [params], id: 1,
    }, { timeout: 20000 });

    if (data.result?.transfers) return data.result.transfers;
    return [];
  } catch (err) {
    console.error(`[NodeReal] Error fetching ${direction} transfers:`, err instanceof Error ? err.message : err);
    return [];
  }
}

function convertToBSCScanFormat(transfers: NodeRealTransfer[], address: string): {
  transactions: BSCScanTx[];
  tokenTransfers: BSCScanTokenTx[];
  internalTxs: BSCScanInternalTx[];
} {
  const transactions: BSCScanTx[] = [];
  const tokenTransfers: BSCScanTokenTx[] = [];
  const internalTxs: BSCScanInternalTx[] = [];

  for (const t of transfers) {
    const blockNumber = t.blockNum ? Number(BigInt(t.blockNum)).toString() : "0";
    const timeStamp = t.blockTimeStamp?.toString() || "0";

    if (t.category === "external") {
      transactions.push({
        blockNumber,
        timeStamp,
        hash: t.hash,
        from: t.from,
        to: t.to || "",
        value: t.value ? BigInt(t.value).toString() : "0",
        gas: t.gas?.toString() || "21000",
        gasUsed: t.gasUsed?.toString() || "21000",
        isError: t.receiptsStatus === 1 ? "0" : "1",
        functionName: t.input && t.input.length > 10 ? t.input.slice(0, 10) : "",
        contractAddress: t.contractAddress || "",
      });
    } else if (t.category === "20") {
      tokenTransfers.push({
        blockNumber,
        timeStamp,
        hash: t.hash,
        from: t.from,
        to: t.to || "",
        value: t.value ? BigInt(t.value).toString() : "0",
        tokenName: t.name || t.asset || "Unknown",
        tokenSymbol: t.asset || "UNK",
        tokenDecimal: "18",
        contractAddress: t.contractAddress || "",
      });
    } else if (t.category === "internal") {
      internalTxs.push({
        blockNumber,
        timeStamp,
        hash: t.hash,
        from: t.from,
        to: t.to || "",
        value: t.value ? BigInt(t.value).toString() : "0",
        isError: t.receiptsStatus === 1 ? "0" : "1",
        type: "call",
      });
    }
  }

  return { transactions, tokenTransfers, internalTxs };
}

export async function fetchWalletData(address: string): Promise<WalletData> {
  console.log(`[Credit Engine] Fetching REAL BSC mainnet data for ${address}...`);

  // Fetch balance, tx count, and real tx history in parallel
  const [realBalance, realTxCount, fromTransfers, toTransfers] = await Promise.all([
    getRealBalance(address),
    getRealTxCount(address),
    fetchNodeRealTransfers(address, "from"),
    fetchNodeRealTransfers(address, "to"),
  ]);

  console.log(`[Credit Engine] Balance: ${(parseFloat(realBalance) / 1e18).toFixed(4)} BNB, Nonce: ${realTxCount}`);
  console.log(`[Credit Engine] Found ${fromTransfers.length} outgoing + ${toTransfers.length} incoming transfers from mainnet`);

  // Merge and deduplicate transfers
  const allTransfers = [...fromTransfers, ...toTransfers];
  const seen = new Set<string>();
  const unique = allTransfers.filter(t => {
    const key = `${t.hash}-${t.category}-${t.from}-${t.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const { transactions, tokenTransfers, internalTxs } = convertToBSCScanFormat(unique, address);

  console.log(`[Credit Engine] Processed: ${transactions.length} txs, ${tokenTransfers.length} token transfers, ${internalTxs.length} internal txs`);

  return { address, balance: realBalance, transactions, tokenTransfers, internalTxs };
}
