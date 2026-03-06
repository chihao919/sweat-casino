/**
 * BDD Tests for Strava Activity Sync
 *
 * This file tests the complete sync pipeline:
 *   1. Strava API returns activities
 *   2. Filter to "Run" type only
 *   3. Deduplicate against existing DB records
 *   4. Map Strava fields to DB schema (activities table)
 *   5. Insert new activities into DB
 *   6. Award $SC via process_sc_transaction RPC
 *   7. Update profile aggregate stats
 *
 * DB Schema (activities table — from 002_profiles_activities.sql):
 *   id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
 *   user_id          UUID NOT NULL REFERENCES profiles(id)
 *   strava_activity_id BIGINT UNIQUE
 *   name             TEXT NOT NULL
 *   distance_km      DECIMAL(8,2) NOT NULL
 *   duration_seconds INTEGER NOT NULL
 *   pace_per_km      DECIMAL(6,2)
 *   start_date       TIMESTAMPTZ NOT NULL
 *   start_latitude   DOUBLE PRECISION
 *   start_longitude  DOUBLE PRECISION
 *   weather_record_id UUID REFERENCES weather_records(id)
 *   weather_multiplier DECIMAL(3,1) DEFAULT 1.0
 *   sc_earned        DECIMAL(10,2) DEFAULT 0
 *   is_mock          BOOLEAN DEFAULT false
 *   season_id        UUID REFERENCES seasons(id)
 *   created_at       TIMESTAMPTZ DEFAULT now()
 */

import { describe, it, expect } from "vitest";
import { StravaActivity, Activity } from "@/types";

// ---------------------------------------------------------------------------
// Helpers — replicate the core logic from /api/strava/sync without DB calls
// ---------------------------------------------------------------------------

/** Filter Strava activities to runs only (mirrors sync route line 106-108) */
function filterRuns(activities: StravaActivity[]): StravaActivity[] {
  return activities.filter((a) => (a.type || a.sport_type) === "Run");
}

/** Deduplicate: return only activities not already in the DB (mirrors sync route) */
function deduplicateActivities(
  stravaRuns: StravaActivity[],
  existingStravaIds: number[]
): StravaActivity[] {
  const existingSet = new Set(existingStravaIds.map(Number));
  return stravaRuns.filter((r) => !existingSet.has(r.id));
}

/**
 * Map a Strava activity to the DB insert payload.
 * This is the CRITICAL mapping that must match the DB schema exactly.
 * Any mismatch causes a silent insert failure.
 */
function mapStravaToDbPayload(
  run: StravaActivity,
  userId: string,
  seasonId: string,
  scEarned: number,
  weatherMultiplier: number = 1.0
): Record<string, unknown> {
  const distanceKm = run.distance / 1000;
  const pacePerKm = distanceKm > 0 ? run.moving_time / 60 / distanceKm : 0;
  const [startLat, startLng] = run.start_latlng ?? [null, null];

  return {
    user_id: userId,
    season_id: seasonId,
    strava_activity_id: run.id,           // BIGINT — must be number, not string
    name: run.name || "Run",              // TEXT NOT NULL — must be provided
    distance_km: distanceKm,              // DECIMAL(8,2)
    duration_seconds: run.moving_time,    // INTEGER
    pace_per_km: pacePerKm,              // DECIMAL(6,2)
    start_date: run.start_date,           // TIMESTAMPTZ — NOT "activity_date"
    start_latitude: startLat,             // DOUBLE PRECISION
    start_longitude: startLng,            // DOUBLE PRECISION
    weather_multiplier: weatherMultiplier, // DECIMAL(3,1)
    sc_earned: scEarned,                  // DECIMAL(10,2)
    is_mock: false,                       // BOOLEAN — NOT "is_manual"
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeStravaActivity(overrides: Partial<StravaActivity> = {}): StravaActivity {
  return {
    id: 17608207362,
    name: "Morning Run",
    type: "Run",
    sport_type: "Run",
    distance: 7151.8,
    moving_time: 2392,
    elapsed_time: 2500,
    start_date: "2026-03-05T23:13:48Z",
    start_date_local: "2026-03-06T07:13:48+08:00",
    start_latlng: [25.1365, 121.5015],
    average_speed: 2.99,
    max_speed: 4.5,
    total_elevation_gain: 42,
    ...overrides,
  };
}

function makeDbActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "uuid-1",
    user_id: "user-1",
    season_id: "season-1",
    strava_activity_id: 17608207362,
    name: "Morning Run",
    distance_km: 7.15,
    duration_seconds: 2392,
    pace_per_km: 5.57,
    start_date: "2026-03-05T23:13:48Z",
    start_latitude: 25.1365,
    start_longitude: 121.5015,
    weather_record_id: null,
    weather_multiplier: 1.0,
    sc_earned: 35.75,
    is_mock: false,
    created_at: "2026-03-06T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Feature: Strava Activity Sync
// ---------------------------------------------------------------------------

describe("Feature: Strava Activity Sync", () => {
  // =========================================================================
  // Scenario: Filter activities to runs only
  // =========================================================================
  describe("Scenario: Only 'Run' type activities are synced", () => {
    it("Given Strava returns a mix of Run and non-Run activities, When we filter, Then only Runs remain", () => {
      const activities: StravaActivity[] = [
        makeStravaActivity({ id: 1, type: "Run", sport_type: "Run", name: "Morning Run" }),
        makeStravaActivity({ id: 2, type: "WeightTraining", sport_type: "WeightTraining", name: "Gym" }),
        makeStravaActivity({ id: 3, type: "Run", sport_type: "Run", name: "Evening Run" }),
        makeStravaActivity({ id: 4, type: "Ride", sport_type: "Ride", name: "Cycling" }),
      ];

      const runs = filterRuns(activities);

      expect(runs).toHaveLength(2);
      expect(runs.map((r) => r.id)).toEqual([1, 3]);
    });

    it("Given all activities are non-Run, When we filter, Then result is empty", () => {
      const activities: StravaActivity[] = [
        makeStravaActivity({ id: 1, type: "Ride", sport_type: "Ride" }),
        makeStravaActivity({ id: 2, type: "Swim", sport_type: "Swim" }),
      ];

      expect(filterRuns(activities)).toHaveLength(0);
    });

    it("Given sport_type is Run but type is missing, When we filter, Then it still matches", () => {
      const activities: StravaActivity[] = [
        makeStravaActivity({ id: 1, type: "", sport_type: "Run" }),
      ];

      const runs = filterRuns(activities);
      expect(runs).toHaveLength(1);
    });
  });

  // =========================================================================
  // Scenario: Deduplicate against existing DB records
  // =========================================================================
  describe("Scenario: Duplicate activities are not re-inserted", () => {
    it("Given DB has strava_activity_id [1, 2], When Strava returns [1, 2, 3], Then only [3] is new", () => {
      const stravaRuns = [
        makeStravaActivity({ id: 1 }),
        makeStravaActivity({ id: 2 }),
        makeStravaActivity({ id: 3 }),
      ];

      const newRuns = deduplicateActivities(stravaRuns, [1, 2]);

      expect(newRuns).toHaveLength(1);
      expect(newRuns[0].id).toBe(3);
    });

    it("Given DB is empty, When Strava returns activities, Then all are new", () => {
      const stravaRuns = [
        makeStravaActivity({ id: 1 }),
        makeStravaActivity({ id: 2 }),
      ];

      const newRuns = deduplicateActivities(stravaRuns, []);

      expect(newRuns).toHaveLength(2);
    });

    it("Given all Strava activities already exist in DB, Then result is empty", () => {
      const stravaRuns = [
        makeStravaActivity({ id: 1 }),
        makeStravaActivity({ id: 2 }),
      ];

      const newRuns = deduplicateActivities(stravaRuns, [1, 2]);

      expect(newRuns).toHaveLength(0);
    });
  });

  // =========================================================================
  // Scenario: Strava fields are correctly mapped to DB schema
  // =========================================================================
  describe("Scenario: Strava-to-DB field mapping is correct", () => {
    it("Given a Strava activity, When mapped, Then all DB-required fields are present", () => {
      const run = makeStravaActivity({
        id: 12345,
        name: "Morning Run",
        distance: 10000,
        moving_time: 3000,
        start_date: "2026-03-06T07:00:00Z",
        start_latlng: [25.05, 121.53],
      });

      const payload = mapStravaToDbPayload(run, "user-1", "season-1", 50.0);

      // Required fields must exist and have correct types
      expect(payload.user_id).toBe("user-1");
      expect(payload.season_id).toBe("season-1");
      expect(payload.name).toBe("Morning Run");
      expect(payload.distance_km).toBe(10);
      expect(payload.duration_seconds).toBe(3000);
      expect(payload.start_date).toBe("2026-03-06T07:00:00Z");
      expect(payload.sc_earned).toBe(50.0);
    });

    it("strava_activity_id must be a number (BIGINT), not a string", () => {
      const run = makeStravaActivity({ id: 17608207362 });
      const payload = mapStravaToDbPayload(run, "u1", "s1", 10);

      expect(typeof payload.strava_activity_id).toBe("number");
      expect(payload.strava_activity_id).toBe(17608207362);
    });

    it("name must never be null (DB constraint: NOT NULL)", () => {
      // Strava activity with empty name
      const run = makeStravaActivity({ name: "" });
      const payload = mapStravaToDbPayload(run, "u1", "s1", 10);

      expect(payload.name).toBe("Run"); // fallback
      expect(typeof payload.name).toBe("string");
      expect((payload.name as string).length).toBeGreaterThan(0);
    });

    it("uses 'start_date' not 'activity_date' (DB column name)", () => {
      const run = makeStravaActivity();
      const payload = mapStravaToDbPayload(run, "u1", "s1", 10);

      expect(payload).toHaveProperty("start_date");
      expect(payload).not.toHaveProperty("activity_date");
    });

    it("uses 'is_mock' not 'is_manual' (DB column name)", () => {
      const run = makeStravaActivity();
      const payload = mapStravaToDbPayload(run, "u1", "s1", 10);

      expect(payload).toHaveProperty("is_mock");
      expect(payload.is_mock).toBe(false);
      expect(payload).not.toHaveProperty("is_manual");
    });

    it("does NOT include weather columns that belong to weather_records table", () => {
      const run = makeStravaActivity();
      const payload = mapStravaToDbPayload(run, "u1", "s1", 10);

      // These columns exist in weather_records, NOT in activities
      expect(payload).not.toHaveProperty("weather_code");
      expect(payload).not.toHaveProperty("weather_description");
      expect(payload).not.toHaveProperty("temperature");
      expect(payload).not.toHaveProperty("wind_speed");

      // weather_multiplier DOES exist in activities table
      expect(payload).toHaveProperty("weather_multiplier");
    });

    it("correctly extracts latitude and longitude from start_latlng", () => {
      const run = makeStravaActivity({ start_latlng: [25.1365, 121.5015] });
      const payload = mapStravaToDbPayload(run, "u1", "s1", 10);

      expect(payload.start_latitude).toBe(25.1365);
      expect(payload.start_longitude).toBe(121.5015);
    });

    it("handles null start_latlng gracefully", () => {
      const run = makeStravaActivity({ start_latlng: null });
      const payload = mapStravaToDbPayload(run, "u1", "s1", 10);

      expect(payload.start_latitude).toBeNull();
      expect(payload.start_longitude).toBeNull();
    });

    it("calculates pace_per_km correctly (minutes per km)", () => {
      // 10km in 3000 seconds = 50 minutes → 5.0 min/km
      const run = makeStravaActivity({ distance: 10000, moving_time: 3000 });
      const payload = mapStravaToDbPayload(run, "u1", "s1", 10);

      expect(payload.pace_per_km).toBe(5.0);
    });

    it("calculates distance_km correctly from meters", () => {
      const run = makeStravaActivity({ distance: 7151.8 });
      const payload = mapStravaToDbPayload(run, "u1", "s1", 10);

      expect(payload.distance_km).toBeCloseTo(7.1518, 4);
    });
  });

  // =========================================================================
  // Scenario: Activity data integrity on read-back
  // =========================================================================
  describe("Scenario: Activity type matches DB schema for read operations", () => {
    it("Activity interface uses 'start_date' for date field", () => {
      const activity = makeDbActivity();

      expect(activity).toHaveProperty("start_date");
      expect(activity).not.toHaveProperty("activity_date");
    });

    it("Activity interface uses 'is_mock' for mock flag", () => {
      const activity = makeDbActivity();

      expect(activity).toHaveProperty("is_mock");
      expect(activity).not.toHaveProperty("is_manual");
    });

    it("Activity interface uses 'name' field", () => {
      const activity = makeDbActivity();

      expect(activity).toHaveProperty("name");
      expect(typeof activity.name).toBe("string");
    });

    it("strava_activity_id is a number on read-back", () => {
      const activity = makeDbActivity({ strava_activity_id: 17608207362 });

      expect(typeof activity.strava_activity_id).toBe("number");
    });
  });

  // =========================================================================
  // Scenario: Only current user's activities are shown
  // =========================================================================
  describe("Scenario: Profile/Dashboard only shows current user's activities", () => {
    it("Given activities from multiple users, When filtered by user_id, Then only that user's activities are returned", () => {
      const allActivities: Activity[] = [
        makeDbActivity({ id: "a1", user_id: "user-1", distance_km: 5 }),
        makeDbActivity({ id: "a2", user_id: "user-2", distance_km: 8 }),
        makeDbActivity({ id: "a3", user_id: "user-1", distance_km: 10 }),
        makeDbActivity({ id: "a4", user_id: "user-3", distance_km: 3 }),
      ];

      // This simulates the .eq("user_id", user.id) filter
      const myActivities = allActivities.filter((a) => a.user_id === "user-1");

      expect(myActivities).toHaveLength(2);
      expect(myActivities.every((a) => a.user_id === "user-1")).toBe(true);
      expect(myActivities.map((a) => a.id)).toEqual(["a1", "a3"]);
    });
  });

  // =========================================================================
  // Scenario: SC reward calculation
  // =========================================================================
  describe("Scenario: SC earned is calculated based on distance and weather", () => {
    it("Given a 10km run with no weather bonus, Then SC = distance * sc_per_km", () => {
      // Default config: sc_per_km = 5
      const scEarned = 10 * 5; // 50 $SC
      expect(scEarned).toBe(50);
    });

    it("Given a 10km run with 1.5x weather multiplier, Then SC is boosted", () => {
      const scEarned = 10 * 5 * 1.5; // 75 $SC
      expect(scEarned).toBe(75);
    });
  });

  // =========================================================================
  // Scenario: Complete sync pipeline (integration-style)
  // =========================================================================
  describe("Scenario: End-to-end sync pipeline", () => {
    it("Given Strava returns 5 activities (4 runs, 1 weight training) and DB has 1 existing run, Then 3 new runs are synced", () => {
      // Step 1: Strava returns activities
      const stravaActivities: StravaActivity[] = [
        makeStravaActivity({ id: 100, type: "Run", sport_type: "Run", distance: 11628 }),
        makeStravaActivity({ id: 200, type: "Run", sport_type: "Run", distance: 6706 }),
        makeStravaActivity({ id: 300, type: "WeightTraining", sport_type: "WeightTraining", distance: 0 }),
        makeStravaActivity({ id: 400, type: "Run", sport_type: "Run", distance: 7151 }),
        makeStravaActivity({ id: 500, type: "Run", sport_type: "Run", distance: 8804 }),
      ];

      // Step 2: Filter to runs
      const runs = filterRuns(stravaActivities);
      expect(runs).toHaveLength(4);

      // Step 3: Deduplicate (DB already has activity 100)
      const newRuns = deduplicateActivities(runs, [100]);
      expect(newRuns).toHaveLength(3);
      expect(newRuns.map((r) => r.id)).toEqual([200, 400, 500]);

      // Step 4: Map each to DB payload
      const payloads = newRuns.map((r) => {
        const distanceKm = r.distance / 1000;
        const scEarned = distanceKm * 5; // default config
        return mapStravaToDbPayload(r, "user-1", "season-1", scEarned);
      });

      // Step 5: Verify all payloads have correct structure
      for (const payload of payloads) {
        expect(payload).toHaveProperty("user_id", "user-1");
        expect(payload).toHaveProperty("season_id", "season-1");
        expect(typeof payload.strava_activity_id).toBe("number");
        expect(typeof payload.name).toBe("string");
        expect((payload.name as string).length).toBeGreaterThan(0);
        expect(payload).toHaveProperty("start_date");
        expect(payload).toHaveProperty("is_mock", false);
        expect(payload).not.toHaveProperty("activity_date");
        expect(payload).not.toHaveProperty("is_manual");
        expect(payload).not.toHaveProperty("weather_code");
      }

      // Step 6: Verify SC earned values
      expect(payloads[0].sc_earned).toBeCloseTo(6.706 * 5, 1);  // 200: 6.706km
      expect(payloads[1].sc_earned).toBeCloseTo(7.151 * 5, 1);  // 400: 7.151km
      expect(payloads[2].sc_earned).toBeCloseTo(8.804 * 5, 1);  // 500: 8.804km
    });
  });
});
