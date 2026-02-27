// Odds thresholds for colour-coding bets in the UI
const LIKELY_ODDS_MAX = 2.0;     // green — high probability of winning
const MODERATE_ODDS_MAX = 3.5;   // yellow — uncertain outcome

/**
 * Formats odds as a human-readable multiplier string.
 * Example: 2.5 → "2.50x"
 */
export function formatOdds(odds: number): string {
  return `${odds.toFixed(2)}x`;
}

/**
 * Converts decimal odds to an implied probability percentage.
 *
 * Implied probability = (1 / odds) * 100
 *
 * Note: this is the theoretical win probability implied by the odds.
 * In a pari-mutuel system it represents the current market consensus,
 * not a guaranteed forecast.
 */
export function oddsToImpliedProbability(odds: number): number {
  if (odds <= 0) {
    return 0;
  }

  return Math.round((1 / odds) * 100 * 100) / 100;
}

/**
 * Returns a Tailwind CSS text colour class reflecting how risky the odds are.
 *
 *  - Green  (<2.0x): favourable — the implied probability is above 50%
 *  - Yellow (2.0x to 3.5x): moderate risk
 *  - Red    (>3.5x): long-shot bet with a low probability of winning
 */
export function getOddsColor(odds: number): string {
  if (odds < LIKELY_ODDS_MAX) {
    return "text-green-500";
  }

  if (odds <= MODERATE_ODDS_MAX) {
    return "text-yellow-500";
  }

  return "text-red-500";
}
