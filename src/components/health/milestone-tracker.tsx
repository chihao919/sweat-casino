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
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-700">
          <span className="flex items-center gap-2">
            <Target className="size-4 text-emerald-500" />
            健康里程碑
          </span>
          <span className="text-xs font-normal text-gray-500">
            已達成 {achievedCount}/{milestones.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Next milestone highlight */}
        {nextMilestone && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{nextMilestone.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    下一個：{nextMilestone.label}
                  </p>
                  <p className="text-xs text-emerald-600/70">
                    {nextMilestone.description}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold tabular-nums text-emerald-600">
                {totalKm.toFixed(1)}/{nextMilestone.targetKm} km
              </span>
            </div>
            <Progress
              value={nextMilestone.progress}
              className="mt-2 h-1.5 bg-emerald-100 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-400"
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
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1"
                  title={m.description}
                >
                  <span className="text-sm">{m.icon}</span>
                  <span className="text-[11px] font-medium text-gray-600">
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
