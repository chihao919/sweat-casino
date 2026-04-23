import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeStravaCode } from "@/lib/strava/auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://runrun-plum.vercel.app";

/**
 * GET /api/strava/callback
 *
 * Handles the OAuth callback redirect from Strava.
 *
 * User identification strategy:
 *  1. Try reading from session cookie (normal flow)
 *  2. Fall back to state parameter (handles cross-site cookie loss)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state"); // Contains user ID

  // User denied access on the Strava consent screen
  if (error || !code) {
    return NextResponse.redirect(
      `${APP_URL}/profile?strava_error=access_denied`
    );
  }

  try {
    // Strategy 1: Try session cookie
    let userId: string | null = null;

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

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }

    // Strategy 2: Fall back to state parameter
    if (!userId && state) {
      // Validate that this user ID actually exists in profiles
      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("id", state)
        .single();

      if (profile) {
        userId = state;
      }
    }

    if (!userId) {
      console.error("[strava/callback] Could not identify user. Cookie and state both failed.");
      return NextResponse.redirect(
        `${APP_URL}/profile?strava_error=not_authenticated`
      );
    }

    // Exchange the one-time code for Strava tokens
    const tokens = await exchangeStravaCode(code);

    // Use admin client to bypass RLS when writing tokens to the profile
    const adminClient = createAdminClient();

    // Build update payload, include avatar if Strava provides one
    const updatePayload: Record<string, unknown> = {
      strava_athlete_id: tokens.athlete_id,
      strava_access_token: tokens.access_token,
      strava_refresh_token: tokens.refresh_token,
      strava_token_expires_at: tokens.expires_at,
      is_strava_connected: true,
      updated_at: new Date().toISOString(),
    };

    // Auto-set avatar from Strava profile picture if user has none
    if (tokens.profile_url) {
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if (!existingProfile?.avatar_url) {
        updatePayload.avatar_url = tokens.profile_url;
      }
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);

    if (updateError) {
      console.error("[strava/callback] Failed to update profile:", updateError);
      return NextResponse.redirect(
        `${APP_URL}/profile?strava_error=db_update_failed`
      );
    }

    return NextResponse.redirect(`${APP_URL}/profile?strava_connected=true`);
  } catch (err) {
    console.error("[strava/callback] Unexpected error:", err);
    return NextResponse.redirect(
      `${APP_URL}/profile?strava_error=unexpected`
    );
  }
}
