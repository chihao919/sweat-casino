import { describe, it, expect } from "vitest";
import { checkComebackStatus } from "@/lib/health/comeback";
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

describe("checkComebackStatus", () => {
  it("returns no comeback for empty activities", () => {
    const status = checkComebackStatus([]);
    expect(status.isComeback).toBe(false);
  });

  it("returns no comeback if active within 3 days", () => {
    const status = checkComebackStatus([makeActivity(1)]);
    expect(status.isComeback).toBe(false);
    expect(status.bonusMultiplier).toBe(1);
  });

  it("returns 1.2x for 3-6 days inactive", () => {
    const status = checkComebackStatus([makeActivity(4)]);
    expect(status.isComeback).toBe(true);
    expect(status.bonusMultiplier).toBe(1.2);
  });

  it("returns 1.5x for 7-13 days inactive", () => {
    const status = checkComebackStatus([makeActivity(10)]);
    expect(status.isComeback).toBe(true);
    expect(status.bonusMultiplier).toBe(1.5);
  });

  it("returns 2.0x for 14+ days inactive", () => {
    const status = checkComebackStatus([makeActivity(20)]);
    expect(status.isComeback).toBe(true);
    expect(status.bonusMultiplier).toBe(2.0);
  });

  it("uses the most recent activity date", () => {
    // Most recent = 1 day ago, oldest = 30 days ago
    const status = checkComebackStatus([makeActivity(30), makeActivity(1)]);
    expect(status.isComeback).toBe(false);
  });
});
