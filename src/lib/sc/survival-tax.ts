// Minimum tax charged when a user is not exempt and has a positive balance.
// Ensures even tiny balances contribute to the deflationary pressure.
const MINIMUM_TAX_AMOUNT = 1;

/**
 * Calculates the weekly survival tax deducted from a user's $SC balance.
 *
 * The tax creates deflationary pressure — users must keep running to avoid
 * losing their holdings. A minimum of 1 $SC is charged if the balance is
 * positive, preventing the tax from rounding down to zero on small balances.
 */
export function calculateSurvivalTax(balance: number, taxRate: number): number {
  if (balance <= 0) {
    return 0;
  }

  const computed = balance * taxRate;

  // Enforce a minimum tax so idle users always lose something
  return Math.max(computed, MINIMUM_TAX_AMOUNT);
}

/**
 * Determines whether a user is exempt from the weekly survival tax.
 *
 * Running at least `minKm` during the week earns a full exemption,
 * rewarding consistent athletes and keeping the economy balanced.
 */
export function isExemptFromTax(
  weeklyDistanceKm: number,
  minKm: number
): boolean {
  return weeklyDistanceKm >= minKm;
}
