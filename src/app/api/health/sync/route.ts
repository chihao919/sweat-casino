import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateSCEarned } from "@/lib/sc/engine";
import { TransactionType } from "@/types";

/**
 * POST /api/health/sync
 *
 * Receives running workouts from the native app (HealthKit / Health Connect)
 * and syncs them into the database. This replaces the Strava sync flow.
 *
 * Body: { workouts: Array<{ startDate, endDate, duration, distance, sourceName }> }
 * - distance is in meters
 * - duration is in seconds
 */
// Handle CORS preflight for native app requests from capacitor://localhost
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: NextRequest) {
  // Support both cookie-based auth (web) and Bearer token auth (native app)
  const authHeader = request.headers.get("authorization");
  let user;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const authAdmin = createAdminClient();
    const { data, error } = await authAdmin.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401, headers: { "Access-Control-Allow-Origin": "*" } });
    }
    user = data.user;
  } else {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const body = await request.json();

  // Support two formats:
  // 1. { workouts: [...] } — individual workout records
  // 2. { distanceKm, startDate, endDate } — aggregate distance from HealthKit readSamples
  let workouts = body.workouts;

  if (!workouts && body.distanceKm) {
    // Convert aggregate distance to a single workout entry
    workouts = [{
      startDate: body.startDate,
      endDate: body.endDate,
      duration: 0,
      distance: body.distanceKm * 1000, // convert km to meters
      sourceName: body.source || "HealthKit",
    }];
  }

  if (!Array.isArray(workouts) || workouts.length === 0) {
    return NextResponse.json({ error: "No workouts provided" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get active season
  const { data: season } = await admin
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!season) {
    return NextResponse.json({ error: "No active season" }, { status: 400 });
  }

  const config = season.config ?? {
    sc_per_km: 5,
    survival_tax_rate: 0.1,
    survival_tax_min_km: 10,
    weather_multiplier: 1.5,
  };

  // Get existing activities to avoid duplicates (match by start_date)
  const { data: existingActivities } = await admin
    .from("activities")
    .select("start_date")
    .eq("user_id", user.id);

  const existingDates = new Set(
    (existingActivities || []).map((a) => a.start_date)
  );

  let synced = 0;

  for (const workout of workouts) {
    // Skip duplicates by matching start_date
    if (existingDates.has(workout.startDate)) continue;

    const distanceKm = workout.distance / 1000;

    // Skip very short activities (less than 0.1 km)
    if (distanceKm < 0.1) continue;

    const pacePerKm =
      distanceKm > 0 ? workout.duration / 60 / distanceKm : 0;

    const scEarned = calculateSCEarned(distanceKm, 1.0, config);

    const { data: activity, error: activityError } = await admin
      .from("activities")
      .insert({
        user_id: user.id,
        season_id: season.id,
        strava_activity_id: null,
        name: `Run (${workout.sourceName || "Health"})`,
        distance_km: distanceKm,
        duration_seconds: workout.duration,
        pace_per_km: pacePerKm,
        start_date: workout.startDate,
        start_latitude: null,
        start_longitude: null,
        weather_multiplier: 1.0,
        sc_earned: scEarned,
        is_mock: false,
      })
      .select("id")
      .single();

    if (activityError || !activity) {
      console.error("[health/sync] Insert failed:", activityError?.message);
      continue;
    }

    // Record $SC transaction
    await admin.rpc("process_sc_transaction", {
      p_user_id: user.id,
      p_amount: scEarned,
      p_type: TransactionType.ACTIVITY_REWARD,
      p_description: `Earned ${scEarned} $SC for ${distanceKm.toFixed(2)} km run`,
      p_reference_id: activity.id,
    });

    synced++;
  }

  // Update profile aggregate stats
  if (synced > 0) {
    const { data: allActivities } = await admin
      .from("activities")
      .select("distance_km")
      .eq("user_id", user.id);

    const totalDistance = (allActivities || []).reduce(
      (sum, a) => sum + a.distance_km,
      0
    );

    await admin
      .from("profiles")
      .update({
        total_distance_km: totalDistance,
        total_activities: (allActivities || []).length,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  }

  const corsHeaders = { "Access-Control-Allow-Origin": "*" };

  return NextResponse.json({
    synced,
    message:
      synced > 0
        ? `Synced ${synced} new activities from Health`
        : "No new activities to sync",
  }, { headers: corsHeaders });
}
