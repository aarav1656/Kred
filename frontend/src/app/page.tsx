"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/credit/ScoreGauge";
import { ScoreBreakdown } from "@/components/credit/ScoreBreakdown";
import { AIReport } from "@/components/credit/AIReport";
import { TierBadge } from "@/components/credit/TierBadge";
import { mockCreditProfile } from "@/lib/mock-data";
import { fetchCreditScore, CreditScoreResponse } from "@/lib/api";
import { useDemoMode } from "@/lib/demo-mode";
import { useAccount } from "wagmi";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Wallet,
  Search,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function CreditDashboard() {
  const { isDemoMode } = useDemoMode();
  const { address: walletAddress } = useAccount();
  const [searchAddress, setSearchAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreditScoreResponse | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (addr?: string) => {
    const targetAddress = addr || searchAddress.trim();
    if (!targetAddress) return;

    if (isDemoMode) {
      setProfile({
        ...mockCreditProfile,
        tier: 2,
        tierName: "Gold",
        collateralRatio: 7500,
        creditLimit: 2000,
        interestRate: 4,
      });
      setSearched(true);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchCreditScore(targetAddress);
      setProfile(data);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch credit score");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [searchAddress, isDemoMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleUseWallet = () => {
    if (walletAddress) {
      setSearchAddress(walletAddress);
      handleSearch(walletAddress);
    }
  };

  // Build display data from API response or demo data
  const displayProfile = profile || (isDemoMode ? {
    ...mockCreditProfile,
    tier: 2,
    tierName: "Gold",
    collateralRatio: 7500,
    creditLimit: 2000,
    interestRate: 4,
  } : null);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Credit Score Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your on-chain reputation, analyzed by AI
        </p>
      </div>

      {/* Search Box */}
      <Card className="bg-card/50 border-border glow-cyan animate-fade-in-up">
        <CardContent className="pt-6 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Analyze any BSC wallet</p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Paste any BSC wallet address (0x...)"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 font-mono text-sm"
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={loading || !searchAddress.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-0 min-w-[120px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1.5" />
                  Analyze
                </>
              )}
            </Button>
          </div>
          {walletAddress && (
            <button
              onClick={handleUseWallet}
              className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Wallet className="h-3 w-3" />
              Use connected wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="bg-rose-950/20 border-rose-500/30 animate-fade-in-up">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose-400">Error fetching credit score</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              onClick={() => handleSearch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Analyzing wallet history...</p>
          <p className="text-xs text-muted-foreground mt-1">AI is computing your Kred Score</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !displayProfile && !error && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">Enter a wallet address to begin</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md text-center">
            Paste any BSC wallet address above to view their AI-powered credit score,
            tier, and detailed breakdown.
          </p>
        </div>
      )}

      {/* Dashboard content */}
      {!loading && displayProfile && (
        <>
          {/* Top row: Gauge + Tier + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Gauge */}
            <Card className="lg:col-span-1 bg-card/50 border-border animate-fade-in-up">
              <CardContent className="flex flex-col items-center justify-center pt-6 pb-4">
                <ScoreGauge score={displayProfile.score} />
              </CardContent>
            </Card>

            {/* Tier + Quick Stats */}
            <Card className="lg:col-span-1 bg-card/50 border-border animate-fade-in-up animate-delay-100">
              <CardContent className="pt-6 space-y-4">
                <TierBadge score={displayProfile.score} />

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Completed</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{displayProfile.loansCompleted ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">loans repaid</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-2 text-rose-400">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Defaults</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{displayProfile.loansFailed ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">defaults</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Wallet className="h-4 w-4" />
                      <span className="text-xs font-medium">Borrowed</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">${(displayProfile.totalBorrowed ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">total</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-medium">Repaid</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">${(displayProfile.totalRepaid ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score Breakdown Radar */}
            <Card className="lg:col-span-1 bg-card/50 border-border animate-fade-in-up animate-delay-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreBreakdown breakdown={displayProfile.breakdown} />
              </CardContent>
            </Card>
          </div>

          {/* AI Credit Report */}
          {displayProfile.aiReport && (
            <Card className="bg-card/50 border-border animate-fade-in-up animate-delay-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">AI Credit Report</CardTitle>
              </CardHeader>
              <CardContent>
                <AIReport report={displayProfile.aiReport} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
