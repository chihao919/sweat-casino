"use client";

import { Activity } from "@/types";
import { calculateBodyVersion } from "@/lib/health/body-version";
import { Cpu } from "lucide-react";

interface BodyVersionBadgeProps {
  activities: Activity[];
  size?: "sm" | "lg";
}

export function BodyVersionBadge({ activities, size = "sm" }: BodyVersionBadgeProps) {
  const version = calculateBodyVersion(activities);

  if (size === "sm") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300 bg-cyan-50 px-2.5 py-1">
        <Cpu className="size-3 text-cyan-500" />
        <span className="text-xs font-mono font-bold text-cyan-700">
          身體 {version.display}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-lg bg-cyan-100">
          <Cpu className="size-6 text-cyan-500" />
        </div>
        <div>
          <p className="font-mono text-xl font-black text-cyan-700">
            身體 {version.display}
          </p>
          <p className="text-sm font-semibold text-cyan-600">{version.title}</p>
          <p className="text-xs text-cyan-500">{version.description}</p>
        </div>
      </div>
    </div>
  );
}
