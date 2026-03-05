import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateSCEarned } from "@/lib/sc/engine";
import { TransactionType } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MockActivityRequestBody {
  userId: string;
  distanceKm?: number;
  durationMinutes?: number;
  withWeatherBonus?: boolean;
}

// ---------------------------------------------------------------------------
// Constants — sensible defaults for generated mock activities
// ---------------------------------------------------------------------------

const DEFAULT_DISTANCE_KM = 5;
const DEFAULT_DURATION_MINUTES = 30;

// OWM code 502 = heavy rain, which always triggers the weather bonus
const HEAVY_RAIN_CODE = 502;
const WEATHER_BONUS_MULTIPLIER = 1.5;

/**
 * POST /api/mock/activity
 *
 * Development-only endpoint that simulates a Strava activity being submitted
 * by a user. Useful for manual testing without a real Strava connection.
 *
 * Protected: accessible only in development (NODE_ENV !== 'production') or
 * when the correct CRON_SECRET bearer token is provided.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Enforce access control: dev-only or authenticated via CRON_SECRET
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("Authorization");

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const body = (await request.json()) as MockActivityRequestBody;

    if (!body.userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // ------------------------------------------------------------------
    // Fetch the target user and active season
    // ------------------------------------------------------------------
    const [profileResult, seasonResult] = await Promise.all([
      adminClient
        .from("profiles")
        .select("*")
        .eq("id", body.userId)
        .single(),
      adminClient
        .from("seasons")
        .select("*")
        .eq("is_active", true)
        .single(),
    ]);

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (seasonResult.error || !seasonResult.data) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 404 }
      );
    }

    const profile = profileResult.data;
    const season = seasonResult.data;
    const config = season.config;

    const distanceKm = body.distanceKm ?? DEFAULT_DISTANCE_KM;
    const durationMinutes = body.durationMinutes ?? DEFAULT_DURATION_MINUTES;
    const durationSeconds = durationMinutes * 60;
    const pacePerKm = distanceKm > 0 ? durationMinutes / distanceKm : 0;
    const weatherMultiplier = body.withWeatherBonus ? WEATHER_BONUS_MULTIPLIER : 1.0;

    const scEarned = calculateSCEarned(distanceKm, weatherMultiplier, config);
    const now = new Date().toISOString();

    // ------------------------------------------------------------------
    // Optionally create a mock weather record
    // ------------------------------------------------------------------
    let weatherRecordId: string | null = null;
    let weatherCode: number | null = null;
    let weatherDescription: string | null = null;
    let temperature: number | null = null;
    let windSpeed: number | null = null;

    if (body.withWeatherBonus) {
      // Simulate heavy rain at a generic location
      weatherCode = HEAVY_RAIN_CODE;
      weatherDescription = "heavy intensity rain";
      temperature = 18;
      windSpeed = 5;

      const { data: weatherRecord } = await adminClient
        .from("weather_records")
        .insert({
          recorded_at: now,
          latitude: 25.0478,
          longitude: 121.5318,
          weather_code: HEAVY_RAIN_CODE,
          weather_main: "Rain",
          weather_description: weatherDescription,
          temperature,
          wind_speed: windSpeed,
          bonus_multiplier: WEATHER_BONUS_MULTIPLIER,
          bonus_reason: "Heavy Rain",
        })
        .select("id")
        .single();

      weatherRecordId = weatherRecord?.id ?? null;
    }

    // ------------------------------------------------------------------
    // Insert the mock activity
    // ------------------------------------------------------------------
    const { data: activity, error: activityError } = await adminClient
      .from("activities")
      .insert({
        user_id: body.userId,
        season_id: season.id,
        strava_activity_id: null,
        distance_km: distanceKm,
        duration_seconds: durationSeconds,
        pace_per_km: pacePerKm,
        activity_date: now,
        weather_code: weatherCode,
        weather_description: weatherDescription,
        temperature,
        wind_speed: windSpeed,
        weather_multiplier: weatherMultiplier,
        sc_earned: scEarned,
        is_manual: true,
      })
      .select("*")
      .single();

    if (activityError || !activity) {
      console.error("[mock/activity] Failed to insert activity:", activityError);
      return NextResponse.json(
        { error: "Failed to create activity" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------
    // Record the $SC transaction
    // ------------------------------------------------------------------
    await adminClient.rpc("process_sc_transaction", {
      p_user_id: body.userId,
      p_amount: scEarned,
      p_type: TransactionType.ACTIVITY_REWARD,
      p_description: `Mock activity: earned ${scEarned} $SC for ${distanceKm.toFixed(2)} km`,
      p_reference_id: activity.id,
    });

    if (body.withWeatherBonus && weatherRecordId) {
      const baseScEarned = calculateSCEarned(distanceKm, 1.0, config);
      const bonusAmount = Math.round((scEarned - baseScEarned) * 100) / 100;

      if (bonusAmount > 0) {
        await adminClient.rpc("process_sc_transaction", {
          p_user_id: body.userId,
          p_amount: bonusAmount,
          p_type: TransactionType.WEATHER_BONUS,
          p_description: `Mock weather bonus (Heavy Rain) for activity ${activity.id}`,
          p_reference_id: weatherRecordId,
        });
      }
    }

    // ------------------------------------------------------------------
    // Update profile aggregate stats
    // ------------------------------------------------------------------
    await adminClient
      .from("profiles")
      .update({
        total_distance_km: (profile.total_distance_km ?? 0) + distanceKm,
        total_activities: (profile.total_activities ?? 0) + 1,
        last_active_at: now,
        updated_at: now,
      })
      .eq("id", body.userId);

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err) {
    console.error("[mock/activity] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
