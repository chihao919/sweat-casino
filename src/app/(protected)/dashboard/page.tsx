"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamVsPanel } from "@/components/dashboard/team-vs-panel";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { createClient } from "@/lib/supabase/client";
import { Activity, Profile, Season } from "@/types";
import { formatSC } from "@/lib/sc/engine";
import { format, differenceInDays, parseISO } from "date-fns";
import { Zap, Timer, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { MotivationalBanner } from "@/components/health/motivational-banner";
import { MilestoneTracker } from "@/components/health/milestone-tracker";
import { BodyVersionBadge } from "@/components/health/body-version-badge";
import { ComebackBanner } from "@/components/health/comeback-banner";

// ── Placeholder data for team comparison (would come from API in production)
const PLACEHOLDER_TEAM_STATS = {
  red: { name: "紅牛隊", emoji: "🐂", weeklyKm: 0, activityCount: 0 },
  white: { name: "白熊隊", emoji: "🐻‍❄️", weeklyKm: 0, activityCount: 0 },
};

// ── Live ticker items placeholder
const TICKER_ITEMS = [
  "🏃 Alex 跑了 10.5 公里，獲得 $52.50 SC",
  "🎰 賭池「紅牛隊本週獲勝」剛以 $2,400 SC 結算",
  "⚡ 天氣加成啟動！雨天跑步獲得 1.5 倍獎勵",
  "🏆 Sam 達成 7 天連續跑步！",
  "💸 Jamie 下注 $50 SC 賭本週超過 30 公里",
];

function SeasonProgressCard({ season }: { season: Season | null }) {
  if (!season) return null;

  const start = parseISO(season.start_date);
  const end = parseISO(season.end_date);
  const now = new Date();
  const totalDays = differenceInDays(end, start);
  const elapsed = differenceInDays(now, start);
  const daysLeft = differenceInDays(end, now);
  const percent = Math.min(100, Math.round((elapsed / totalDays) * 100));

  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-neutral-300">
          <span>賽季進度 — {season.name}</span>
          <Badge variant="outline" className="border-green-700 bg-green-950/50 text-green-400 text-xs">
            進行中
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={percent} className="h-2 bg-neutral-800 [&>div]:bg-gradient-to-r [&>div]:from-red-600 [&>div]:to-orange-500" />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{format(start, "MMM d")}</span>
          <span className="font-medium text-neutral-300">
            <Timer className="mr-1 inline size-3" />
            {daysLeft > 0 ? `剩餘 ${daysLeft} 天` : "賽季已結束"}
          </span>
          <span>{format(end, "MMM d")}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveTickerBanner() {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-500">
          <Zap className="size-3" />
          Live
        </span>
        {/* Scrolling ticker */}
        <div className="overflow-hidden flex-1">
          <div className="animate-marquee whitespace-nowrap text-xs text-neutral-400">
            {TICKER_ITEMS.join("    •    ")}
            {/* Duplicate for seamless loop */}
            &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
            {TICKER_ITEMS.join("    •    ")}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-neutral-800 text-sm">
          🏃
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-200">
            {activity.distance_km.toFixed(2)} km run
          </p>
          <p className="text-xs text-neutral-500">
            {format(parseISO(activity.activity_date), "MMM d, yyyy")}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-green-400">+{formatSC(activity.sc_earned)}</p>
        {activity.weather_multiplier > 1 && (
          <p className="text-[10px] text-yellow-500">
            {activity.weather_multiplier}x 天氣加成
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile, recent activities, and active season in parallel
        const [profileRes, activitiesRes, seasonRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*, team:teams(*)")
            .eq("id", user.id)
            .single<Profile>(),
          supabase
            .from("activities")
            .select("*")
            .eq("user_id", user.id)
            .order("activity_date", { ascending: false })
            .limit(20),
          supabase
            .from("seasons")
            .select("*")
            .eq("is_active", true)
            .single<Season>(),
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (activitiesRes.data) setActivities(activitiesRes.data as Activity[]);
        if (seasonRes.data) setSeason(seasonRes.data);
      } catch (err) {
        console.error("DashboardPage: failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const teamColor: "red" | "white" =
    profile?.team?.name.toLowerCase().includes("red") ? "red" : "white";

  const recentActivities = activities.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl bg-neutral-800" />
        <Skeleton className="h-48 w-full rounded-xl bg-neutral-800" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl bg-neutral-800" />
          <Skeleton className="h-24 rounded-xl bg-neutral-800" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl bg-neutral-800" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Daily motivational quote */}
      <MotivationalBanner />

      {/* Comeback bonus (shows only when inactive 3+ days) */}
      <ComebackBanner activities={activities} />

      {/* Body version + Season progress */}
      <div className="flex items-center justify-between">
        <BodyVersionBadge activities={activities} size="sm" />
        {season && (
          <span className="text-xs text-neutral-500">
            {season.name}
          </span>
        )}
      </div>
      <SeasonProgressCard season={season} />

      {/* Live ticker */}
      <LiveTickerBanner />

      {/* Team VS panel */}
      <TeamVsPanel
        redTeam={PLACEHOLDER_TEAM_STATS.red}
        whiteTeam={PLACEHOLDER_TEAM_STATS.white}
      />

      {/* Weekly distance chart */}
      <Card className="border-neutral-800 bg-neutral-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-300">
            <TrendingUp className="size-4" />
            近 7 天跑量
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyChart activities={activities} teamColor={teamColor} />
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-14 flex-col gap-1 bg-red-600 font-bold text-white hover:bg-red-700"
          onClick={() => router.push("/betting")}
        >
          <span className="text-lg">🎲</span>
          <span className="text-xs">跟自己對賭</span>
        </Button>
        <Button
          variant="outline"
          className="h-14 flex-col gap-1 border-neutral-700 bg-neutral-900 font-bold text-white hover:border-neutral-600 hover:bg-neutral-800"
          onClick={() => router.push("/betting?tab=pools")}
        >
          <span className="text-lg">🏊</span>
          <span className="text-xs">加入賭池</span>
        </Button>
      </div>

      {/* Health milestones */}
      <MilestoneTracker activities={activities} />

      {/* Recent activities */}
      <Card className="border-neutral-800 bg-neutral-900">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold text-neutral-300">
            最近活動
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-neutral-800">
          {recentActivities.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <span className="text-3xl">🏃</span>
              <p className="text-sm text-neutral-400">還沒有活動紀錄</p>
              <p className="text-xs text-neutral-600">
                連結 Strava 或手動記錄跑步來開始吧！
              </p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
