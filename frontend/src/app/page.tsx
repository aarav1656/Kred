"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreGauge } from "@/components/credit/ScoreGauge";
import { ScoreBreakdown } from "@/components/credit/ScoreBreakdown";
import { AIReport } from "@/components/credit/AIReport";
import { TierBadge } from "@/components/credit/TierBadge";
import { mockCreditProfile } from "@/lib/mock-data";
import { TrendingUp, CheckCircle, XCircle, Wallet } from "lucide-react";

export default function CreditDashboard() {
  const profile = mockCreditProfile;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Credit Score Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your on-chain reputation, analyzed by AI
        </p>
      </div>

      {/* Top row: Gauge + Tier + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Gauge */}
        <Card className="lg:col-span-1 bg-card/50 border-border animate-fade-in-up">
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-4">
            <ScoreGauge score={profile.score} />
          </CardContent>
        </Card>

        {/* Tier + Quick Stats */}
        <Card className="lg:col-span-1 bg-card/50 border-border animate-fade-in-up animate-delay-100">
          <CardContent className="pt-6 space-y-4">
            <TierBadge score={profile.score} />

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Completed</span>
                </div>
                <p className="text-2xl font-bold mt-1">{profile.loansCompleted}</p>
                <p className="text-[10px] text-muted-foreground">loans repaid</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <XCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Defaults</span>
                </div>
                <p className="text-2xl font-bold mt-1">{profile.loansFailed}</p>
                <p className="text-[10px] text-muted-foreground">defaults</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-medium">Borrowed</span>
                </div>
                <p className="text-2xl font-bold mt-1">${profile.totalBorrowed.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">total</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="flex items-center gap-2 text-yellow-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Repaid</span>
                </div>
                <p className="text-2xl font-bold mt-1">${profile.totalRepaid.toLocaleString()}</p>
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
            <ScoreBreakdown breakdown={profile.breakdown} />
          </CardContent>
        </Card>
      </div>

      {/* AI Credit Report */}
      <Card className="bg-card/50 border-border animate-fade-in-up animate-delay-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">AI Credit Report</CardTitle>
        </CardHeader>
        <CardContent>
          <AIReport report={profile.aiReport} />
        </CardContent>
      </Card>
    </div>
  );
}
