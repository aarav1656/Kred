"use client";

import { useVenus } from "@/hooks/useVenus";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Zap, TrendingUp, PiggyBank, Activity } from "lucide-react";

export function VenusStats() {
  const { data, loading, error, refresh } = useVenus();

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-yellow-950/30 to-orange-950/20 border-yellow-900/30">
        <CardContent className="py-3 flex items-center justify-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-400" />
          <span className="text-xs text-yellow-400">Connecting to Venus Protocol...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-yellow-950/20 via-orange-950/10 to-yellow-950/20 border-yellow-900/20 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.05),transparent_50%)]" />
      <CardContent className="py-3 px-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Venus branding */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/10">
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
              </div>
              <span className="text-xs font-semibold text-yellow-400">Venus Protocol</span>
              <Badge variant="outline" className="text-[9px] border-yellow-800/30 text-yellow-500 px-1.5 py-0">
                LIVE
              </Badge>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Key metrics */}
            <div className="hidden sm:flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] text-muted-foreground">Supply APY</span>
                <span className="text-xs font-bold text-emerald-400">{data.supplyAPY.toFixed(2)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PiggyBank className="h-3 w-3 text-yellow-400" />
                <span className="text-[10px] text-muted-foreground">TVL</span>
                <span className="text-xs font-bold text-foreground">
                  ${data.totalSupplyUSD >= 1_000_000
                    ? `${(data.totalSupplyUSD / 1_000_000).toFixed(0)}M`
                    : `${(data.totalSupplyUSD / 1_000).toFixed(0)}K`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-cyan-400" />
                <span className="text-[10px] text-muted-foreground">Util.</span>
                <span className="text-xs font-bold text-foreground">{data.utilizationRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <button
            onClick={refresh}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Venus data"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
