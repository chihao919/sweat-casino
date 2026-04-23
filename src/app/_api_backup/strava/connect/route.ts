import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/strava/connect?user_id=xxx
 *
 * Redirects to Strava OAuth. Accepts optional user_id query param
 * which gets passed as OAuth state so the callback can identify the user
 * even if session cookies are lost during cross-site redirect.
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

  const userId = request.nextUrl.searchParams.get("user_id") || "";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
  });

  if (userId) {
    params.set("state", userId);
  }

  const url = `https://www.strava.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(url);
}
