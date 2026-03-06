"use client";

import { Activity } from "@/types";
import { formatSC } from "@/lib/sc/engine";
import { format } from "date-fns";

interface TodayCelebrationProps {
  activities: Activity[];
}

/**
 * Shows a celebratory banner when the user has run today.
 * Displays total distance, SC earned, and an encouraging message.
 */
export function TodayCelebration({ activities }: TodayCelebrationProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayRuns = activities.filter((a) => {
    const activityDate = format(new Date(a.start_date), "yyyy-MM-dd");
    return activityDate === todayStr;
  });

  if (todayRuns.length === 0) return null;

  const totalKm = todayRuns.reduce((sum, a) => sum + a.distance_km, 0);
  const totalSC = todayRuns.reduce((sum, a) => sum + a.sc_earned, 0);
  const runCount = todayRuns.length;

  // Pick an encouraging message based on distance
  const getMessage = () => {
    if (totalKm >= 20) return "超級跑者！你今天的表現簡直是傳奇級別！";
    if (totalKm >= 15) return "太強了！你的意志力讓對手瑟瑟發抖！";
    if (totalKm >= 10) return "雙位數公里達成！你正在變得更強大！";
    if (totalKm >= 5) return "今天又征服了一段路程！你的身體正在進化！";
    return "每一步都算數！你已經比沙發上的自己強 100 倍！";
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-600/30 bg-gradient-to-br from-yellow-950/80 via-amber-950/60 to-orange-950/40">
      {/* Animated glow effects */}
      <div className="absolute -left-8 -top-8 size-32 animate-pulse rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute -bottom-6 -right-6 size-28 animate-pulse rounded-full bg-orange-500/10 blur-3xl" style={{ animationDelay: "1s" }} />
      <div className="absolute left-1/2 top-0 size-20 animate-pulse rounded-full bg-amber-400/8 blur-2xl" style={{ animationDelay: "0.5s" }} />

      <div className="relative z-10 px-5 py-5">
        {/* Trophy header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-3xl animate-bounce" style={{ animationDuration: "2s" }}>🏆</span>
          <h3 className="text-lg font-black text-yellow-300 tracking-wide">
            今日戰績
          </h3>
          <span className="text-3xl animate-bounce" style={{ animationDuration: "2s", animationDelay: "0.3s" }}>🔥</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-black/30 px-3 py-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-black tabular-nums text-white">
              {totalKm.toFixed(1)}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-yellow-400/80">
              公里
            </p>
          </div>
          <div className="rounded-xl bg-black/30 px-3 py-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-black tabular-nums text-green-400">
              +{formatSC(totalSC)}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-green-400/80">
              $SC 入帳
            </p>
          </div>
          <div className="rounded-xl bg-black/30 px-3 py-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-black tabular-nums text-white">
              {runCount}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-yellow-400/80">
              {runCount > 1 ? "次跑步" : "次跑步"}
            </p>
          </div>
        </div>

        {/* Encouraging message */}
        <div className="rounded-xl bg-gradient-to-r from-yellow-900/40 to-orange-900/30 px-4 py-3 text-center">
          <p className="text-sm font-bold leading-relaxed text-yellow-100">
            {getMessage()}
          </p>
          <p className="mt-1 text-xs text-yellow-400/60">
            你的汗水已轉化為 {formatSC(totalSC)} $SC，持續累積財富！💰
          </p>
        </div>
      </div>
    </div>
  );
}
