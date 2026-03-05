"use client";

import { Activity } from "@/types";
import { calculateMilestones, getNextMilestone } from "@/lib/health/milestones";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface MilestoneTrackerProps {
  activities: Activity[];
}

export function MilestoneTracker({ activities }: MilestoneTrackerProps) {
  const milestones = calculateMilestones(activities);
  const nextMilestone = getNextMilestone(activities);
  const achievedCount = milestones.filter((m) => m.achieved).length;
  const totalKm = activities.reduce((sum, a) => sum + a.distance_km, 0);

  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-neutral-300">
          <span className="flex items-center gap-2">
            <Target className="size-4 text-emerald-400" />
            Health Milestones
          </span>
          <span className="text-xs font-normal text-neutral-500">
            {achievedCount}/{milestones.length} achieved
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Next milestone highlight */}
        {nextMilestone && (
          <div className="rounded-md border border-emerald-900/40 bg-emerald-950/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{nextMilestone.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-200">
                    Next: {nextMilestone.label}
                  </p>
                  <p className="text-xs text-emerald-400/70">
                    {nextMilestone.description}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold tabular-nums text-emerald-300">
                {totalKm.toFixed(1)}/{nextMilestone.targetKm} km
              </span>
            </div>
            <Progress
              value={nextMilestone.progress}
              className="mt-2 h-1.5 bg-emerald-950 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-400"
            />
          </div>
        )}

        {/* Achieved milestones row */}
        {achievedCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {milestones
              .filter((m) => m.achieved)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1"
                  title={m.description}
                >
                  <span className="text-sm">{m.icon}</span>
                  <span className="text-[11px] font-medium text-neutral-300">
                    {m.label}
                  </span>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
