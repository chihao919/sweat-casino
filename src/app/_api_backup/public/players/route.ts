import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/players
 *
 * Returns a list of registered players with their team assignment status.
 * This is a public endpoint — no auth required.
 */
export async function GET() {
  const supabase = createAdminClient();

  // Fetch all profiles with team info
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, team_id, sc_balance, total_distance_km, total_activities, current_streak, longest_streak, is_strava_connected, referral_count, created_at, teams(id, name, color, emoji)")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch players", details: error.message },
      { status: 500 }
    );
  }

  // Fetch team info for summary
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, color, emoji");

  const teamCounts: Record<string, number> = {};
  const teamDistances: Record<string, number> = {};
  const unassigned = (profiles || []).filter((p) => !p.team_id).length;

  for (const team of teams || []) {
    const members = (profiles || []).filter((p) => p.team_id === team.id);
    teamCounts[team.name] = members.length;
    teamDistances[team.name] = members.reduce(
      (sum, p) => sum + (Number(p.total_distance_km) || 0),
      0
    );
  }

  return NextResponse.json({
    total: profiles?.length ?? 0,
    unassigned,
    teamCounts,
    teamDistances,
    teams: teams || [],
    players: (profiles || []).map((p) => ({
      id: p.id,
      displayName: p.display_name || "匿名玩家",
      avatarUrl: p.avatar_url,
      teamId: p.team_id,
      team: p.teams,
      totalDistanceKm: p.total_distance_km ?? 0,
      totalActivities: p.total_activities ?? 0,
      currentStreak: p.current_streak ?? 0,
      longestStreak: p.longest_streak ?? 0,
      scBalance: p.sc_balance ?? 0,
      isStravaConnected: p.is_strava_connected ?? false,
      referralCount: p.referral_count ?? 0,
      joinedAt: p.created_at,
    })),
  });
}
