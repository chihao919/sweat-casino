import { NextResponse } from "next/server";

/**
 * GET /api/strava/connect
 *
 * Server-side redirect to Strava OAuth. This ensures env vars are
 * always available (not dependent on client-side NEXT_PUBLIC embedding).
 */
export async function GET() {
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

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
  });

  const url = `https://www.strava.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(url);
}
