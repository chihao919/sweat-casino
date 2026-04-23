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
    const log = (msg: string) => {
      setLastSyncResult(msg);
      // Send log to server so we can debug remotely
      fetch(`${API_BASE_URL}/api/public/players?_healthlog=${encodeURIComponent(msg)}`).catch(() => {});
    };
    try {
      log("Loading health module...");
      const {
        isHealthAvailable,
        requestHealthAuthorization,
        getRunningDistance,
      } = await import("@/lib/health/client");

      log("Checking availability...");
      const available = await isHealthAvailable();
      if (!available) {
        log("Health not available");
        return;
      }

      log("Requesting auth...");
      const authorized = await requestHealthAuthorization();
      if (!authorized) {
        log("Health permission denied");
        return;
      }

      log("Reading distance...");
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const distanceKm = await getRunningDistance(weekAgo);

      if (distanceKm === 0) {
        log("No distance in last 7 days");
        return;
      }

      log(`Got ${distanceKm.toFixed(1)} km, uploading...`);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        log("No session");
        return;
      }

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
      log(data.error ? `Error: ${data.error}` : `Synced ${distanceKm.toFixed(1)} km`);
    } catch (err) {
      log(`Sync error: ${err}`);
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
