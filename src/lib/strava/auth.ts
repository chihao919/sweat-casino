import { StravaTokens } from "@/types";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_AUTH_BASE_URL = "https://www.strava.com/oauth/authorize";

// The scope required to read athlete activities submitted to our platform
const REQUIRED_SCOPE = "activity:read_all";

/** Shape of the token endpoint response from Strava */
interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: {
    id: number
    profile: string       // URL to athlete's profile picture
    profile_medium: string // medium-size profile picture
    firstname: string
    lastname: string
  }
}

/**
 * Builds the Strava OAuth authorization URL.
 * Redirect the user to this URL to begin the OAuth handshake.
 *
 * Requires NEXT_PUBLIC_STRAVA_CLIENT_ID and NEXT_PUBLIC_STRAVA_REDIRECT_URI
 * environment variables.
 */
export function getStravaAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_STRAVA_CLIENT_ID and NEXT_PUBLIC_STRAVA_REDIRECT_URI"
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: REQUIRED_SCOPE,
  });

  return `${STRAVA_AUTH_BASE_URL}?${params.toString()}`;
}

/**
 * Exchanges a one-time authorization code for a set of Strava tokens.
 * Called server-side after the user is redirected back from Strava.
 *
 * Requires STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET environment variables.
 */
export async function exchangeStravaCode(code: string): Promise<StravaTokens> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET"
    );
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Strava token exchange failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as StravaTokenResponse;

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: data.athlete.id,
    profile_url: data.athlete.profile,
  };
}

/**
 * Refreshes an expired Strava access token using the stored refresh token.
 * Should be called automatically before any API request when the token
 * has passed its expires_at timestamp.
 */
export async function refreshStravaToken(
  refreshToken: string
): Promise<StravaTokens> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET"
    );
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Strava token refresh failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as StravaTokenResponse;

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: data.athlete.id,
  };
}
