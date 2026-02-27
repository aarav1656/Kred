"use client";

import { useEffect, useState } from "react";
import { getScoreColor, getTier, TIERS } from "@/lib/mock-data";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export function ScoreGauge({ score, size = 280 }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(300);
  const tier = getTier(score);
  const tierInfo = TIERS[tier];
  const color = getScoreColor(score);

  // Animate score on mount
  useEffect(() => {
    const duration = 2000;
    const start = 300;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(start + (score - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = (animatedScore - 300) / 600; // 300-900 range
  const arcLength = circumference * 0.75; // 270 degree arc
  const offset = arcLength - arcLength * scorePercent;

  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-xl"
        style={{ background: `radial-gradient(circle, ${color}40, transparent 70%)` }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-[135deg]">
        {/* Background arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(217 33% 14%)"
          strokeWidth="12"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-200"
          style={{
            filter: `drop-shadow(0 0 8px ${color}60)`,
          }}
        />
        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const angle = -135 + pct * 270;
          const rad = (angle * Math.PI) / 180;
          const x1 = center + (radius + 16) * Math.cos(rad);
          const y1 = center + (radius + 16) * Math.sin(rad);
          const x2 = center + (radius + 22) * Math.cos(rad);
          const y2 = center + (radius + 22) * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="hsl(217 33% 25%)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">CredScore</p>
        <p className="text-5xl font-bold tabular-nums" style={{ color }}>
          {animatedScore}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-sm font-semibold" style={{ color }}>
            {tierInfo.name}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">out of 900</p>
      </div>
    </div>
  );
}
