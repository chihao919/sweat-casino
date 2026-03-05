import { describe, it, expect } from "vitest";
import { calculateBodyVersion } from "@/lib/health/body-version";
import { Activity } from "@/types";

function makeActivity(daysAgo: number): Activity {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: crypto.randomUUID(),
    user_id: "u1",
    season_id: "s1",
    strava_activity_id: null,
    distance_km: 5,
    duration_seconds: 1800,
    pace_per_km: 6,
    activity_date: date.toISOString(),
    weather_code: null,
    weather_description: null,
    temperature: null,
    wind_speed: null,
    weather_multiplier: 1,
    sc_earned: 25,
    is_manual: false,
    created_at: date.toISOString(),
  };
}

describe("calculateBodyVersion", () => {
  it("returns v1.0.0 for no activities", () => {
    const version = calculateBodyVersion([]);
    expect(version.display).toBe("v1.0.0");
    expect(version.title).toBe("未初始化");
  });

  it("patch reflects recent week activity count", () => {
    const activities = [makeActivity(0), makeActivity(1), makeActivity(2)];
    const version = calculateBodyVersion(activities);
    expect(version.patch).toBe(3);
  });

  it("major increments every 4 active weeks", () => {
    // Create activities across 8 different weeks
    const activities = Array.from({ length: 8 }, (_, i) => makeActivity(i * 7));
    const version = calculateBodyVersion(activities);
    expect(version.major).toBe(3); // 1 + floor(8/4) = 3
  });

  it("minor shows weeks within current cycle", () => {
    // 5 active weeks: major = 1 + floor(5/4) = 2, minor = 5 % 4 = 1
    const activities = Array.from({ length: 5 }, (_, i) => makeActivity(i * 7));
    const version = calculateBodyVersion(activities);
    expect(version.minor).toBe(1);
  });
});
