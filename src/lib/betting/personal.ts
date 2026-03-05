import { BetType, PersonalBet } from "@/types";

// Odds boundaries
const MIN_ODDS = 1.05;
const MAX_ODDS = 10.0;

// Quadratic coefficient: controls how steeply odds rise with difficulty
// odds = 1.0 + QUAD_K * ratio²
// At ratio=1.0 (target=average): odds = 1.0 + 1.0 = 2.0x
// At ratio=0.5 (easy):           odds = 1.0 + 0.25 = 1.25x  (barely profitable)
// At ratio=1.5 (ambitious):      odds = 1.0 + 2.25 = 3.25x
// At ratio=2.0 (very hard):      odds = 1.0 + 4.0  = 5.0x
// At ratio=3.0 (extreme):        odds = 1.0 + 9.0  = 10.0x  (capped)
const QUAD_K = 1.0;

/**
 * Clamps a value to the inclusive range [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the odds for a personal performance bet using a quadratic curve.
 *
 * The ratio = targetValue / averageValue represents how ambitious the goal is.
 * Odds grow quadratically: odds = 1.0 + QUAD_K * ratio²
 *
 * This means:
 * - Easy targets (ratio < 1): low odds, you might lose money after fees
 * - Average targets (ratio ≈ 1): ~2.0x, fair return
 * - Hard targets (ratio > 1): odds grow fast, rewarding ambitious goals
 *
 * Examples (assuming average = 10km):
 *   1km  → ratio=0.1 → 1.01x (almost no reward, likely net loss)
 *   5km  → ratio=0.5 → 1.25x
 *  10km  → ratio=1.0 → 2.00x
 *  15km  → ratio=1.5 → 3.25x
 *  20km  → ratio=2.0 → 5.00x
 *  30km  → ratio=3.0 → 10.0x (max)
 */
export function calculateOdds(
  targetValue: number,
  averageValue: number,
  betType: BetType
): number {
  // Avoid division by zero; treat zero average as if target is ambitious
  if (averageValue <= 0) {
    return clamp(1.0 + QUAD_K * (targetValue > 0 ? 4 : 1), MIN_ODDS, MAX_ODDS);
  }

  // UNDER bets use the inverse ratio because a lower target is harder to miss
  const ratio =
    betType === BetType.UNDER
      ? averageValue / targetValue
      : targetValue / averageValue;

  const raw = 1.0 + QUAD_K * ratio * ratio;
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
