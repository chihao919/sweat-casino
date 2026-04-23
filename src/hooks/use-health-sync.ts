"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";
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
    if (syncing) return;
    if (!Capacitor.isNativePlatform()) return;

    setSyncing(true);
    try {
      const {
        isHealthAvailable,
        requestHealthAuthorization,
        getRunningDistance,
      } = await import("@/lib/health/client");

      const available = await isHealthAvailable();
      if (!available) {
        setLastSyncResult("Health data not available on this device");
        return;
      }

      const authorized = await requestHealthAuthorization();
      if (!authorized) {
        setLastSyncResult("Health permission denied");
        return;
      }

      // Get distance from the last 7 days using readSamples (works without workout auth)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const distanceKm = await getRunningDistance(weekAgo);

      if (distanceKm === 0) {
        setLastSyncResult("No recent running distance found");
        return;
      }

      // Get the auth token to send with the API request
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLastSyncResult("No session — please login first");
        return;
      }

      // Send distance data to our API with auth token
      const res = await fetch(`${API_BASE_URL}/api/health/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          source: "healthkit",
          distanceKm,
          startDate: weekAgo.toISOString(),
          endDate: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      setLastSyncResult(`Synced ${distanceKm.toFixed(1)} km`);
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
