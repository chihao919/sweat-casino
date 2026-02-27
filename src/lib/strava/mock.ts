import { MockActivity } from "@/types";

// Taipei city centre coordinates used as the base for random activity locations
const TAIPEI_LAT = 25.03;
const TAIPEI_LNG = 121.56;
const LOCATION_JITTER = 0.05;

const DEFAULT_MIN_KM = 3;
const DEFAULT_MAX_KM = 10;
const MIN_PACE_PER_KM = 5;   // minutes per km (faster end)
const MAX_PACE_PER_KM = 7;   // minutes per km (slower end)

/**
 * Returns a random float in the range [min, max].
 */
function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Generates a fake Strava-compatible running activity for development and testing.
 *
 * Distances, paces, and locations are randomised within realistic bounds so
 * the rest of the $SC pipeline can be exercised without real Strava access.
 * The _isMock flag must be checked before persisting to the database.
 */
export function generateMockActivity(
  userId: string,
  options?: {
    distanceKm?: number
    durationMinutes?: number
  }
): MockActivity {
  const distanceKm =
    options?.distanceKm ?? randomBetween(DEFAULT_MIN_KM, DEFAULT_MAX_KM);

  // Derive duration from a random pace if not explicitly provided
  const paceMinPerKm = randomBetween(MIN_PACE_PER_KM, MAX_PACE_PER_KM);
  const durationMinutes =
    options?.durationMinutes ?? distanceKm * paceMinPerKm;
  const durationSeconds = Math.round(durationMinutes * 60);

  // Distance in metres (Strava API uses metres)
  const distanceMetres = distanceKm * 1000;

  // Average speed in m/s
  const averageSpeed = distanceMetres / durationSeconds;

  // Random location near Taipei
  const startLat = TAIPEI_LAT + randomBetween(-LOCATION_JITTER, LOCATION_JITTER);
  const startLng = TAIPEI_LNG + randomBetween(-LOCATION_JITTER, LOCATION_JITTER);

  const now = new Date();
  const startDate = now.toISOString();

  // Use a negative fake ID so it can never collide with real Strava IDs
  const fakeId = -Math.floor(Math.random() * 1_000_000);

  return {
    id: fakeId,
    name: "Mock Run",
    type: "Run",
    sport_type: "Run",
    distance: distanceMetres,
    moving_time: durationSeconds,
    elapsed_time: durationSeconds,
    start_date: startDate,
    start_date_local: startDate,
    start_latlng: [startLat, startLng],
    average_speed: averageSpeed,
    max_speed: averageSpeed * 1.2,
    total_elevation_gain: Math.round(randomBetween(10, 80)),
    _isMock: true,
    _userId: userId,
  };
}
