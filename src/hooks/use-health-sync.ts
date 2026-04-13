"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { API_BASE_URL } from "@/lib/config";

/**
 * Hook that auto-syncs health data when the app is opened on a native device.
 * On web, this is a no-op.
 *
 * Usage: call useHealthSync() in the protected layout to auto-sync on mount.
 */
export function useHealthSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);
  const hasSynced = useRef(false);

  const sync = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    if (syncing) return;

    setSyncing(true);
    try {
      console.log("[health-sync] Starting sync, platform:", Capacitor.getPlatform(), "isNative:", Capacitor.isNativePlatform());

      // Dynamically import to avoid loading on web
      const {
        isHealthAvailable,
        requestHealthAuthorization,
        getRunningWorkouts,
      } = await import("@/lib/health/client");

      const available = await isHealthAvailable();
      console.log("[health-sync] Health available:", available);
      if (!available) {
        setLastSyncResult("Health data not available on this device");
        return;
      }

      const authorized = await requestHealthAuthorization();
      console.log("[health-sync] Authorization:", authorized);
      if (!authorized) {
        setLastSyncResult("Health permission denied");
        return;
      }

      // Get workouts from the last 7 days
      const workouts = await getRunningWorkouts(7);
      if (workouts.length === 0) {
        setLastSyncResult("No recent running activities found");
        return;
      }

      // Send to our API — use absolute URL so native (local bundle) builds work
      const res = await fetch(`${API_BASE_URL}/api/health/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workouts }),
      });

      const data = await res.json();
      setLastSyncResult(data.message);
    } catch (err) {
      console.error("[health-sync] Error:", err);
      setLastSyncResult("Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Auto-sync once on mount
  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      sync();
    }
  }, [sync]);

  return { syncing, lastSyncResult, sync };
}
