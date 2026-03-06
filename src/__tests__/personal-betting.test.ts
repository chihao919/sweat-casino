import { describe, it, expect } from "vitest";
import { calculateOdds, calculatePotentialPayout, checkBetProgress } from "@/lib/betting/personal";
import { BetType, BetStatus } from "@/types";

describe("calculateOdds (quadratic curve)", () => {
  const avg = 10; // 10km weekly average

  it("very easy target (1km) gives minimum odds", () => {
    const odds = calculateOdds(1, avg, BetType.OVER);
    // ratio=0.1, odds = 0.22*0.01 + 0.11*0.1 + 1.0 = 1.0132 → rounds to 1.01
    expect(odds).toBe(1.01);
  });

  it("easy target (5km) gives low odds", () => {
    const odds = calculateOdds(5, avg, BetType.OVER);
    // ratio=0.5, odds = 0.22*0.25 + 0.11*0.5 + 1.0 = 1.11
    expect(odds).toBe(1.11);
  });

  it("average target (10km) gives 1.33x odds", () => {
    const odds = calculateOdds(10, avg, BetType.OVER);
    // ratio=1.0, odds = 0.22 + 0.11 + 1.0 = 1.33
    expect(odds).toBe(1.33);
  });

  it("ambitious target (15km) gives ~1.66x odds", () => {
    const odds = calculateOdds(15, avg, BetType.OVER);
    // ratio=1.5, odds = 0.22*2.25 + 0.11*1.5 + 1.0 = 1.66
    expect(odds).toBe(1.66);
  });

  it("hard target (20km) gives 2.1x odds", () => {
    const odds = calculateOdds(20, avg, BetType.OVER);
    // ratio=2.0, odds = 0.22*4 + 0.11*2 + 1.0 = 2.10
    expect(odds).toBe(2.1);
  });

  it("extreme target (30km) gives max 3x odds", () => {
    const odds = calculateOdds(30, avg, BetType.OVER);
    // ratio=3.0, odds = 0.22*9 + 0.11*3 + 1.0 = 3.31 → capped to 3.0
    expect(odds).toBe(3.0);
  });

  it("caps at MAX_ODDS for very extreme targets", () => {
    const odds = calculateOdds(50, avg, BetType.OVER);
    expect(odds).toBe(3.0);
  });

  it("handles zero average gracefully", () => {
    const odds = calculateOdds(10, 0, BetType.OVER);
    expect(odds).toBeGreaterThanOrEqual(1.01);
    expect(odds).toBeLessThanOrEqual(3.0);
  });

  it("quadratic growth: doubling target more than doubles the odds increase", () => {
    const odds10 = calculateOdds(10, avg, BetType.OVER); // 1.33
    const odds20 = calculateOdds(20, avg, BetType.OVER); // 2.10
    // Increase from base (1.0): 0.33 vs 1.10 — >2x growth for 2x target
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
