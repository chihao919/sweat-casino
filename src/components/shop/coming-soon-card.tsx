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
        "relative overflow-hidden rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 p-4",
        className
      )}
    >
      {/* Blurred overlay */}
      <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2 rounded-lg bg-neutral-900/90 px-4 py-3">
          <Clock className="size-4 text-yellow-500" />
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Card content (visible but blurred) */}
      <div className="flex flex-col items-center gap-2 opacity-40">
        <span className="text-3xl">{emoji}</span>
        <p className="text-sm font-semibold text-neutral-300">{name}</p>
        <p className="text-[10px] text-neutral-500 text-center">{description}</p>
      </div>
    </div>
  );
}
