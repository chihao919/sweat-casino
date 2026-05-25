"use client";

import { useEffect, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/teams/team-badge";
import { createClient } from "@/lib/supabase/client";
import { Profile, Team } from "@/types";
import { formatSC } from "@/lib/sc/engine";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import { format, parseISO } from "date-fns";

// ── Extended profile for leaderboard display
interface LeaderboardEntry {
  profile: Profile;
  totalKm: number;
  totalSCEarned: number;
  currentStreak: number;
}

type LeaderboardTab = "distance" | "sc-earned" | "streak";
type TeamFilter = "all" | "red" | "white";
type TimePeriod = "weekly" | "all-time";

// Medal emoji/styling for top 3
const RANK_CONFIG: Record<number, { medal: string; rowClass: string }> = {
  1: { medal: "🥇", rowClass: "border-yellow-300 bg-yellow-50" },
  2: { medal: "🥈", rowClass: "border-gray-300 bg-gray-50" },
  3: { medal: "🥉", rowClass: "border-orange-200 bg-orange-50" },
};

function getInitials(profile: Profile): string {
  return (profile.display_name ?? profile.username ?? "SC").slice(0, 2).toUpperCase();
}

function buildTeamInfo(team: Team | undefined) {
  if (!team) return null;
  return {
    name: team.name,
    color: team.color,
    emoji: team.name.toLowerCase().includes("red") ? "🐂" : "🐻‍❄️",
  };
}

function LeaderboardRow({
  entry,
  rank,
  value,
  unit,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  value: string;
  unit: string;
  isCurrentUser: boolean;
}) {
  const rankConf = RANK_CONFIG[rank];
  const teamInfo = buildTeamInfo(entry.profile.team);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        rankConf
          ? rankConf.rowClass
          : "border-gray-200 bg-white hover:bg-gray-50 shadow-sm",
        isCurrentUser && !rankConf && "border-red-200 bg-red-50"
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center">
        {rankConf ? (
          <span className="text-xl">{rankConf.medal}</span>
        ) : (
          <span className="text-base font-black text-gray-400">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="size-9 ring-1 ring-gray-200">
        <AvatarImage src={entry.profile.avatar_url ?? undefined} />
        <AvatarFallback className="bg-gray-100 text-xs font-bold text-gray-600">
          {getInitials(entry.profile)}
        </AvatarFallback>
      </Avatar>

      {/* Name + team */}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", isCurrentUser ? "text-red-600" : "text-gray-800")}>
          {entry.profile.display_name ?? entry.profile.username ?? "選手"}
          {isCurrentUser && (
            <span className="ml-1.5 text-[10px] font-normal text-gray-400">（我）</span>
          )}
        </p>
        {teamInfo && (
          <div className="mt-0.5">
            <TeamBadge team={teamInfo} size="sm" />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-right">
        <p className="text-lg font-black tabular-nums text-gray-900">{value}</p>
        <p className="text-[10px] text-gray-500">{unit}</p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");

  useEffect(() => {
    async function fetchLeaderboard() {
      const supabase = createClient();
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        // Fetch all profiles with their teams
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*, team:teams(*)")
          .order("sc_balance", { ascending: false });

        if (!profiles) return;

        // Fetch aggregated activity data for all users
        const { data: activityAggs } = await supabase
          .from("activities")
          .select("user_id, distance_km, sc_earned, start_date");

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);

        const entryList: LeaderboardEntry[] = (profiles as Profile[]).map((profile) => {
          const userActivities = (activityAggs ?? []).filter(
            (a) => a.user_id === profile.id
          );

          const relevantActivities =
            timePeriod === "weekly"
              ? userActivities.filter(
                  (a) => new Date(a.start_date) >= weekStart
                )
              : userActivities;

          const totalKm = relevantActivities.reduce(
            (sum, a) => sum + (a.distance_km ?? 0),
            0
          );
          const totalSCEarned = relevantActivities.reduce(
            (sum, a) => sum + (a.sc_earned ?? 0),
            0
          );

          // Calculate current streak from activity dates
          const dateDaySet = new Set(
            userActivities.map((a) => format(parseISO(a.start_date), "yyyy-MM-dd"))
          );
          let currentStreak = 0;
          const todayStr = format(new Date(), "yyyy-MM-dd");
          const hasToday = dateDaySet.has(todayStr);
          const startCheck = hasToday ? new Date() : new Date(Date.now() - 86400000);
          const startCheckStr = format(startCheck, "yyyy-MM-dd");
          if (dateDaySet.has(startCheckStr)) {
            currentStreak = 1;
            let checkDate = new Date(startCheck);
            for (let i = 1; i <= 365; i++) {
              checkDate = new Date(checkDate.getTime() - 86400000);
              if (dateDaySet.has(format(checkDate, "yyyy-MM-dd"))) {
                currentStreak++;
              } else {
                break;
              }
            }
          }

          return {
            profile,
            totalKm,
            totalSCEarned,
            currentStreak,
          };
        });

        setEntries(entryList);
      } catch (err) {
        console.error("LeaderboardPage: failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [timePeriod]);

  const filteredEntries = useMemo(() => {
    if (teamFilter === "all") return entries;
    return entries.filter((e) => {
      const name = e.profile.team?.name?.toLowerCase() ?? "";
      return teamFilter === "red" ? name.includes("red") : name.includes("white") || name.includes("bear");
    });
  }, [entries, teamFilter]);

  const sortedByDistance = useMemo(
    () => [...filteredEntries].sort((a, b) => b.totalKm - a.totalKm),
    [filteredEntries]
  );

  const sortedBySC = useMemo(
    () => [...filteredEntries].sort((a, b) => b.totalSCEarned - a.totalSCEarned),
    [filteredEntries]
  );

  const sortedByStreak = useMemo(
    () => [...filteredEntries].sort((a, b) => b.currentStreak - a.currentStreak),
    [filteredEntries]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg bg-gray-200" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-yellow-500" />
          <h1 className="text-lg font-black text-gray-900">排行榜</h1>
        </div>

        {/* Weekly / All-time toggle */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-1 gap-1 shadow-sm">
          {(["weekly", "all-time"] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors",
                timePeriod === period
                  ? "bg-red-600 text-white"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              {period === "weekly" ? "本週" : "總累計"}
            </button>
          ))}
        </div>
      </div>

      {/* Team filter */}
      <div className="flex gap-2">
        {(["all", "red", "white"] as TeamFilter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant="outline"
            onClick={() => setTeamFilter(f)}
            className={cn(
              "border-gray-200 text-sm font-medium capitalize",
              teamFilter === f
                ? f === "red"
                  ? "border-red-400 bg-red-50 text-red-600"
                  : f === "white"
                  ? "border-gray-400 bg-gray-50 text-gray-700"
                  : "border-gray-400 bg-gray-100 text-gray-800"
                : "bg-white text-gray-500 hover:text-gray-800"
            )}
          >
            {f === "all" ? "全部" : f === "red" ? "🐂 紅牛隊" : "🐻‍❄️ 白熊隊"}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="distance">
        <TabsList className="w-full border border-gray-200 bg-white shadow-sm">
          <TabsTrigger
            value="distance"
            className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            距離
          </TabsTrigger>
          <TabsTrigger
            value="sc-earned"
            className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            賺取 $SC
          </TabsTrigger>
          <TabsTrigger
            value="streak"
            className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            連續天數
          </TabsTrigger>
        </TabsList>

        <TabsContent value="distance" className="mt-4">
          {sortedByDistance.length === 0 ? (
            <Card className="border-gray-200 bg-white">
              <CardContent className="py-10 text-center text-sm text-gray-500">
                暫無資料
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedByDistance.map((entry, idx) => (
                <LeaderboardRow
                  key={entry.profile.id}
                  entry={entry}
                  rank={idx + 1}
                  value={entry.totalKm.toFixed(1)}
                  unit="公里"
                  isCurrentUser={entry.profile.id === currentUserId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sc-earned" className="mt-4">
          {sortedBySC.length === 0 ? (
            <Card className="border-gray-200 bg-white">
              <CardContent className="py-10 text-center text-sm text-gray-500">
                暫無資料
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedBySC.map((entry, idx) => (
                <LeaderboardRow
                  key={entry.profile.id}
                  entry={entry}
                  rank={idx + 1}
                  value={formatSC(entry.totalSCEarned)}
                  unit="已賺取"
                  isCurrentUser={entry.profile.id === currentUserId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="streak" className="mt-4">
          {sortedByStreak.length === 0 ? (
            <Card className="border-gray-200 bg-white">
              <CardContent className="py-10 text-center text-sm text-gray-500">
                暫無資料
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedByStreak.map((entry, idx) => (
                <LeaderboardRow
                  key={entry.profile.id}
                  entry={entry}
                  rank={idx + 1}
                  value={String(entry.currentStreak)}
                  unit="天連續"
                  isCurrentUser={entry.profile.id === currentUserId}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
