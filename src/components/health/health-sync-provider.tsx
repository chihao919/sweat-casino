"use client";

/**
 * Health sync provider — disabled.
 * Previously used queryAggregated to sync daily distance, but it mixed walking+running
 * without duration data. Health sync is now handled by use-health-sync hook instead.
 */
export function HealthSyncProvider() {
  return null;
}
