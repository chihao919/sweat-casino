import { Capacitor } from "@capacitor/core";
import type { HealthPlugin } from "@capgo/capacitor-health";

/**
 * Health data client for reading running activities from
 * Apple HealthKit (iOS) and Health Connect (Android).
 *
 * IMPORTANT: do NOT import { Health } from "@capgo/capacitor-health".
 * That npm registerPlugin proxy silently hangs in this app's WKWebView
 * (every call times out without ever reaching the bridge — verified
 * 2026-06-11 on iOS 26.5 via layer probes). Worse, merely evaluating the
 * npm module overwrites window.Capacitor.Plugins.Health with the broken
 * proxy, so we cannot trust that object either. Instead we call the raw
 * bridge API Capacitor.nativePromise(), which registerPlugin never touches.
 */

interface HealthWorkout {
  startDate: string;
  endDate: string;
  duration: number; // seconds
  distance: number; // meters
  sourceName: string;
}

const HEALTH_METHODS = [
  "isAvailable",
  "requestAuthorization",
  "checkAuthorization",
  "readSamples",
  "queryWorkouts",
  "queryAggregated",
  "getPluginVersion",
] as const;

async function getHealthPlugin(): Promise<HealthPlugin | null> {
  if (!Capacitor.isNativePlatform()) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  if (typeof cap?.nativePromise !== "function") return null;
  const plugin: Record<string, (options?: unknown) => Promise<unknown>> = {};
  for (const method of HEALTH_METHODS) {
    plugin[method] = (options?: unknown) => cap.nativePromise("Health", method, options);
  }
  return plugin as unknown as HealthPlugin;
}

/** Check if health data is available on this device */
export async function isHealthAvailable(): Promise<boolean> {
  const health = await getHealthPlugin();
  if (!health) return false;
  try {
    const result = await health.isAvailable();
    return result.available;
  } catch {
    return false;
  }
}

/** Debug probe: pure-Swift plugin method, never touches HealthKit.
 *  Distinguishes "bridge call never reaches the plugin" from "HealthKit hangs".
 *  Errors propagate so the caller can log them separately from timeouts. */
export async function probePluginVersion(): Promise<string> {
  const health = await getHealthPlugin();
  if (!health) return "no-plugin";
  const result = await health.getPluginVersion();
  return result.version;
}

/** Debug probe: calls only the synchronous HKHealthStore.isHealthDataAvailable()
 *  on the native side — no authorization, no queries. */
export async function probeIsAvailable(): Promise<string> {
  const health = await getHealthPlugin();
  if (!health) return "no-plugin";
  const result = await health.isAvailable();
  return JSON.stringify(result);
}

/** Request authorization to read workout/distance data.
 *  Must include "workouts" — without it the iOS 26 callback never fires (the
 *  pre-redesign HealthSyncProvider that worked included it; removing it broke
 *  every native call). */
export async function requestHealthAuthorization(): Promise<boolean> {
  const health = await getHealthPlugin();
  if (!health) return false;
  try {
    await health.requestAuthorization({
      read: ["distance", "exerciseTime", "calories", "workouts" as never],
      write: [],
    });
    return true;
  } catch (err) {
    console.error("[health] Authorization failed:", err);
    return false;
  }
}

/** Check if we already have authorization */
export async function checkHealthAuthorization(): Promise<boolean> {
  const health = await getHealthPlugin();
  if (!health) return false;
  try {
    const result = await health.checkAuthorization({
      read: ["distance", "exerciseTime", "calories"],
      write: [],
    });
    return result.readAuthorized.length > 0;
  } catch {
    return false;
  }
}

/**
 * Query running workouts from the last N days.
 * Returns an array of workouts with distance in meters and duration in seconds.
 */
/**
 * Debug: read raw distance samples to see HealthKit data with source info.
 */
export async function debugReadSamples(
  daysBack: number = 7
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const health = await getHealthPlugin();
  if (!health) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  try {
    const result = await health.readSamples({
      dataType: "distance",
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      limit: 200,
    });

    // Return all samples with source info for inspection
    return (result.samples || []).map((s) => ({
      value: s.value,
      unit: s.unit,
      startDate: s.startDate,
      endDate: s.endDate,
      sourceName: s.sourceName,
      sourceId: s.sourceId,
    }));
  } catch (err) {
    return [{ error: String(err) }];
  }
}

export async function getRunningWorkouts(
  daysBack: number = 7
): Promise<HealthWorkout[]> {
  const health = await getHealthPlugin();
  if (!health) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  try {
    const result = await health.queryWorkouts({
      workoutType: "running",
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      limit: 100,
    });

    return (result.workouts || []).map((w) => ({
      startDate: w.startDate,
      endDate: w.endDate,
      duration: w.duration || 0,
      distance: w.totalDistance || 0,
      sourceName: w.sourceName || "Health",
    }));
  } catch (err) {
    console.error("[health] Failed to query workouts:", err);
    return [];
  }
}

/**
 * Read raw distance samples from HealthKit and infer running sessions.
 *
 * Why: queryWorkouts unreliable for users who sync via Garmin/Strava (no HKWorkout
 * is written, only HKQuantitySample for distance). readSamples gives us those raw
 * distance entries with sourceName so we can filter out iPhone-derived walking
 * samples and aggregated daily totals.
 *
 * Filter rules:
 * - Exclude sourceName containing "iPhone" (passive step counting, mostly walking)
 * - Exclude sample with duration < 60s (single-point walking samples)
 * - Exclude sample with average speed < 1.0 m/s (3.6 km/h, not running pace)
 * - Exclude sample that spans a whole day (start at midnight + 24h span = daily aggregate)
 */
export async function getRunningSamples(
  daysBack: number = 7
): Promise<HealthWorkout[]> {
  const samples = await readDistanceSamples(daysBack);
  return samples.filter(isLikelyRunningSample).map((s) => {
    const start = new Date(s.startDate).getTime();
    const end = new Date(s.endDate).getTime();
    return {
      startDate: s.startDate,
      endDate: s.endDate,
      duration: Math.max(0, Math.round((end - start) / 1000)),
      distance: s.value || 0,
      sourceName: s.sourceName || "Health",
    };
  });
}

/** Read raw distance samples for the last N days (no filtering). */
export async function readDistanceSamples(
  daysBack: number = 7
): Promise<Array<{ value: number; startDate: string; endDate: string; sourceName?: string; sourceId?: string }>> {
  const health = await getHealthPlugin();
  if (!health) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  try {
    const result = await health.readSamples({
      dataType: "distance",
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      limit: 500,
    });
    return (result.samples || []).map((s) => ({
      value: s.value,
      startDate: s.startDate,
      endDate: s.endDate,
      sourceName: s.sourceName,
      sourceId: s.sourceId,
    }));
  } catch (err) {
    console.error("[health] Failed to read samples:", err);
    return [];
  }
}

function isLikelyRunningSample(s: { value: number; startDate: string; endDate: string; sourceName?: string }): boolean {
  const sn = (s.sourceName || "").toLowerCase();
  if (sn.includes("iphone") || sn.includes("phone")) return false;

  const start = new Date(s.startDate).getTime();
  const end = new Date(s.endDate).getTime();
  const durationSec = Math.max(0, (end - start) / 1000);

  // Reject single-point or sub-minute samples (typically passive step entries)
  if (durationSec < 60) return false;

  // Reject day-spanning aggregates (whole-day buckets from daily summary writers)
  if (durationSec >= 23 * 3600) return false;

  // Reject samples slower than ~3.6 km/h (walking), keep only running-ish pace
  const speedMps = s.value / Math.max(durationSec, 1);
  if (speedMps < 1.0) return false;

  // Reject tiny distance entries (< 100 m)
  if ((s.value || 0) < 100) return false;

  return true;
}

/**
 * Get total running distance for a date range (in km).
 */
export async function getRunningDistance(
  startDate: Date,
  endDate: Date = new Date()
): Promise<number> {
  const health = await getHealthPlugin();
  if (!health) return 0;

  try {
    const result = await health.readSamples({
      dataType: "distance",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Sum up all distance samples (value is in meters)
    const totalMeters = (result.samples || []).reduce(
      (sum, d) => sum + (d.value || 0),
      0
    );
    return totalMeters / 1000;
  } catch (err) {
    console.error("[health] Failed to query distance:", err);
    return 0;
  }
}
