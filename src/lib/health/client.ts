import { Capacitor } from "@capacitor/core";

/**
 * Health data client for reading running activities from
 * Apple HealthKit (iOS) and Health Connect (Android).
 *
 * Falls back gracefully when running in a browser (web app mode).
 */

interface HealthWorkout {
  startDate: string;
  endDate: string;
  duration: number; // seconds
  distance: number; // meters
  sourceName: string;
}

let healthPlugin: typeof import("@capgo/capacitor-health").Health | null = null;

async function getHealthPlugin() {
  if (healthPlugin) return healthPlugin;
  if (!Capacitor.isNativePlatform()) return null;
  const mod = await import("@capgo/capacitor-health");
  healthPlugin = mod.Health;
  return healthPlugin;
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

/** Request authorization to read workout/distance data */
export async function requestHealthAuthorization(): Promise<boolean> {
  const health = await getHealthPlugin();
  if (!health) return false;
  try {
    await health.requestAuthorization({
      read: ["distance", "exerciseTime", "calories"],
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
 * Debug: query ALL workouts (no filter) to see raw HealthKit data.
 */
export async function debugQueryAllWorkouts(
  daysBack: number = 7
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const health = await getHealthPlugin();
  if (!health) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  try {
    // Query ALL workouts without type filter
    const allResult = await health.queryWorkouts({
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      limit: 50,
    });

    // Also query with running filter
    const runResult = await health.queryWorkouts({
      workoutType: "running",
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      limit: 50,
    });

    return [
      { _label: "ALL_WORKOUTS", count: (allResult.workouts || []).length, data: allResult.workouts || [] },
      { _label: "RUNNING_ONLY", count: (runResult.workouts || []).length, data: runResult.workouts || [] },
    ];
  } catch (err) {
    return [{ _label: "ERROR", error: String(err) }];
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

    const workouts = result.workouts || [];

    // Return all running workouts — let server handle dedup and validation
    return workouts.map((w) => ({
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
