import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret } from "@/lib/api/cron-auth";
import { calculateSurvivalTax, isExemptFromTax } from "@/lib/sc/survival-tax";
import { TransactionType } from "@/types";

// Number of milliseconds in one week — used to calculate the start of the
// current billing window (Monday 00:00 UTC to now)
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * GET /api/cron/survival-tax
 *
 * Weekly cron job (every Monday at 00:00 UTC) that applies the survival tax
 * to all users who did not meet the minimum weekly distance requirement.
 *
 * The tax creates deflationary pressure on the $SC economy, encouraging
 * consistent running rather than passive balance accumulation.
 *
 * Authorized by the Vercel cron Authorization header: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const adminClient = createAdminClient();

    // ------------------------------------------------------------------
    // Load the active season and its economy config
    // ------------------------------------------------------------------
    const { data: season, error: seasonError } = await adminClient
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .single();

    if (seasonError || !season) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 404 }
      );
    }

    const config = season.config;
    const minKmForExemption: number = config.survival_tax_min_km;
    const taxRate: number = config.survival_tax_rate;

    // ------------------------------------------------------------------
    // Calculate the start of the current week window (last 7 days)
    // ------------------------------------------------------------------
    const weekStart = new Date(Date.now() - ONE_WEEK_MS).toISOString();

    // ------------------------------------------------------------------
    // Fetch all profiles with a positive balance
    // ------------------------------------------------------------------
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, sc_balance")
      .gt("sc_balance", 0);

    if (profilesError) {
      console.error("[cron/survival-tax] Failed to fetch profiles:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch profiles" },
        { status: 500 }
      );
    }

    let taxedCount = 0;
    let exemptCount = 0;
    let totalTaxCollected = 0;

    for (const profile of profiles ?? []) {
      // Query how many km this user ran in the last 7 days
      const { data: weeklyActivities } = await adminClient
        .from("activities")
        .select("distance_km")
        .eq("user_id", profile.id)
        .eq("season_id", season.id)
        .gte("start_date", weekStart);

      const weeklyKm = (weeklyActivities ?? []).reduce(
        (sum, a) => sum + (a.distance_km ?? 0),
        0
      );

      if (isExemptFromTax(weeklyKm, minKmForExemption)) {
        exemptCount++;
        continue;
      }

      // User did not meet the minimum — charge them survival tax
      const taxAmount = calculateSurvivalTax(profile.sc_balance, taxRate);

      const { error: txError } = await adminClient.rpc(
        "process_sc_transaction",
        {
          p_user_id: profile.id,
          p_amount: -taxAmount,
          p_type: TransactionType.SURVIVAL_TAX,
          p_description: `Weekly survival tax: ran ${weeklyKm.toFixed(2)} km (min: ${minKmForExemption} km)`,
        }
      );

      if (txError) {
        console.error(
          `[cron/survival-tax] Tax transaction failed for user ${profile.id}:`,
          txError
        );
        continue;
      }

      taxedCount++;
      totalTaxCollected += taxAmount;
    }

    return NextResponse.json({
      taxed: taxedCount,
      exempt: exemptCount,
      totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
    });
  } catch (err) {
    console.error("[cron/survival-tax] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
