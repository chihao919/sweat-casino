import { StravaActivity } from "@/types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

// Number of activities per page for the athlete activities endpoint
const DEFAULT_PAGE_SIZE = 30;

/**
 * Custom error for Strava API rate limit (HTTP 429).
 * Contains retryAfter seconds parsed from the response header.
 */
export class StravaRateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    const minutes = Math.ceil(retryAfter / 60);
    super(`Strava API rate limit exceeded. Try again in ${minutes} minute(s).`);
    this.name = "StravaRateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Makes an authenticated GET request to the Strava API.
 * Throws a descriptive error on non-2xx responses.
 * Throws StravaRateLimitError on 429 responses.
 */
async function stravaGet<T>(
  accessToken: string,
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${STRAVA_API_BASE}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value)
    );
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 429) {
    // Parse Retry-After header (seconds), default to 15 minutes
    const retryAfter = parseInt(response.headers.get("Retry-After") || "900", 10);
    console.warn(`[strava] Rate limited on ${path}, retry after ${retryAfter}s`);
    throw new StravaRateLimitError(retryAfter);
  }

  if (!response.ok) {
    throw new Error(
      `Strava API error on ${path}: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Fetches a single Strava activity by its numeric ID.
 * Used by the webhook handler to retrieve full activity details.
 */
export async function getStravaActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  return stravaGet<StravaActivity>(accessToken, `/activities/${activityId}`);
}

/**
 * Fetches a page of the authenticated athlete's recent activities.
 *
 * @param accessToken - Valid Strava access token for the athlete.
 * @param after       - Unix timestamp; only return activities after this time.
 * @param page        - 1-based page number for pagination.
 */
export async function getStravaAthleteActivities(
  accessToken: string,
  after?: number,
  page: number = 1
): Promise<StravaActivity[]> {
  const params: Record<string, string> = {
    per_page: String(DEFAULT_PAGE_SIZE),
    page: String(page),
  };

  if (after !== undefined) {
    params.after = String(after);
  }

  return stravaGet<StravaActivity[]>(
    accessToken,
    "/athlete/activities",
    params
  );
}
