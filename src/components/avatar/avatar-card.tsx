"use client";

import { PixelRunner } from "./pixel-runner";
import { getRank, getRankProgress, getNextRank } from "@/lib/rank/system";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AvatarCardProps {
  displayName: string;
  totalKm: number;
  teamName?: string;
  teamEmoji?: string;
  title?: string;
  skinSlug?: string;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  className?: string;
}

export function AvatarCard({
  displayName,
  totalKm,
  teamName,
  teamEmoji,
  title,
  skinSlug,
  size = "md",
  showProgress = true,
  className,
}: AvatarCardProps) {
  const rank = getRank(totalKm);
  const nextRank = getNextRank(totalKm);
  const progress = getRankProgress(totalKm);
  const avatarSize = size === "sm" ? 64 : size === "md" ? 100 : 140;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-4",
        rank.bgColor,
        rank.borderColor,
        className
      )}
    >
      {/* Avatar */}
      <PixelRunner skinSlug={skinSlug} size={avatarSize} animate />

      {/* Name + Title */}
      <div className="text-center">
        {title && (
          <p className="text-[10px] font-medium text-neutral-400">
            {title}
          </p>
        )}
        <p className="text-sm font-bold text-neutral-100">{displayName}</p>
      </div>

      {/* Rank badge */}
      <div className={cn("flex items-center gap-1.5 text-xs font-semibold", rank.color)}>
        <span>{rank.icon}</span>
        <span>{rank.nameCn} {rank.name}</span>
      </div>

      {/* Team */}
      {teamName && (
        <p className="text-[11px] text-neutral-500">
          {teamEmoji} {teamName}
        </p>
      )}

      {/* Distance */}
      <p className="text-xs text-neutral-400">
        {totalKm.toFixed(1)} km
      </p>

      {/* Rank progress bar */}
      {showProgress && nextRank && (
        <div className="w-full space-y-1">
          <Progress
            value={progress}
            className="h-1.5 bg-neutral-800 [&>div]:bg-gradient-to-r [&>div]:from-current [&>div]:to-current"
          />
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>{rank.icon} {rank.nameCn}</span>
            <span>{nextRank.icon} {nextRank.nameCn} ({nextRank.minKm} km)</span>
          </div>
        </div>
      )}
    </div>
  );
}
