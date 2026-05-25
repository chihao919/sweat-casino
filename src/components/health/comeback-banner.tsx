"use client";

import { Activity } from "@/types";
import { checkComebackStatus } from "@/lib/health/comeback";
import { Gift } from "lucide-react";

interface ComebackBannerProps {
  activities: Activity[];
}

export function ComebackBanner({ activities }: ComebackBannerProps) {
  const status = checkComebackStatus(activities);

  if (!status.isComeback) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Gift className="size-5 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-700">
            {status.bonusMultiplier}x 回歸加成！
          </p>
          <p className="text-xs text-amber-600">
            {status.message}
          </p>
        </div>
      </div>
    </div>
  );
}
