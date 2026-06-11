"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";
import { API_BASE_URL } from "@/lib/config";
import { App } from "@capacitor/app";
import {
  requestHealthAuthorization,
  getRunningWorkouts,
  getRunningSamples,
  readDistanceSamples,
  probePluginVersion,
  probeIsAvailable,
} from "@/lib/health/client";

/** Race a probe against a timeout; never throws, always returns a loggable string. */
async function runProbe(probe: () => Promise<string>, timeoutMs: number): Promise<string> {
  try {
    return await Promise.race([
      probe(),
      new Promise<string>(r => setTimeout(() => r("TIMEOUT"), timeoutMs)),
    ]);
  } catch (err) {
    return `error: ${err}`;
  }
}

/**
 * Auto-syncs HealthKit / Health Connect data on native devices.
 * Writes a debug_logs entry on every run (success or failure) so we can trace
 * where the flow stops.
 */
export function useHealthSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const trace: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = { trace, kind: "use-health-sync" };

    const tlog = (msg: string) => {
      const line = `[${new Date().toISOString()}] ${msg}`;
      trace.push(line);
      setLastSyncResult(msg);
      fetch(`${API_BASE_URL}/api/public/players?_healthlog=${encodeURIComponent(msg)}`).catch(() => {});
    };

    const writeTrace = async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          await sb.from("debug_logs").insert({
            user_id: user.id,
            data: payload,
          });
        } else {
          payload.no_user = true;
        }
      } catch (e) {
        payload.trace_write_error = String(e);
      }
    };

    (async () => {
      tlog(`useEffect fired, isNative=${Capacitor.isNativePlatform()}, platform=${Capacitor.getPlatform()}`);
      // Write an initial marker IMMEDIATELY so we can confirm the hook ran
      // even if any later step hangs.
      await writeTrace();

      if (!Capacitor.isNativePlatform()) {
        return;
      }

      setSyncing(true);
      try {
        // --- Layer probes: pinpoint where the native call chain breaks ---
        // 0. PluginHeaders is injected by the NATIVE bridge at startup and lists
        //    only plugins that actually registered natively. isPluginAvailable
        //    can't be trusted for this: registerPlugin() on the JS side makes it
        //    return true even when the native class never loaded.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const headers = (window as any).Capacitor?.PluginHeaders as Array<{ name: string }> | undefined;
        tlog(`Probe: PluginHeaders=${JSON.stringify((headers || []).map(h => h.name))}`);

        // 1. JS-side registry: is the plugin known to the Capacitor runtime?
        tlog(`Probe: isPluginAvailable(Health)=${Capacitor.isPluginAvailable("Health")}`);

        // 2. Bridge control: a non-Health native plugin. If this hangs the
        //    whole bridge is broken, not the Health plugin.
        const appInfo = await runProbe(
          async () => JSON.stringify(await App.getInfo()),
          3000
        );
        tlog(`Probe: App.getInfo -> ${appInfo}`);

        // 3. Health plugin via raw nativePromise, no HealthKit involved.
        //    WARNING: never import "@capgo/capacitor-health" (even dynamically)
        //    — evaluating that module poisons window.Capacitor.Plugins.Health
        //    with a broken proxy. See src/lib/health/client.ts.
        const version = await runProbe(() => probePluginVersion(), 3000);
        tlog(`Probe: Health.getPluginVersion -> ${version}`);

        // 4. Health plugin + synchronous HealthKit availability check only.
        const avail = await runProbe(() => probeIsAvailable(), 3000);
        tlog(`Probe: Health.isAvailable -> ${avail}`);

        payload.probes = { appInfo, version, avail };
        await writeTrace(); // snapshot probes before the auth attempt

        // 60s: the native callback only fires after the user answers the
        // HealthKit permission sheet, so give them time to respond.
        tlog("About to call requestHealthAuthorization (60s timeout)...");
        await writeTrace();   // snapshot before auth

        let authorized = false;
        try {
          authorized = await Promise.race([
            requestHealthAuthorization(),
            new Promise<boolean>(r => setTimeout(() => { payload.authTimedOut = true; r(false); }, 60000)),
          ]);
        } catch (e) {
          payload.authError = String(e);
        }
        tlog(`Auth returned: ${authorized}`);
        payload.authorized = authorized;
        await writeTrace();   // snapshot after auth

        tlog("About to read samples (30s timeout each)...");
        await writeTrace();   // snapshot before readSamples
        const [rawSamples, hkWorkouts, runningSamples] = await Promise.all([
          Promise.race([
            readDistanceSamples(14),
            new Promise<never[]>(r => setTimeout(() => r([]), 30000)),
          ]),
          Promise.race([
            getRunningWorkouts(14),
            new Promise<never[]>(r => setTimeout(() => r([]), 30000)),
          ]),
          Promise.race([
            getRunningSamples(14),
            new Promise<never[]>(r => setTimeout(() => r([]), 30000)),
          ]),
        ]);

        payload.rawSamples = rawSamples;
        payload.hkWorkouts = hkWorkouts;
        payload.runningSamples = runningSamples;
        payload.rawCount = rawSamples.length;
        payload.workoutCount = hkWorkouts.length;
        payload.filteredCount = runningSamples.length;

        tlog(`Got ${rawSamples.length} raw / ${hkWorkouts.length} workouts / ${runningSamples.length} filtered`);

        const realWorkouts = hkWorkouts.filter(w => (w.duration || 0) > 0);
        const workouts = realWorkouts.length > 0 ? realWorkouts : runningSamples;
        payload.usedSource = realWorkouts.length > 0 ? "hkWorkouts" : "filteredSamples";

        if (workouts.length === 0) {
          tlog("Nothing to upload — abort");
          return;
        }

        tlog(`Uploading ${workouts.length} workouts...`);
        const sb = createClient();
        const { data: { session } } = await sb.auth.getSession();
        if (!session) {
          tlog("No session — abort");
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
        payload.uploadResponse = data;
        tlog(data.error ? `Upload error: ${data.error}` : `Synced ${data.synced} workouts`);
      } catch (err) {
        tlog(`EXCEPTION: ${err}`);
        payload.exception = String(err);
      } finally {
        await writeTrace();
        setSyncing(false);
      }
    })();
  }, []);

  return { syncing, lastSyncResult };
}
