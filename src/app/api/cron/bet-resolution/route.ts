import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret } from "@/lib/api/cron-auth";
import { TransactionType, BetStatus } from "@/types";

/**
 * GET /api/cron/bet-resolution
 *
 * Hourly cron job that resolves personal bets whose end_date has passed.
 *
 * Resolution rules:
 *  - Won:  current_value >= target_value → pay out (stake * odds)
 *  - Lost: current_value < target_value  → no payout (stake already deducted at placement)
 *
 * Both outcomes set resolved_at to the current timestamp and update the
 * bet status from PENDING to WON or LOST.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    // ------------------------------------------------------------------
    // Find all active bets that have passed their end date
    // ------------------------------------------------------------------
    const { data: expiredBets, error: betsError } = await adminClient
      .from("personal_bets")
      .select("*")
      .eq("status", BetStatus.PENDING)
      .lte("period_end", now);

    if (betsError) {
      console.error("[cron/bet-resolution] Failed to fetch bets:", betsError);
      return NextResponse.json(
        { error: "Failed to fetch bets" },
        { status: 500 }
      );
    }

    let wonCount = 0;
    let lostCount = 0;

    for (const bet of expiredBets ?? []) {
      const hasWon = bet.current_value >= bet.target_value;
      const newStatus = hasWon ? BetStatus.WON : BetStatus.LOST;

      try {
        // Pay out winners
        if (hasWon) {
          const { error: txError } = await adminClient.rpc(
            "process_sc_transaction",
            {
              p_user_id: bet.user_id,
              p_season_id: bet.season_id,
              p_type: TransactionType.BET_WON,
              p_amount: bet.potential_payout,
              p_reference_id: bet.id,
              p_description: `Bet won: ${bet.potential_payout} $SC payout (${bet.current_value.toFixed(2)} km vs target ${bet.target_value} km)`,
            }
          );

          if (txError) {
            console.error(
              `[cron/bet-resolution] Payout failed for bet ${bet.id}:`,
              txError
            );
            continue;
          }

          wonCount++;
        } else {
          lostCount++;
        }

        // Update bet status regardless of win/loss
        await adminClient
          .from("personal_bets")
          .update({
            status: newStatus,
            resolved_at: now,
          })
          .eq("id", bet.id);
      } catch (betErr) {
        console.error(
          `[cron/bet-resolution] Error resolving bet ${bet.id}:`,
          betErr
        );
      }
    }

    return NextResponse.json({ won: wonCount, lost: lostCount });
  } catch (err) {
    console.error("[cron/bet-resolution] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
