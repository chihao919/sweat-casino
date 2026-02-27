import { BetType, PersonalBet } from "@/types";

// Odds boundaries — ensures bets are never trivial or impossibly risky
const MIN_ODDS = 1.5;
const MAX_ODDS = 5.0;

// Scaling factor applied before clamping; rewards ambitious targets
const ODDS_SCALE_FACTOR = 1.5;

/**
 * Clamps a value to the inclusive range [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the odds for a personal performance bet.
 *
 * Odds scale with how ambitious the target is relative to the user's average.
 * Setting a target that matches the average yields the minimum odds (~1.5x),
 * while very aggressive targets approach the ceiling of 5.0x.
 *
 * Formula: clamp(targetValue / averageValue * 1.5, 1.5, 5.0)
 *
 * The betType parameter is available for future differentiation between
 * OVER / UNDER / EXACT odds — currently all use the same formula.
 */
export function calculateOdds(
  targetValue: number,
  averageValue: number,
  betType: BetType
): number {
  // Avoid division by zero; treat zero average as minimum odds scenario
  if (averageValue <= 0) {
    return MIN_ODDS;
  }

  // UNDER bets use the inverse ratio because a lower target is harder to miss
  const ratio =
    betType === BetType.UNDER
      ? averageValue / targetValue
      : targetValue / averageValue;

  const raw = ratio * ODDS_SCALE_FACTOR;
  return Math.round(clamp(raw, MIN_ODDS, MAX_ODDS) * 100) / 100;
}

/**
 * Calculates the maximum payout if a personal bet succeeds.
 */
export function calculatePotentialPayout(stake: number, odds: number): number {
  return Math.round(stake * odds * 100) / 100;
}

/**
 * Updates a personal bet's running progress with a new activity contribution.
 *
 * The function is pure — it does not mutate the original bet object.
 * The caller is responsible for persisting the returned values to the database.
 */
export function checkBetProgress(
  bet: PersonalBet,
  newActivityValue: number
): { newValue: number; isCompleted: boolean } {
  const newValue = bet.current_value + newActivityValue;
  const isCompleted = newValue >= bet.target_value;

  return { newValue, isCompleted };
}
