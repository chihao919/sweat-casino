import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret } from "@/lib/api/cron-auth";
import {
  calculateActivityRate,
  calculateAdjustedScore,
} from "@/lib/teams/activity-rate";

// Number of milliseconds in one week
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns the ISO week number (1–53) for a given date.
 *
 * Uses ISO 8601 definition where week 1 is the week containing the first
 * Thursday of the year.
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
}

/**
 * GET /api/cron/weekly-snapshot
 *
 * Runs at 23:59 every Sunday (UTC). Calculates each team's activity rate and
 * adjusted score for the past week and upserts a weekly_snapshot record.
 *
 * The adjusted score penalises teams with many inactive members, encouraging
 * everyone to contribute rather than relying on a few high-mileage runners.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const adminClient = createAdminClient();

    // ------------------------------------------------------------------
    // Resolve the active season
    // ------------------------------------------------------------------
    const { data: season, error: seasonError } = await adminClient
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    if (seasonError || !season) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------
    // Resolve week boundaries
    // ------------------------------------------------------------------
    const now = new Date();
    const weekEnd = now.toISOString();
    const weekStart = new Date(now.getTime() - ONE_WEEK_MS).toISOString();
    const weekNumber = getISOWeekNumber(now);

    // ------------------------------------------------------------------
    // Fetch all teams in the active season
    // ------------------------------------------------------------------
    const { data: teams, error: teamsError } = await adminClient
      .from("teams")
      .select("id, name")
      .eq("season_id", season.id);

    if (teamsError || !teams) {
      console.error("[cron/weekly-snapshot] Failed to fetch teams:", teamsError);
      return NextResponse.json(
        { error: "Failed to fetch teams" },
        { status: 500 }
      );
    }

    const snapshots = [];

    for (const team of teams) {
      // Total members on this team
      const { count: totalMembers } = await adminClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("team_id", team.id);

      // Members who ran at least once this week
      const { data: weeklyActivities } = await adminClient
        .from("activities")
        .select("user_id, distance_km")
        .eq("season_id", season.id)
        .gte("activity_date", weekStart)
        .lte("activity_date", weekEnd)
        .in(
          "user_id",
          // Sub-select: all user ids on this team
          (
            await adminClient
              .from("profiles")
              .select("id")
              .eq("team_id", team.id)
          ).data?.map((p) => p.id) ?? []
        );

      const activities = weeklyActivities ?? [];
      const activeUserIds = new Set(activities.map((a) => a.user_id));
      const activeMembers = activeUserIds.size;
      const totalKm = activities.reduce((sum, a) => sum + (a.distance_km ?? 0), 0);
      const membersCount = totalMembers ?? 0;

      const activityRate = calculateActivityRate(activeMembers, membersCount);
      const adjustedScore = calculateAdjustedScore(
        totalKm,
        activeMembers,
        membersCount
      );

      // Upsert so re-runs on the same week are idempotent
      const { data: snapshot } = await adminClient
        .from("weekly_snapshots")
        .upsert(
          {
            season_id: season.id,
            team_id: team.id,
            week_number: weekNumber,
            week_start: weekStart,
            week_end: weekEnd,
            total_km: Math.round(totalKm * 100) / 100,
            active_members: activeMembers,
            total_members: membersCount,
            activity_rate: Math.round(activityRate * 10000) / 10000,
            adjusted_score: Math.round(adjustedScore * 100) / 100,
          },
          { onConflict: "season_id,team_id,week_number" }
        )
        .select("*")
        .single();

      snapshots.push(snapshot);
    }

    return NextResponse.json({ weekNumber, snapshots });
  } catch (err) {
    console.error("[cron/weekly-snapshot] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
