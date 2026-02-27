/**
 * Pool betting mechanics using a pari-mutuel model.
 *
 * In pari-mutuel betting there is no house edge — the entire pool is
 * redistributed to winners proportionally to their stake. This creates
 * a self-balancing market where heavy favourites pay less per dollar wagered.
 */

/**
 * Calculates the current implied odds for one side of a pool.
 *
 * Odds = totalPool / sideTotal
 *
 * Returns 0 when the side has received no entries yet, indicating that
 * odds cannot be computed (caller should display "N/A" or similar).
 */
export function calculatePoolOdds(
  totalPool: number,
  sideTotal: number
): number {
  if (sideTotal <= 0) {
    return 0;
  }

  return Math.round((totalPool / sideTotal) * 100) / 100;
}

/**
 * Calculates the payout for a single pool entry after the pool is settled.
 *
 * Formula: entryAmount * (totalPool / winningSideTotal)
 *
 * Because there is 0% house cut, the sum of all winner payouts equals
 * exactly the total pool amount.
 *
 * Returns 0 if no one bet on the winning side (edge case; caller should
 * treat this as a full refund scenario instead).
 */
export function calculatePayout(
  entryAmount: number,
  totalPool: number,
  winningSideTotal: number
): number {
  if (winningSideTotal <= 0) {
    return 0;
  }

  const payout = entryAmount * (totalPool / winningSideTotal);
  return Math.round(payout * 100) / 100;
}
