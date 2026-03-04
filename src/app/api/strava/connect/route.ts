import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET /api/strava/connect
 *
 * Server-side redirect to Strava OAuth.
 * Embeds the authenticated user's ID in the OAuth state parameter
 * so the callback can identify the user without relying on cookies
 * (which may be lost during cross-site redirects).
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.STRAVA_CLIENT_ID || process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const redirectUri =
    process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI ||
    "https://runrun-plum.vercel.app/api/strava/callback";

  if (!clientId) {
    return NextResponse.json(
      { error: "STRAVA_CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  // Get the authenticated user to embed their ID in state
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://runrun-plum.vercel.app";
    return NextResponse.redirect(`${appUrl}/login`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
    state: user.id,
  });

  const url = `https://www.strava.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(url);
}
