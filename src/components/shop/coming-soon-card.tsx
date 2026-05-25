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
        "relative overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-4",
        className
      )}
    >
      {/* Blurred overlay */}
      <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2 rounded-lg bg-white/90 border border-yellow-200 px-4 py-3 shadow-sm">
          <Clock className="size-4 text-yellow-500" />
          <span className="text-xs font-bold text-yellow-600 uppercase tracking-wide">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Card content (visible but blurred) */}
      <div className="flex flex-col items-center gap-2 opacity-40">
        <span className="text-3xl">{emoji}</span>
        <p className="text-sm font-semibold text-gray-600">{name}</p>
        <p className="text-[10px] text-gray-400 text-center">{description}</p>
      </div>
    </div>
  );
}
