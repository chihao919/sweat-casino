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
    <Card className={cn("border-neutral-800 bg-neutral-900 overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="border-b border-neutral-800 px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold">
            本週 — 隊伍對決
          </p>
        </div>

        {/* VS Panel */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0">
          {/* Red Bulls side */}
          <div className="relative flex flex-col items-center gap-2 p-5">
            {/* Ambient glow effect */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(239,68,68,0.12)_0%,_transparent_60%)]" />

            <span className="text-4xl drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]">
              {redTeam.emoji}
            </span>
            <span className="text-xs font-semibold text-neutral-300">{redTeam.name}</span>

            <div className="mt-1 text-center">
              <p className="text-3xl font-black tabular-nums text-white leading-none">
                {formatKm(redTeam.weeklyKm)}
              </p>
              <p className="text-xs text-neutral-500">本週公里數</p>
            </div>

            <p className="text-xs text-neutral-500">
              {redTeam.activityCount} 次活動
            </p>

            {/* Leading indicator */}
            {redIsLeading && totalKm > 0 && (
              <span className="animate-pulse rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-400">
                領先中
              </span>
            )}
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1 px-2">
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-neutral-700 to-transparent" />
            <span className="text-xs font-black text-neutral-600 tracking-widest">VS</span>
            <div className="h-16 w-px bg-gradient-to-b from-neutral-700 via-neutral-700 to-transparent" />
          </div>

          {/* White Bears side */}
          <div className="relative flex flex-col items-center gap-2 p-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_right,_rgba(229,229,229,0.06)_0%,_transparent_60%)]" />

            <span className="text-4xl drop-shadow-[0_0_12px_rgba(229,229,229,0.4)]">
              {whiteTeam.emoji}
            </span>
            <span className="text-xs font-semibold text-neutral-300">{whiteTeam.name}</span>

            <div className="mt-1 text-center">
              <p className="text-3xl font-black tabular-nums text-white leading-none">
                {formatKm(whiteTeam.weeklyKm)}
              </p>
              <p className="text-xs text-neutral-500">本週公里數</p>
            </div>

            <p className="text-xs text-neutral-500">
              {whiteTeam.activityCount} 次活動
            </p>

            {!redIsLeading && totalKm > 0 && (
              <span className="animate-pulse rounded-full bg-neutral-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-300">
                領先中
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-4">
          <div className="flex overflow-hidden rounded-full h-3">
            <div
              className="h-full bg-red-600 transition-all duration-700 ease-out"
              style={{ width: `${redPercent}%` }}
            />
            <div
              className="h-full bg-neutral-300 transition-all duration-700 ease-out"
              style={{ width: `${whitePercent}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-neutral-600">
            <span>{redPercent}%</span>
            <span>{whitePercent}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
