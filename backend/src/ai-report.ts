import OpenAI from "openai";
import { config } from "./config.js";
import type { DimensionScore, WalletData } from "./types.js";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: config.openrouterApiKey,
});

export async function generateAIReport(
  address: string,
  credScore: number,
  tier: string,
  dimensions: DimensionScore[],
  walletData: WalletData
): Promise<string> {
  const txCount = walletData.transactions.length;
  const tokenCount = new Set(walletData.tokenTransfers.map((t) => t.tokenSymbol)).size;
  const bnbBalance = (parseFloat(walletData.balance) / 1e18).toFixed(4);

  const dimensionSummary = dimensions
    .map((d) => `- ${d.name}: ${d.score}/${d.maxScore} (weight: ${d.weight * 100}%) — ${d.details}`)
    .join("\n");

  const prompt = `You are CredShield's AI Credit Analyst. Generate a concise, professional credit report for a BSC (BNB Smart Chain) wallet.

**Wallet**: ${address}
**CredScore**: ${credScore}/900
**Tier**: ${tier}
**BNB Balance**: ${bnbBalance} BNB
**Total Transactions**: ${txCount}
**Unique Tokens**: ${tokenCount}

**Dimension Breakdown**:
${dimensionSummary}

Write a 3-4 paragraph credit analysis that:
1. Opens with the overall credit assessment and what the score means
2. Highlights the strongest dimensions and explains WHY they indicate creditworthiness
3. Notes areas for improvement and what would boost the score
4. Concludes with a lending recommendation based on the tier

Be specific — reference actual numbers. Write like a fintech credit report, not generic text. Keep it under 250 words.`;

  try {
    const response = await openai.chat.completions.create({
      model: "anthropic/claude-sonnet-4",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0]?.message?.content || "Credit report generation failed.";
  } catch (err) {
    console.error("AI report generation error:", err instanceof Error ? err.message : err);
    return generateFallbackReport(address, credScore, tier, dimensions, bnbBalance, txCount);
  }
}

function generateFallbackReport(
  address: string,
  credScore: number,
  tier: string,
  dimensions: DimensionScore[],
  bnbBalance: string,
  txCount: number
): string {
  const strongest = [...dimensions].sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore))[0];
  const weakest = [...dimensions].sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))[0];

  return `**CredShield Credit Analysis — ${tier} Tier**

Wallet ${address.slice(0, 6)}...${address.slice(-4)} has achieved a CredScore of ${credScore}/900, placing it in the ${tier} tier. This score is based on analysis of ${txCount} on-chain transactions and a current balance of ${bnbBalance} BNB.

The strongest dimension is ${strongest.name} (${strongest.score}/${strongest.maxScore}), which indicates ${strongest.details}. This contributes positively to the overall creditworthiness assessment.

The primary area for improvement is ${weakest.name} (${weakest.score}/${weakest.maxScore}). Increasing activity in this area would significantly boost the CredScore and unlock better lending terms.

Based on the ${tier} tier classification, this wallet qualifies for credit facilities with the corresponding collateral requirements and credit limits as defined by the CredShield protocol.`;
}
