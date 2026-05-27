"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";
import { API_BASE_URL } from "@/lib/config";

/**
 * Hook that auto-syncs health data when the app is opened on a native device.
 * Reads individual running workouts from HealthKit/Health Connect and sends
 * them to the server for deduplication and SC reward calculation.
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
      fetch(`${API_BASE_URL}/api/public/players?_healthlog=${encodeURIComponent(msg)}`).catch(() => {});
    };
    try {
      log("Loading health module...");
      const {
        isHealthAvailable,
        requestHealthAuthorization,
        getRunningWorkouts,
      } = await import("@/lib/health/client");

      // Wait for native plugins to be ready
      await new Promise(r => setTimeout(r, 2000));

      log("Checking availability...");
      const available = await Promise.race([
        isHealthAvailable(),
        new Promise<boolean>(r => setTimeout(() => r(false), 5000)),
      ]);
      if (!available) {
        log("Health not available");
        return;
      }

      log("Requesting auth...");
      const authorized = await Promise.race([
        requestHealthAuthorization(),
        new Promise<boolean>(r => setTimeout(() => r(false), 5000)),
      ]);
      if (!authorized) {
        log("Health permission denied");
        return;
      }

      // Debug: log workout data to Supabase for analysis
      log("Debug: logging workout details...");

      log("Reading workouts...");
      const workouts = await Promise.race([
        getRunningWorkouts(7),
        new Promise<never[]>(r => setTimeout(() => r([]), 10000)),
      ]);

      // Write debug data to Supabase
      const supabase = createClient();
      const { data: { user: debugUser } } = await supabase.auth.getUser();
      if (debugUser) {
        try {
          await supabase.from("debug_logs").insert({
            user_id: debugUser.id,
            data: { workouts, count: workouts.length },
          });
          log(`Debug: wrote ${workouts.length} workouts to debug_logs`);
        } catch {
          log("Debug: failed to write debug_logs");
        }
      }

      if (workouts.length === 0) {
        log("No running workouts in last 7 days");
        return;
      }

      log(`Found ${workouts.length} workouts, uploading...`);
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
        body: JSON.stringify({ workouts }),
      });

      const data = await res.json();
      log(data.error ? `Error: ${data.error}` : `Synced ${data.synced} workouts`);
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
