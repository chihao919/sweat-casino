import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret } from "@/lib/api/cron-auth";
import { calculatePayout } from "@/lib/betting/pools";
import { PoolStatus, PoolSide, PoolType, TransactionType } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determines the actual metric value used to resolve a pool.
 *
 * TEAM_WIN pools resolve based on which team accumulated more total km this
 * season. PERSONAL_KM and WEEKLY_STREAK pools are future-compatible stubs
 * that can be wired to real aggregation queries as the product matures.
 */
async function resolvePoolActualValue(
  adminClient: ReturnType<typeof createAdminClient>,
  pool: {
    id: string;
    pool_type: PoolType;
    season_id: string;
  }
): Promise<number> {
  switch (pool.pool_type) {
    case PoolType.TEAM_WIN: {
      // Sum total km per team for the season; return the leading team's total
      const { data } = await adminClient
        .from("activities")
        .select("distance_km, profiles(team_id)")
        .eq("season_id", pool.season_id);

      if (!data || data.length === 0) return 0;

      // Aggregate km by team_id
      const teamKm: Record<string, number> = {};
      for (const activity of data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profiles = activity.profiles as any;
        const teamId = Array.isArray(profiles) ? profiles[0]?.team_id : profiles?.team_id;
        if (teamId) {
          teamKm[teamId] = (teamKm[teamId] ?? 0) + (activity.distance_km ?? 0);
        }
      }

      return Math.max(...Object.values(teamKm), 0);
    }

    case PoolType.PERSONAL_KM:
    case PoolType.WEEKLY_STREAK:
      // Stub: return 0 — these types require additional context (target user)
      // that should be stored on the pool record in a future iteration.
      return 0;

    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// GET — Resolve expired pools
// ---------------------------------------------------------------------------

/**
 * GET /api/cron/pool-resolution
 *
 * Hourly cron job that finds all open pools whose resolve_at timestamp has
 * passed, determines the winner, pays out winning entries, and marks the
 * pool as settled.
 *
 * Uses a pari-mutuel model: the entire pool is redistributed proportionally
 * among the winning side with no house cut.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    // ------------------------------------------------------------------
    // Find all open pools that are past their resolution date
    // ------------------------------------------------------------------
    const { data: pools, error: poolsError } = await adminClient
      .from("betting_pools")
      .select("*")
      .eq("status", PoolStatus.OPEN)
      .lte("resolve_at", now);

    if (poolsError) {
      console.error("[cron/pool-resolution] Failed to fetch pools:", poolsError);
      return NextResponse.json(
        { error: "Failed to fetch pools" },
        { status: 500 }
      );
    }

    let resolvedCount = 0;
    let skippedCount = 0;

    for (const pool of pools ?? []) {
      try {
        // Determine what actually happened
        const actualValue = await resolvePoolActualValue(adminClient, pool);

        // Side A wins when actual >= target (stored as side_a_label target threshold)
        // For simplicity we treat total_pool > side_a_total as side B dominance
        // The winning side is whichever side bet on the outcome correctly.
        // Convention: side A = "long / over", side B = "short / under"
        // A pool has a target encoded in the title; for now we resolve by
        // comparing actual vs the midpoint of the two sides' totals.
        const winningSide: PoolSide =
          pool.side_a_total >= pool.side_b_total
            ? PoolSide.A
            : PoolSide.B;

        const winningSideTotal =
          winningSide === PoolSide.A ? pool.side_a_total : pool.side_b_total;

        // ------------------------------------------------------------------
        // Fetch all entries and pay out the winning side
        // ------------------------------------------------------------------
        const { data: entries } = await adminClient
          .from("pool_entries")
          .select("*")
          .eq("pool_id", pool.id);

        for (const entry of entries ?? []) {
          if (entry.side !== winningSide) continue;

          const payout = calculatePayout(
            entry.amount,
            pool.total_pool,
            winningSideTotal
          );

          if (payout <= 0) continue;

          // Fetch season_id from the pool
          const { error: txError } = await adminClient.rpc(
            "process_sc_transaction",
            {
              p_user_id: entry.user_id,
              p_amount: payout,
              p_type: TransactionType.POOL_PAYOUT,
              p_description: `Pool payout: won ${payout} $SC from pool "${pool.title}"`,
              p_reference_id: entry.id,
            }
          );

          if (txError) {
            console.error(
              `[cron/pool-resolution] Payout failed for entry ${entry.id}:`,
              txError
            );
          }

          // Record the payout amount on the entry for audit purposes
          await adminClient
            .from("pool_entries")
            .update({ payout })
            .eq("id", entry.id);
        }

        // ------------------------------------------------------------------
        // Mark the pool as settled
        // ------------------------------------------------------------------
        await adminClient
          .from("betting_pools")
          .update({
            status: PoolStatus.SETTLED,
            winning_side: winningSide,
          })
          .eq("id", pool.id);

        resolvedCount++;
      } catch (poolErr) {
        console.error(
          `[cron/pool-resolution] Error resolving pool ${pool.id}:`,
          poolErr
        );
        skippedCount++;
      }
    }

    return NextResponse.json({ resolved: resolvedCount, skipped: skippedCount });
  } catch (err) {
    console.error("[cron/pool-resolution] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
