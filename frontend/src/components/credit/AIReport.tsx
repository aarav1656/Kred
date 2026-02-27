"use client";

import { Bot, Sparkles } from "lucide-react";

interface AIReportProps {
  report: string;
}

export function AIReport({ report }: AIReportProps) {
  // Parse markdown bold text
  const formatText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </span>
        );
      }
      return part;
    });
  };

  const paragraphs = report.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
          <Bot className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5">
            AI Credit Analysis
            <Sparkles className="h-3 w-3 text-violet-400" />
          </p>
          <p className="text-[10px] text-muted-foreground">Powered by Claude AI</p>
        </div>
      </div>

      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <div key={i} className="text-sm text-muted-foreground leading-relaxed">
            {p.startsWith("- ") ? (
              <div className="pl-3 border-l-2 border-cyan-800/50 py-1">
                {formatText(p.slice(2))}
              </div>
            ) : (
              <p>{formatText(p)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
