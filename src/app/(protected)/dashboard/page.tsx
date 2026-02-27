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

// ── Placeholder data for team comparison (would come from API in production)
const PLACEHOLDER_TEAM_STATS = {
  red: { name: "Red Bulls", emoji: "🐂", weeklyKm: 0, activityCount: 0 },
  white: { name: "White Bears", emoji: "🐻‍❄️", weeklyKm: 0, activityCount: 0 },
};

// ── Live ticker items placeholder
const TICKER_ITEMS = [
  "🏃 Alex ran 10.5 km and earned $52.50 SC",
  "🎰 Pool 'Red Bulls win this week' just closed with $2,400 SC",
  "⚡ Weather bonus active! 1.5x multiplier for running in rain",
  "🏆 Sam just hit a 7-day streak!",
  "💸 Jamie placed $50 SC on going Over 30 km this week",
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
          <span>Season Progress — {season.name}</span>
          <Badge variant="outline" className="border-green-700 bg-green-950/50 text-green-400 text-xs">
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={percent} className="h-2 bg-neutral-800 [&>div]:bg-gradient-to-r [&>div]:from-red-600 [&>div]:to-orange-500" />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{format(start, "MMM d")}</span>
          <span className="font-medium text-neutral-300">
            <Timer className="mr-1 inline size-3" />
            {daysLeft > 0 ? `${daysLeft} days left` : "Season ended"}
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
            {activity.weather_multiplier}x weather
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
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
      {/* Season progress */}
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
            My Last 7 Days
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
          onClick={() => {}}
        >
          <span className="text-lg">🎲</span>
          <span className="text-xs">Bet on Yourself</span>
        </Button>
        <Button
          variant="outline"
          className="h-14 flex-col gap-1 border-neutral-700 bg-neutral-900 font-bold text-white hover:border-neutral-600 hover:bg-neutral-800"
          onClick={() => {}}
        >
          <span className="text-lg">🏊</span>
          <span className="text-xs">Join Pool</span>
        </Button>
      </div>

      {/* Recent activities */}
      <Card className="border-neutral-800 bg-neutral-900">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold text-neutral-300">
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-neutral-800">
          {recentActivities.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <span className="text-3xl">🏃</span>
              <p className="text-sm text-neutral-400">No activities yet.</p>
              <p className="text-xs text-neutral-600">
                Connect Strava or log a manual run to get started.
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
