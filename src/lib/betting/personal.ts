import { BetType, PersonalBet } from "@/types";

// Odds boundaries
const MIN_ODDS = 1.01;
const MAX_ODDS = 3.0;

// Conservative quadratic regression: odds = A*r² + B*r + C
// At ratio=0.1 (trivial):   0.22*0.01 + 0.11*0.1 + 1.0 = 1.01x
// At ratio=0.5 (easy):      0.22*0.25 + 0.11*0.5 + 1.0 = 1.11x
// At ratio=1.0 (average):   0.22 + 0.11 + 1.0           = 1.33x
// At ratio=1.5 (ambitious): 0.22*2.25 + 0.11*1.5 + 1.0  = 1.66x
// At ratio=2.0 (hard):      0.22*4.0 + 0.11*2.0 + 1.0   = 2.10x
// At ratio=3.0 (extreme):   0.22*9.0 + 0.11*3.0 + 1.0   = 3.31x → capped 3.0x
const QUAD_A = 0.22;
const QUAD_B = 0.11;
const QUAD_C = 1.0;

/**
 * Clamps a value to the inclusive range [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the odds for a personal performance bet using a conservative quadratic curve.
 *
 * The ratio = targetValue / averageValue represents how ambitious the goal is.
 * Odds grow quadratically: odds = 0.22*r² + 0.11*r + 1.0, capped at 3.0x
 *
 * Examples (assuming average = 10km):
 *   1km  → ratio=0.1 → 1.01x
 *   5km  → ratio=0.5 → 1.11x
 *  10km  → ratio=1.0 → 1.33x
 *  15km  → ratio=1.5 → 1.66x
 *  20km  → ratio=2.0 → 2.10x
 *  30km  → ratio=3.0 → 3.00x (max)
 */
export function calculateOdds(
  targetValue: number,
  averageValue: number,
  betType: BetType
): number {
  // Avoid division by zero; treat zero average as if target is ambitious
  if (averageValue <= 0) {
    const fallbackRatio = targetValue > 0 ? 2 : 1;
    return clamp(QUAD_A * fallbackRatio * fallbackRatio + QUAD_B * fallbackRatio + QUAD_C, MIN_ODDS, MAX_ODDS);
  }

  // UNDER bets use the inverse ratio because a lower target is harder to miss
  const ratio =
    betType === BetType.UNDER
      ? averageValue / targetValue
      : targetValue / averageValue;

  const raw = QUAD_A * ratio * ratio + QUAD_B * ratio + QUAD_C;
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
