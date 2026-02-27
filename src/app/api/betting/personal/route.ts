import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { calculateOdds, calculatePotentialPayout } from "@/lib/betting/personal";
import { BetType, BetStatus, TransactionType } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns an authenticated Supabase client for the current request. */
async function getSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateBetBody {
  betType: BetType;
  targetValue: number;
  stake: number;
  endDate: string;
}

// ---------------------------------------------------------------------------
// GET — Fetch personal bets for the authenticated user
// ---------------------------------------------------------------------------

/**
 * Returns a list of the authenticated user's personal bets.
 *
 * Query params:
 *  - status: "active" | "all"  (defaults to "all")
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await getSessionClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const adminClient = createAdminClient();
    let query = adminClient
      .from("personal_bets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Filter to only pending/active bets when requested
    if (statusFilter === "active") {
      query = query.eq("status", BetStatus.PENDING);
    }

    const { data: bets, error } = await query;

    if (error) {
      console.error("[betting/personal GET] DB error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bets });
  } catch (err) {
    console.error("[betting/personal GET] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Place a new personal bet
// ---------------------------------------------------------------------------

/**
 * Creates a new personal performance bet and deducts the stake from the
 * user's $SC balance.
 *
 * Body: { betType, targetValue, stake, endDate }
 *
 * Odds are calculated based on how ambitious the target is relative to the
 * user's average distance per run over the active season.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await getSessionClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateBetBody;

    // Validate required fields
    if (
      !body.betType ||
      body.targetValue == null ||
      body.stake == null ||
      !body.endDate
    ) {
      return NextResponse.json(
        { error: "betType, targetValue, stake, and endDate are required" },
        { status: 400 }
      );
    }

    if (body.stake <= 0) {
      return NextResponse.json(
        { error: "Stake must be greater than 0" },
        { status: 400 }
      );
    }

    if (body.targetValue <= 0) {
      return NextResponse.json(
        { error: "Target value must be greater than 0" },
        { status: 400 }
      );
    }

    if (!Object.values(BetType).includes(body.betType)) {
      return NextResponse.json(
        { error: `Invalid betType. Must be one of: ${Object.values(BetType).join(", ")}` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // ------------------------------------------------------------------
    // Validate the user has sufficient SC balance
    // ------------------------------------------------------------------
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("sc_balance")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.sc_balance < body.stake) {
      return NextResponse.json(
        { error: "Insufficient $SC balance" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // Calculate odds from the user's activity history in the active season
    // ------------------------------------------------------------------
    const { data: season } = await adminClient
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    if (!season) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 400 }
      );
    }

    const { data: activities } = await adminClient
      .from("activities")
      .select("distance_km")
      .eq("user_id", user.id)
      .eq("season_id", season.id);

    // Compute average distance to anchor the odds calculation
    const totalKm = (activities ?? []).reduce(
      (sum, a) => sum + (a.distance_km ?? 0),
      0
    );
    const averageKm =
      activities && activities.length > 0 ? totalKm / activities.length : 0;

    const odds = calculateOdds(body.targetValue, averageKm, body.betType);
    const potentialPayout = calculatePotentialPayout(body.stake, odds);

    // ------------------------------------------------------------------
    // Deduct the stake via process_sc_transaction RPC
    // ------------------------------------------------------------------
    const { error: txError } = await adminClient.rpc(
      "process_sc_transaction",
      {
        p_user_id: user.id,
        p_season_id: season.id,
        p_type: TransactionType.BET_PLACED,
        p_amount: -body.stake,
        p_reference_id: null,
        p_description: `Bet stake: ${body.stake} $SC on ${body.betType} ${body.targetValue} km`,
      }
    );

    if (txError) {
      console.error("[betting/personal POST] Stake deduction failed:", txError);
      return NextResponse.json(
        { error: "Failed to deduct stake" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------
    // Persist the bet record
    // ------------------------------------------------------------------
    const { data: bet, error: betError } = await adminClient
      .from("personal_bets")
      .insert({
        user_id: user.id,
        season_id: season.id,
        bet_type: body.betType,
        target_value: body.targetValue,
        current_value: 0,
        stake: body.stake,
        odds,
        potential_payout: potentialPayout,
        status: BetStatus.PENDING,
        period_start: new Date().toISOString(),
        period_end: new Date(body.endDate).toISOString(),
      })
      .select("*")
      .single();

    if (betError || !bet) {
      console.error("[betting/personal POST] Insert failed:", betError);
      return NextResponse.json(
        { error: "Failed to create bet" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bet }, { status: 201 });
  } catch (err) {
    console.error("[betting/personal POST] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
