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
    .select("id, display_name, avatar_url, team_id, sc_balance, created_at, teams(id, name, color, emoji)")
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
  const unassigned = (profiles || []).filter((p) => !p.team_id).length;

  for (const team of teams || []) {
    teamCounts[team.name] = (profiles || []).filter(
      (p) => p.team_id === team.id
    ).length;
  }

  return NextResponse.json({
    total: profiles?.length ?? 0,
    unassigned,
    teamCounts,
    teams: teams || [],
    players: (profiles || []).map((p) => ({
      id: p.id,
      displayName: p.display_name || "匿名玩家",
      avatarUrl: p.avatar_url,
      teamId: p.team_id,
      team: p.teams,
      joinedAt: p.created_at,
    })),
  });
}
