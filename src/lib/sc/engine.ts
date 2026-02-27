import { SCConfig } from "@/types";

// Constant signup bonus awarded once per user on first registration
const SIGNUP_BONUS_AMOUNT = 100;

/**
 * Calculates the $SC earned for a single running activity.
 *
 * Formula: distanceKm * sc_per_km * weatherMultiplier
 * The weather multiplier rewards athletes who run in harsh conditions.
 */
export function calculateSCEarned(
  distanceKm: number,
  weatherMultiplier: number,
  config: SCConfig
): number {
  const raw = distanceKm * config.sc_per_km * weatherMultiplier;
  return Math.round(raw * 100) / 100;
}

/**
 * Returns the one-time signup bonus amount every new user receives.
 */
export function calculateSignupBonus(): number {
  return SIGNUP_BONUS_AMOUNT;
}

/**
 * Formats a $SC amount as a human-readable currency string.
 * Example: 123.4 → "$123.40 SC"
 */
export function formatSC(amount: number): string {
  return `$${amount.toFixed(2)} SC`;
}
