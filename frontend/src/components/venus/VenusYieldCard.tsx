"use client";

import { useVenus } from "@/hooks/useVenus";
import { Sprout, Zap, ExternalLink } from "lucide-react";

interface VenusYieldCardProps {
  collateralAmount: number;
  className?: string;
}

export function VenusYieldCard({ collateralAmount, className }: VenusYieldCardProps) {
  const { data } = useVenus();
  const apy = data?.supplyAPY ?? 5;
  const dailyYield = (collateralAmount * apy) / 100 / 365;
  const monthlyYield = dailyYield * 30;
  const annualYield = collateralAmount * apy / 100;

  return (
    <div className={`rounded-lg border border-emerald-900/30 bg-emerald-950/20 p-3 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <Sprout className="h-3 w-3" />
            Smart Collateral
          </p>
          <p className="text-sm font-semibold mt-0.5">
            ${collateralAmount.toFixed(2)} locked
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Venus APY</p>
          <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-400" />
            {apy.toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="rounded bg-emerald-950/40 px-2 py-1">
          <p className="text-[9px] text-muted-foreground">Daily</p>
          <p className="text-[11px] font-semibold text-emerald-400">+${dailyYield.toFixed(4)}</p>
        </div>
        <div className="rounded bg-emerald-950/40 px-2 py-1">
          <p className="text-[9px] text-muted-foreground">Monthly</p>
          <p className="text-[11px] font-semibold text-emerald-400">+${monthlyYield.toFixed(2)}</p>
        </div>
        <div className="rounded bg-emerald-950/40 px-2 py-1">
          <p className="text-[9px] text-muted-foreground">Annual</p>
          <p className="text-[11px] font-semibold text-emerald-400">+${annualYield.toFixed(2)}</p>
        </div>
      </div>
      <a
        href="https://app.venus.io/#/core-pool/market/0xfD5840Cd36d94D7229439859C0112a4185BC0255"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-[10px] text-yellow-500 hover:text-yellow-400 mt-2 transition-colors"
      >
        <Zap className="h-2.5 w-2.5" />
        Earning via Venus Protocol vUSDT
        <ExternalLink className="h-2.5 w-2.5" />
      </a>
    </div>
  );
}
