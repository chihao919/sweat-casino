import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeStravaCode } from "@/lib/strava/auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

/**
 * Handles the OAuth callback redirect from Strava.
 *
 * Flow:
 *  1. Extract the authorization code from the query string.
 *  2. Exchange it for access/refresh tokens via the Strava API.
 *  3. Persist the tokens and athlete ID on the authenticated user's profile.
 *  4. Redirect the user back to /profile with a success or error flag.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // User denied access on the Strava consent screen
  if (error || !code) {
    return NextResponse.redirect(
      `${APP_URL}/profile?strava_error=access_denied`
    );
  }

  try {
    // Identify the currently authenticated user via the session cookie
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
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        `${APP_URL}/profile?strava_error=not_authenticated`
      );
    }

    // Exchange the one-time code for Strava tokens
    const tokens = await exchangeStravaCode(code);

    // Use admin client to bypass RLS when writing tokens to the profile
    const adminClient = createAdminClient();

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        strava_athlete_id: String(tokens.athlete_id),
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        // expires_at from Strava is a Unix timestamp (seconds); store as ISO string
        strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
        is_strava_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

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
