import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshStravaToken } from "@/lib/strava/auth";
import { getStravaActivity } from "@/lib/strava/client";
import { fetchCurrentWeather } from "@/lib/weather/client";
import { evaluateWeatherBonus } from "@/lib/weather/bonus";
import { calculateSCEarned } from "@/lib/sc/engine";
import { checkBetProgress } from "@/lib/betting/personal";
import { TransactionType, PersonalBet, BetStatus } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StravaWebhookEvent {
  object_type: string;
  aspect_type: string;
  object_id: number;
  owner_id: number;
  subscription_id: number;
  event_time: number;
}

// ---------------------------------------------------------------------------
// GET — Webhook subscription verification
// ---------------------------------------------------------------------------

/**
 * Strava sends a GET request with a challenge token when registering a webhook.
 * We must echo the challenge back to confirm ownership of the endpoint.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken === expectedToken && challenge) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Receive activity events
// ---------------------------------------------------------------------------

/**
 * Processes incoming Strava webhook events.
 *
 * This is the CRITICAL PATH for earning $SC — every running activity flows
 * through here. We always return HTTP 200 to prevent Strava from retrying,
 * even when internal processing fails.
 *
 * Processing steps:
 *  1. Parse event; skip non-activity or non-create events early.
 *  2. Look up the matching profile by strava_athlete_id.
 *  3. Refresh the Strava token if expired.
 *  4. Fetch the full activity detail from Strava.
 *  5. Skip non-Run activities.
 *  6. Fetch weather at the start location (optional — failure is non-fatal).
 *  7. Evaluate weather bonus multiplier.
 *  8. Calculate $SC earned and insert the activity record.
 *  9. Record $SC transactions (activity reward + optional weather bonus).
 * 10. Update active personal bets.
 * 11. Update profile aggregate stats.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as StravaWebhookEvent;

    // Only process newly created activities
    if (body.object_type !== "activity" || body.aspect_type !== "create") {
      return NextResponse.json({ received: true });
    }

    const adminClient = createAdminClient();

    // ------------------------------------------------------------------
    // 1. Find the profile that owns this Strava athlete ID
    // ------------------------------------------------------------------
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("strava_athlete_id", String(body.owner_id))
      .single();

    if (profileError || !profile) {
      // Not a registered user; silently acknowledge
      return NextResponse.json({ received: true });
    }

    // ------------------------------------------------------------------
    // 2. Refresh Strava token if it has expired
    // ------------------------------------------------------------------
    let accessToken: string = profile.strava_access_token;

    const expiresAt = profile.strava_token_expires_at
      ? new Date(profile.strava_token_expires_at).getTime()
      : 0;

    if (Date.now() >= expiresAt) {
      try {
        const freshTokens = await refreshStravaToken(profile.strava_refresh_token);
        accessToken = freshTokens.access_token;

        await adminClient
          .from("profiles")
          .update({
            strava_access_token: freshTokens.access_token,
            strava_refresh_token: freshTokens.refresh_token,
            strava_token_expires_at: new Date(
              freshTokens.expires_at * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);
      } catch (tokenErr) {
        console.error(
          `[strava/webhook] Token refresh failed for user ${profile.id}:`,
          tokenErr
        );
        return NextResponse.json({ received: true });
      }
    }

    // ------------------------------------------------------------------
    // 3. Fetch full activity detail
    // ------------------------------------------------------------------
    let stravaActivity;
    try {
      stravaActivity = await getStravaActivity(accessToken, body.object_id);
    } catch (fetchErr) {
      console.error(
        `[strava/webhook] Failed to fetch activity ${body.object_id}:`,
        fetchErr
      );
      return NextResponse.json({ received: true });
    }

    // Only award $SC for running activities
    const activityType = stravaActivity.type || stravaActivity.sport_type;
    if (activityType !== "Run") {
      return NextResponse.json({ received: true });
    }

    // ------------------------------------------------------------------
    // 4. Get active season config
    // ------------------------------------------------------------------
    const { data: season } = await adminClient
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!season) {
      console.warn("[strava/webhook] No active season found — skipping $SC award");
      return NextResponse.json({ received: true });
    }

    const config = season.config;
    const distanceKm = stravaActivity.distance / 1000;
    const pacePerKm =
      distanceKm > 0
        ? stravaActivity.moving_time / 60 / distanceKm
        : 0;

    // ------------------------------------------------------------------
    // 5. Fetch weather (non-fatal — runs without weather data if unavailable)
    // ------------------------------------------------------------------
    let weatherMultiplier = 1.0;
    let weatherRecordId: string | null = null;
    let weatherCode: number | null = null;
    let weatherDescription: string | null = null;
    let temperature: number | null = null;
    let windSpeed: number | null = null;
    let weatherBonusMultiplier = 1.0;
    let weatherBonusReason: string | null = null;

    const [startLat, startLng] = stravaActivity.start_latlng ?? [null, null];

    if (startLat != null && startLng != null) {
      try {
        const weather = await fetchCurrentWeather(startLat, startLng);
        const bonus = evaluateWeatherBonus(
          weather.weather_code,
          weather.temperature,
          weather.wind_speed
        );

        weatherCode = weather.weather_code;
        weatherDescription = weather.weather_description;
        temperature = weather.temperature;
        windSpeed = weather.wind_speed;
        weatherMultiplier = bonus.multiplier;
        weatherBonusMultiplier = bonus.multiplier;
        weatherBonusReason = bonus.reason;

        // Insert weather record
        const { data: weatherRecord } = await adminClient
          .from("weather_records")
          .insert({
            recorded_at: stravaActivity.start_date,
            latitude: startLat,
            longitude: startLng,
            weather_code: weather.weather_code,
            weather_main: weather.weather_main,
            weather_description: weather.weather_description,
            temperature: weather.temperature,
            wind_speed: weather.wind_speed,
            bonus_multiplier: bonus.multiplier,
            bonus_reason: bonus.reason,
          })
          .select("id")
          .single();

        weatherRecordId = weatherRecord?.id ?? null;
      } catch (weatherErr) {
        // Weather is optional — log and continue without bonus
        console.warn(
          `[strava/webhook] Weather fetch failed for activity ${body.object_id}:`,
          weatherErr
        );
      }
    }

    // ------------------------------------------------------------------
    // 6. Calculate $SC earned and insert activity
    // ------------------------------------------------------------------
    const scEarned = calculateSCEarned(distanceKm, weatherMultiplier, config);

    const { data: activity, error: activityError } = await adminClient
      .from("activities")
      .insert({
        user_id: profile.id,
        season_id: season.id,
        strava_activity_id: String(body.object_id),
        distance_km: distanceKm,
        duration_seconds: stravaActivity.moving_time,
        pace_per_km: pacePerKm,
        activity_date: stravaActivity.start_date,
        weather_code: weatherCode,
        weather_description: weatherDescription,
        temperature,
        wind_speed: windSpeed,
        weather_multiplier: weatherMultiplier,
        sc_earned: scEarned,
        is_manual: false,
      })
      .select("id")
      .single();

    if (activityError || !activity) {
      console.error(
        `[strava/webhook] Failed to insert activity for user ${profile.id}:`,
        activityError
      );
      return NextResponse.json({ received: true });
    }

    // ------------------------------------------------------------------
    // 7. Record $SC transactions via RPC
    // ------------------------------------------------------------------
    await adminClient.rpc("process_sc_transaction", {
      p_user_id: profile.id,
      p_season_id: season.id,
      p_type: TransactionType.ACTIVITY_EARNED,
      p_amount: scEarned,
      p_reference_id: activity.id,
      p_description: `Earned ${scEarned} $SC for ${distanceKm.toFixed(2)} km run`,
    });

    // Award an additional weather bonus transaction when applicable
    if (weatherBonusReason && weatherBonusMultiplier > 1.0) {
      const bonusAmount = Math.round(
        (scEarned - calculateSCEarned(distanceKm, 1.0, config)) * 100
      ) / 100;

      if (bonusAmount > 0) {
        await adminClient.rpc("process_sc_transaction", {
          p_user_id: profile.id,
          p_season_id: season.id,
          p_type: "weather_bonus",
          p_amount: bonusAmount,
          p_reference_id: weatherRecordId ?? activity.id,
          p_description: `Weather bonus (${weatherBonusReason}) for activity ${activity.id}`,
        });
      }
    }

    // ------------------------------------------------------------------
    // 8. Update active personal bets
    // ------------------------------------------------------------------
    const { data: activeBets } = await adminClient
      .from("personal_bets")
      .select("*")
      .eq("user_id", profile.id)
      .eq("status", BetStatus.PENDING);

    if (activeBets && activeBets.length > 0) {
      for (const bet of activeBets as PersonalBet[]) {
        const { newValue, isCompleted } = checkBetProgress(bet, distanceKm);

        await adminClient
          .from("personal_bets")
          .update({
            current_value: newValue,
            ...(isCompleted
              ? { status: BetStatus.WON, resolved_at: new Date().toISOString() }
              : {}),
          })
          .eq("id", bet.id);

        // Pay out immediately if bet is completed
        if (isCompleted) {
          await adminClient.rpc("process_sc_transaction", {
            p_user_id: profile.id,
            p_season_id: season.id,
            p_type: TransactionType.BET_WON,
            p_amount: bet.potential_payout,
            p_reference_id: bet.id,
            p_description: `Bet won: ${bet.potential_payout} $SC payout`,
          });
        }
      }
    }

    // ------------------------------------------------------------------
    // 9. Update profile aggregate stats
    // ------------------------------------------------------------------
    await adminClient
      .from("profiles")
      .update({
        total_distance_km: (profile.total_distance_km ?? 0) + distanceKm,
        total_activities: (profile.total_activities ?? 0) + 1,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    return NextResponse.json({ received: true });
  } catch (err) {
    // Always return 200 to prevent Strava from retrying the event
    console.error("[strava/webhook] Unhandled error:", err);
    return NextResponse.json({ received: true });
  }
}
