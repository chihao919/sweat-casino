import { describe, it, expect } from "vitest";
import { calculateMilestones, getNextMilestone, getAchievedCount } from "@/lib/health/milestones";
import { Activity } from "@/types";

function makeActivity(distanceKm: number): Activity {
  return {
    id: crypto.randomUUID(),
    user_id: "u1",
    season_id: "s1",
    strava_activity_id: null,
    distance_km: distanceKm,
    duration_seconds: distanceKm * 360,
    pace_per_km: 6,
    activity_date: new Date().toISOString(),
    weather_code: null,
    weather_description: null,
    temperature: null,
    wind_speed: null,
    weather_multiplier: 1,
    sc_earned: distanceKm * 5,
    is_manual: false,
    created_at: new Date().toISOString(),
  };
}

describe("calculateMilestones", () => {
  it("returns all milestones unachieved for empty activities", () => {
    const milestones = calculateMilestones([]);
    expect(milestones.every((m) => !m.achieved)).toBe(true);
  });

  it("marks first_step as achieved after any run", () => {
    const milestones = calculateMilestones([makeActivity(1)]);
    const firstStep = milestones.find((m) => m.id === "first_step");
    expect(firstStep?.achieved).toBe(true);
  });

  it("marks 5K achieved at exactly 5km total", () => {
    const milestones = calculateMilestones([makeActivity(3), makeActivity(2)]);
    const fiveK = milestones.find((m) => m.id === "5k_runner");
    expect(fiveK?.achieved).toBe(true);
    expect(fiveK?.progress).toBe(100);
  });

  it("calculates correct progress percentage", () => {
    const milestones = calculateMilestones([makeActivity(2.5)]);
    const fiveK = milestones.find((m) => m.id === "5k_runner");
    expect(fiveK?.achieved).toBe(false);
    expect(fiveK?.progress).toBe(50);
  });
});

describe("getNextMilestone", () => {
  it("returns first_step for empty activities (with 0.01km target)", () => {
    const next = getNextMilestone([]);
    expect(next?.id).toBe("first_step");
  });

  it("returns 5K after completing first step", () => {
    const next = getNextMilestone([makeActivity(1)]);
    expect(next?.id).toBe("5k_runner");
  });

  it("returns null when all milestones achieved", () => {
    const next = getNextMilestone([makeActivity(1000)]);
    expect(next).toBeNull();
  });
});

describe("getAchievedCount", () => {
  it("returns 0 for no activities", () => {
    expect(getAchievedCount([])).toBe(0);
  });

  it("counts correct number of achievements", () => {
    // 50km total → first_step, 5K, 10K, half_marathon, marathon achieved
    expect(getAchievedCount([makeActivity(50)])).toBe(5);
  });
});
