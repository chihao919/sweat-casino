"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TeamStats {
  name: string;
  emoji: string;
  weeklyKm: number;
  activityCount: number;
}

interface TeamVsPanelProps {
  redTeam: TeamStats;
  whiteTeam: TeamStats;
  className?: string;
}

function formatKm(km: number): string {
  return km.toFixed(1);
}

export function TeamVsPanel({ redTeam, whiteTeam, className }: TeamVsPanelProps) {
  const totalKm = redTeam.weeklyKm + whiteTeam.weeklyKm;
  // Proportion for the progress bar split (default 50/50 when both are zero)
  const redPercent = totalKm > 0 ? Math.round((redTeam.weeklyKm / totalKm) * 100) : 50;
  const whitePercent = 100 - redPercent;

  const redIsLeading = redTeam.weeklyKm >= whiteTeam.weeklyKm;

  return (
    <Card className={cn("border-border bg-card shadow-sm overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="border-b border-border px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
            本週 — 隊伍對決
          </p>
        </div>

        {/* VS Panel */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0">
          {/* Red Bulls side */}
          <div className="relative flex flex-col items-center gap-2 p-5">
            {/* Ambient glow effect — keep red glow for red team */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(239,68,68,0.08)_0%,_transparent_60%)]" />

            <span className="text-4xl drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]">
              {redTeam.emoji}
            </span>
            <span className="text-xs font-semibold text-foreground">{redTeam.name}</span>

            <div className="mt-1 text-center">
              <p className="text-4xl font-black tabular-nums text-foreground leading-none">
                {formatKm(redTeam.weeklyKm)}
              </p>
              <p className="text-xs text-muted-foreground">本週公里數</p>
            </div>

            <p className="text-xs text-muted-foreground">
              {redTeam.activityCount} 次活動
            </p>

            {/* Leading indicator */}
            {redIsLeading && totalKm > 0 && (
              <span className="animate-pulse rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-500">
                領先中
              </span>
            )}
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1 px-2">
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            <span className="text-xs font-black text-muted-foreground tracking-widest">VS</span>
            <div className="h-16 w-px bg-gradient-to-b from-border via-border to-transparent" />
          </div>

          {/* White Bears side */}
          <div className="relative flex flex-col items-center gap-2 p-5">
            {/* Subtle blue/gray glow for white team */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(148,163,184,0.10)_0%,_transparent_60%)]" />

            <span className="text-4xl drop-shadow-[0_0_12px_rgba(148,163,184,0.5)]">
              {whiteTeam.emoji}
            </span>
            <span className="text-xs font-semibold text-foreground">{whiteTeam.name}</span>

            <div className="mt-1 text-center">
              <p className="text-4xl font-black tabular-nums text-foreground leading-none">
                {formatKm(whiteTeam.weeklyKm)}
              </p>
              <p className="text-xs text-muted-foreground">本週公里數</p>
            </div>

            <p className="text-xs text-muted-foreground">
              {whiteTeam.activityCount} 次活動
            </p>

            {!redIsLeading && totalKm > 0 && (
              <span className="animate-pulse rounded-full bg-slate-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                領先中
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-4">
          <div className="flex overflow-hidden rounded-full h-3">
            <div
              className="h-full bg-red-500 transition-all duration-700 ease-out"
              style={{ width: `${redPercent}%` }}
            />
            <div
              className="h-full bg-slate-300 transition-all duration-700 ease-out"
              style={{ width: `${whitePercent}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>{redPercent}%</span>
            <span>{whitePercent}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
