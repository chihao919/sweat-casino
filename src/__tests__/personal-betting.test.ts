import { describe, it, expect } from "vitest";
import { calculateOdds, calculatePotentialPayout, checkBetProgress } from "@/lib/betting/personal";
import { BetType, BetStatus } from "@/types";

describe("calculateOdds (quadratic curve)", () => {
  const avg = 10; // 10km weekly average

  it("very easy target (1km) gives near-minimum odds", () => {
    const odds = calculateOdds(1, avg, BetType.OVER);
    // ratio=0.1, odds = 1 + 0.01 = 1.01 → clamped to 1.05
    expect(odds).toBe(1.05);
  });

  it("easy target (5km) gives low odds", () => {
    const odds = calculateOdds(5, avg, BetType.OVER);
    // ratio=0.5, odds = 1 + 0.25 = 1.25
    expect(odds).toBe(1.25);
  });

  it("average target (10km) gives 2x odds", () => {
    const odds = calculateOdds(10, avg, BetType.OVER);
    // ratio=1.0, odds = 1 + 1 = 2.0
    expect(odds).toBe(2.0);
  });

  it("ambitious target (15km) gives ~3.25x odds", () => {
    const odds = calculateOdds(15, avg, BetType.OVER);
    // ratio=1.5, odds = 1 + 2.25 = 3.25
    expect(odds).toBe(3.25);
  });

  it("hard target (20km) gives 5x odds", () => {
    const odds = calculateOdds(20, avg, BetType.OVER);
    // ratio=2.0, odds = 1 + 4 = 5.0
    expect(odds).toBe(5.0);
  });

  it("extreme target (30km) gives max 10x odds", () => {
    const odds = calculateOdds(30, avg, BetType.OVER);
    // ratio=3.0, odds = 1 + 9 = 10.0
    expect(odds).toBe(10.0);
  });

  it("caps at MAX_ODDS for very extreme targets", () => {
    const odds = calculateOdds(50, avg, BetType.OVER);
    expect(odds).toBe(10.0);
  });

  it("handles zero average gracefully", () => {
    const odds = calculateOdds(10, 0, BetType.OVER);
    expect(odds).toBeGreaterThanOrEqual(1.05);
    expect(odds).toBeLessThanOrEqual(10.0);
  });

  it("quadratic growth: doubling target more than doubles the odds increase", () => {
    const odds10 = calculateOdds(10, avg, BetType.OVER); // 2.0
    const odds20 = calculateOdds(20, avg, BetType.OVER); // 5.0
    // Increase from base (1.0): 1.0 vs 4.0 — 4x growth for 2x target
    expect(odds20 - 1).toBeGreaterThan(2 * (odds10 - 1));
  });
});

describe("calculatePotentialPayout", () => {
  it("multiplies stake by odds", () => {
    expect(calculatePotentialPayout(100, 2.0)).toBe(200);
  });

  it("rounds to 2 decimal places", () => {
    expect(calculatePotentialPayout(100, 3.25)).toBe(325);
  });
});

describe("checkBetProgress", () => {
  const baseBet = {
    id: "test-id",
    user_id: "user-1",
    season_id: "season-1",
    bet_type: BetType.OVER,
    target_value: 20,
    current_value: 15,
    stake: 100,
    odds: 2.0,
    potential_payout: 200,
    status: BetStatus.PENDING,
    period_start: "2026-01-01",
    period_end: "2026-01-07",
    created_at: "2026-01-01",
  };

  it("adds activity value to current progress", () => {
    const { newValue } = checkBetProgress(baseBet, 3);
    expect(newValue).toBe(18);
  });

  it("marks as completed when reaching target", () => {
    const { isCompleted } = checkBetProgress(baseBet, 5);
    expect(isCompleted).toBe(true);
  });

  it("marks as completed when exceeding target", () => {
    const { isCompleted } = checkBetProgress(baseBet, 10);
    expect(isCompleted).toBe(true);
  });

  it("does not mark as completed when below target", () => {
    const { isCompleted } = checkBetProgress(baseBet, 2);
    expect(isCompleted).toBe(false);
  });
});
