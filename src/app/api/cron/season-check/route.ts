import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret } from "@/lib/api/cron-auth";
import { TransactionType } from "@/types";

// Bonus awarded to every member of the winning team at the end of a season
const SEASON_WIN_BONUS = 500;

/**
 * GET /api/cron/season-check
 *
 * Daily cron job (00:00 UTC) that manages season lifecycle transitions:
 *
 *  1. END CHECK — If the active season's end_date has passed:
 *     - Mark the season as inactive (is_active = false).
 *     - Award a season-end bonus to every member of the winning team
 *       (determined by which team has the higher adjusted score).
 *
 *  2. START CHECK — If a scheduled season's start_date has arrived:
 *     - Mark that season as active (is_active = true).
 *
 * Only one season should be active at any given time. The two checks run
 * sequentially so that an ending season is fully closed before a new one
 * potentially opens in the same run.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    let seasonEnded = false;
    let seasonStarted = false;
    let endedSeasonId: string | null = null;
    let startedSeasonId: string | null = null;

    // ------------------------------------------------------------------
    // 1. End the active season if its end_date has passed
    // ------------------------------------------------------------------
    const { data: activeSeason } = await adminClient
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .single();

    if (activeSeason && activeSeason.end_date <= now) {
      // Deactivate the season
      await adminClient
        .from("seasons")
        .update({ is_active: false })
        .eq("id", activeSeason.id);

      seasonEnded = true;
      endedSeasonId = activeSeason.id;

      // Find the winning team by comparing total km across all activities
      const { data: activities } = await adminClient
        .from("activities")
        .select("user_id, distance_km, profiles(team_id)")
        .eq("season_id", activeSeason.id);

      // Aggregate total km per team
      const teamKm: Record<string, number> = {};
      for (const activity of activities ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profiles = activity.profiles as any;
        const teamId = Array.isArray(profiles) ? profiles[0]?.team_id : profiles?.team_id;
        if (teamId) {
          teamKm[teamId] = (teamKm[teamId] ?? 0) + (activity.distance_km ?? 0);
        }
      }

      const winningTeamId = Object.entries(teamKm).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0];

      if (winningTeamId) {
        // Fetch all members of the winning team
        const { data: winners } = await adminClient
          .from("profiles")
          .select("id")
          .eq("team_id", winningTeamId);

        // Award season win bonus to each member
        for (const winner of winners ?? []) {
          const { error: txError } = await adminClient.rpc(
            "process_sc_transaction",
            {
              p_user_id: winner.id,
              p_season_id: activeSeason.id,
              p_type: TransactionType.SIGNUP_BONUS, // Reused as a general bonus type
              p_amount: SEASON_WIN_BONUS,
              p_reference_id: activeSeason.id,
              p_description: `Season win bonus: ${SEASON_WIN_BONUS} $SC for winning season "${activeSeason.name}"`,
            }
          );

          if (txError) {
            console.error(
              `[cron/season-check] Failed to award bonus to user ${winner.id}:`,
              txError
            );
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // 2. Activate a pending season whose start_date has arrived
    // ------------------------------------------------------------------
    const { data: pendingSeason } = await adminClient
      .from("seasons")
      .select("id, start_date, end_date")
      .eq("is_active", false)
      .lte("start_date", now)
      .gt("end_date", now)
      .order("start_date", { ascending: true })
      .limit(1)
      .single();

    if (pendingSeason) {
      await adminClient
        .from("seasons")
        .update({ is_active: true })
        .eq("id", pendingSeason.id);

      seasonStarted = true;
      startedSeasonId = pendingSeason.id;
    }

    return NextResponse.json({
      seasonEnded,
      endedSeasonId,
      seasonStarted,
      startedSeasonId,
    });
  } catch (err) {
    console.error("[cron/season-check] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
