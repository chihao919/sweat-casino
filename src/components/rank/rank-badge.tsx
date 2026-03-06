"use client";

import { getRank, getRankProgress, getNextRank } from "@/lib/rank/system";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  totalKm: number;
  size?: "sm" | "md";
  showProgress?: boolean;
  className?: string;
}

export function RankBadge({
  totalKm,
  size = "sm",
  showProgress = false,
  className,
}: RankBadgeProps) {
  const rank = getRank(totalKm);
  const nextRank = getNextRank(totalKm);
  const progress = getRankProgress(totalKm);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className={size === "sm" ? "text-sm" : "text-lg"}>{rank.icon}</span>
      <span
        className={cn(
          "font-bold",
          rank.color,
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {rank.nameCn}
      </span>
      {showProgress && nextRank && (
        <div className="ml-2 flex-1 max-w-[80px]">
          <Progress
            value={progress}
            className="h-1 bg-neutral-800 [&>div]:bg-current"
          />
        </div>
      )}
    </div>
  );
}
