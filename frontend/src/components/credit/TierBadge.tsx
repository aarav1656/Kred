"use client";

import { getTier, TIERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Shield, Star, Crown, Gem } from "lucide-react";

const tierIcons = [Shield, Star, Crown, Gem];

interface TierBadgeProps {
  score: number;
  showDetails?: boolean;
}

export function TierBadge({ score, showDetails = true }: TierBadgeProps) {
  const tier = getTier(score);
  const tierInfo = TIERS[tier];
  const Icon = tierIcons[tier];

  return (
    <div className={cn(
      "rounded-xl border p-4 bg-gradient-to-br",
      tierInfo.bg,
      tierInfo.border,
    )}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tierInfo.color}20` }}
        >
          <Icon className="h-6 w-6" style={{ color: tierInfo.color }} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Credit Tier</p>
          <p className={cn("text-xl font-bold", tierInfo.text)}>{tierInfo.name}</p>
        </div>
      </div>
      {showDetails && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Collateral</p>
            <p className={cn("text-sm font-semibold mt-0.5", tierInfo.text)}>{tierInfo.collateral}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Credit Limit</p>
            <p className={cn("text-sm font-semibold mt-0.5", tierInfo.text)}>{tierInfo.limit}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rate</p>
            <p className={cn("text-sm font-semibold mt-0.5", tierInfo.text)}>{tierInfo.rate}</p>
          </div>
        </div>
      )}
    </div>
  );
}
