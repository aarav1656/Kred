"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface ScoreBreakdownProps {
  breakdown: {
    walletMaturity: number;
    defiExperience: number;
    transactionQuality: number;
    assetHealth: number;
    repaymentHistory: number;
    socialVerification: number;
  };
}

const labels: Record<string, { label: string; max: number }> = {
  walletMaturity: { label: "Wallet", max: 180 },
  defiExperience: { label: "DeFi", max: 225 },
  transactionQuality: { label: "Tx Quality", max: 180 },
  assetHealth: { label: "Assets", max: 135 },
  repaymentHistory: { label: "Repayment", max: 135 },
  socialVerification: { label: "Social", max: 45 },
};

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const data = Object.entries(breakdown).map(([key, value]) => ({
    subject: labels[key].label,
    value: Math.round((value / labels[key].max) * 100),
    actual: value,
    max: labels[key].max,
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="hsl(217 33% 17%)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#00D4FF"
            fill="#00D4FF"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Breakdown table */}
      <div className="space-y-2 mt-2">
        {Object.entries(breakdown).map(([key, value]) => {
          const info = labels[key];
          const pct = Math.round((value / info.max) * 100);
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">{info.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-medium w-16 text-right tabular-nums">
                {value}/{info.max}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
