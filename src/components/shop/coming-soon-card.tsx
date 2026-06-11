"use client";

import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface ComingSoonCardProps {
  name: string;
  description: string;
  imageSrc?: string;
  emoji?: string;
  className?: string;
}

export function ComingSoonCard({
  name,
  description,
  emoji = "🎁",
  className,
}: ComingSoonCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-dashed border-border bg-muted/50 p-4",
        className
      )}
    >
      {/* Blurred overlay */}
      <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2 rounded-lg bg-card/90 border border-yellow-500/40 px-4 py-3 shadow-sm">
          <Clock className="size-4 text-yellow-500" />
          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Card content (visible but blurred) */}
      <div className="flex flex-col items-center gap-2 opacity-40">
        <span className="text-3xl">{emoji}</span>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-[10px] text-muted-foreground text-center">{description}</p>
      </div>
    </div>
  );
}
