"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "@/types";
import { subDays, startOfDay, isSameDay, getDay } from "date-fns";

// Map JS getDay() (0=Sun ... 6=Sat) to Traditional Chinese weekday labels
const WEEKDAY_LABELS: Record<number, string> = {
  0: "日",
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
};

interface WeeklyChartProps {
  activities: Activity[];
  // Team color: "red" for Red Bulls, "white" for White Bears
  teamColor?: "red" | "white";
}

interface ChartDataPoint {
  day: string;
  km: number;
}

function buildLast7DaysData(activities: Activity[]): ChartDataPoint[] {
  const today = startOfDay(new Date());
  // Build array for last 7 days in chronological order
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dayActivities = activities.filter((a) =>
      isSameDay(new Date(a.activity_date), date)
    );
    const totalKm = dayActivities.reduce((sum, a) => sum + a.distance_km, 0);
    return {
      day: WEEKDAY_LABELS[getDay(date)],
      km: Number(totalKm.toFixed(2)),
    };
  });
}

// Custom tooltip to match dark theme
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 shadow-xl">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="text-sm font-bold text-white">{payload[0].value.toFixed(2)} km</p>
    </div>
  );
}

export function WeeklyChart({ activities, teamColor = "red" }: WeeklyChartProps) {
  const data = useMemo(() => buildLast7DaysData(activities), [activities]);
  const hasData = data.some((d) => d.km > 0);

  const barColor = teamColor === "red" ? "#ef4444" : "#e5e5e5";
  const barActiveColor = teamColor === "red" ? "#dc2626" : "#d4d4d4";

  if (!hasData) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2">
        <p className="text-2xl">🏃</p>
        <p className="text-sm text-neutral-400">本週還沒有跑步紀錄</p>
        <p className="text-xs text-neutral-600">出去跑步並記錄你的第一公里吧！</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#262626" strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tick={{ fill: "#737373", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#737373", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}`}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar
          dataKey="km"
          fill={barColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
          activeBar={{ fill: barActiveColor }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
