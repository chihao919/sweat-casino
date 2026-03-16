import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { refreshStravaToken } from "@/lib/strava/auth";
import { getStravaAthleteActivities, StravaRateLimitError } from "@/lib/strava/client";
import { fetchCurrentWeather } from "@/lib/weather/client";
import { evaluateWeatherBonus } from "@/lib/weather/bonus";
import { calculateSCEarned } from "@/lib/sc/engine";
import { TransactionType } from "@/types";

/**
 * POST /api/strava/sync
 *
 * Manually sync recent Strava activities for the logged-in user.
 * Pulls activities from the last 7 days and inserts any that are missing.
 */
export async function POST(): Promise<NextResponse> {
  try {
    // Authenticate user via session cookie
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Fetch user profile with Strava tokens
    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.strava_access_token) {
      return NextResponse.json(
        { error: "Strava not connected" },
        { status: 400 }
      );
    }

    // Refresh token if expired
    let accessToken: string = profile.strava_access_token;
    const expiresAt = profile.strava_token_expires_at
      ? Number(profile.strava_token_expires_at) * 1000
      : 0;

    console.log("[strava/sync] Token expires at:", new Date(expiresAt).toISOString(), "now:", new Date().toISOString(), "expired:", Date.now() >= expiresAt);

    if (Date.now() >= expiresAt) {
      console.log("[strava/sync] Refreshing expired token...");
      const freshTokens = await refreshStravaToken(profile.strava_refresh_token);
      accessToken = freshTokens.access_token;
      console.log("[strava/sync] Token refreshed, new expires_at:", freshTokens.expires_at);

      await adminClient
        .from("profiles")
        .update({
          strava_access_token: freshTokens.access_token,
          strava_refresh_token: freshTokens.refresh_token,
          strava_token_expires_at: freshTokens.expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
    }

    // Get active season
    const { data: season } = await adminClient
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!season) {
      return NextResponse.json(
        { error: "No active season" },
        { status: 400 }
      );
    }

    // Fetch activities from the last 7 days
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 86400000) / 1000);
    console.log("[strava/sync] Fetching activities after:", new Date(sevenDaysAgo * 1000).toISOString());
    const stravaActivities = await getStravaAthleteActivities(
      accessToken,
      sevenDaysAgo
    );

    console.log("[strava/sync] Strava returned", stravaActivities.length, "activities:", stravaActivities.map((a) => ({
      id: a.id,
      type: a.type,
      sport_type: a.sport_type,
      name: a.name,
      distance: a.distance,
      date: a.start_date,
    })));

    // Filter to runs only
    const runs = stravaActivities.filter(
      (a) => (a.type || a.sport_type) === "Run"
    );

    console.log("[strava/sync] After filter:", runs.length, "runs");

    // Get existing strava_activity_ids to avoid duplicates
    const { data: existingActivities } = await adminClient
      .from("activities")
      .select("strava_activity_id")
      .eq("user_id", user.id);

    const existingIds = new Set(
      (existingActivities || []).map((a) => Number(a.strava_activity_id))
    );

    console.log("[strava/sync] Existing activity IDs in DB:", Array.from(existingIds));
    console.log("[strava/sync] Run IDs from Strava:", runs.map((r) => r.id));
    console.log("[strava/sync] New runs to sync:", runs.filter((r) => !existingIds.has(r.id)).map((r) => r.id));

    let synced = 0;
    const config = season.config ?? {
      sc_per_km: 5,
      survival_tax_rate: 0.1,
      survival_tax_min_km: 10,
      weather_multiplier: 1.5,
    };

    for (const run of runs) {
      if (existingIds.has(run.id)) continue;

      const distanceKm = run.distance / 1000;
      const pacePerKm =
        distanceKm > 0 ? run.moving_time / 60 / distanceKm : 0;

      // Weather check (optional)
      let weatherMultiplier = 1.0;
      let weatherCode: number | null = null;
      let weatherDescription: string | null = null;
      let temperature: number | null = null;
      let windSpeed: number | null = null;

      const [startLat, startLng] = run.start_latlng ?? [null, null];

      if (startLat != null && startLng != null) {
        try {
          const weather = await fetchCurrentWeather(startLat, startLng);
          const bonus = evaluateWeatherBonus(
            weather.weather_code,
            weather.temperature,
            weather.wind_speed
          );
          weatherMultiplier = bonus.multiplier;
          weatherCode = weather.weather_code;
          weatherDescription = weather.weather_description;
          temperature = weather.temperature;
          windSpeed = weather.wind_speed;
        } catch {
          // Weather is optional
        }
      }

      const scEarned = calculateSCEarned(distanceKm, weatherMultiplier, config);

      // Insert activity (columns must match DB schema in 002_profiles_activities.sql)
      const [startLat2, startLng2] = run.start_latlng ?? [null, null];
      const { data: activity, error: activityError } = await adminClient
        .from("activities")
        .insert({
          user_id: user.id,
          season_id: season.id,
          strava_activity_id: run.id,
          name: run.name || "Run",
          distance_km: distanceKm,
          duration_seconds: run.moving_time,
          pace_per_km: pacePerKm,
          start_date: run.start_date,
          start_latitude: startLat2,
          start_longitude: startLng2,
          weather_multiplier: weatherMultiplier,
          sc_earned: scEarned,
          is_mock: false,
        })
        .select("id")
        .single();

      if (activityError || !activity) {
        console.error("[strava/sync] Failed to insert activity:", run.id, activityError?.message);
        continue;
      }
      console.log("[strava/sync] Inserted activity:", run.id, "→", activity.id);

      // Record $SC transaction
      await adminClient.rpc("process_sc_transaction", {
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
      const { data: allActivities } = await adminClient
        .from("activities")
        .select("distance_km")
        .eq("user_id", user.id);

      const totalDistance = (allActivities || []).reduce(
        (sum, a) => sum + a.distance_km,
        0
      );

      await adminClient
        .from("profiles")
        .update({
          total_distance_km: totalDistance,
          total_activities: (allActivities || []).length,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    return NextResponse.json({
      synced,
      message: synced > 0
        ? `Synced ${synced} new activities`
        : "No new activities to sync",
      debug: {
        strava_athlete_id: profile.strava_athlete_id,
        token_expired: Date.now() >= expiresAt,
        token_expires_at: new Date(expiresAt).toISOString(),
        query_after: new Date(sevenDaysAgo * 1000).toISOString(),
        strava_total_returned: stravaActivities.length,
        strava_activities: stravaActivities.map((a) => ({
          id: a.id, type: a.type, sport_type: a.sport_type, name: a.name,
          distance: a.distance, date: a.start_date,
        })),
        runs_after_filter: runs.length,
        existing_ids_in_db: Array.from(existingIds),
      },
    });
  } catch (err) {
    // Return a user-friendly message when Strava rate limit is hit
    if (err instanceof StravaRateLimitError) {
      const minutes = Math.ceil(err.retryAfter / 60);
      return NextResponse.json(
        {
          error: "rate_limit",
          message: `目前太多人在使用，請等 ${minutes} 分鐘後再試！`,
          retryAfter: err.retryAfter,
        },
        { status: 429 }
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    console.error("[strava/sync] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
