"use client";

import { useEffect, useState } from "react";

/**
 * Health sync component — directly calls Health plugin.
 */
export function HealthSyncProvider() {
  const [status, setStatus] = useState("init");

  useEffect(() => {
    async function run() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) {
          setStatus("not native");
          return;
        }

        setStatus("importing Health...");
        const { Health } = await import("@capgo/capacitor-health");

        setStatus("checking...");
        const avail = await Health.isAvailable();
        setStatus(`avail: ${JSON.stringify(avail)}`);

        if (!avail.available) {
          setStatus("Health not available");
          return;
        }

        setStatus("auth...");
        await Health.requestAuthorization({
          read: ["distance", "exerciseTime", "calories"],
          write: [],
        });

        setStatus("reading...");
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const samples = await Health.readSamples({
          dataType: "distance",
          startDate: weekAgo.toISOString(),
          endDate: new Date().toISOString(),
        });
        const km = (samples.samples || []).reduce((s, d) => s + (d.value || 0), 0) / 1000;
        setStatus(`${km.toFixed(1)} km, uploading...`);

        if (km > 0) {
          // Upload to Supabase
          const { createClient } = await import("@/lib/supabase/client");
          const { API_BASE_URL } = await import("@/lib/config");
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            const res = await fetch(`${API_BASE_URL}/api/health/sync`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                source: "healthkit",
                distanceKm: km,
                startDate: weekAgo.toISOString(),
                endDate: new Date().toISOString(),
              }),
            });
            const data = await res.json();
            setStatus(data.error ? `err: ${data.error}` : `Synced ${km.toFixed(1)} km!`);
          } else {
            setStatus(`${km.toFixed(1)} km (no session)`);
          }
        } else {
          setStatus("No distance");
        }
      } catch (e) {
        setStatus(`err: ${e}`);
      }
    }

    // Delay to let everything initialize
    setTimeout(run, 3000);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-800/90 px-3 py-2 text-xs text-zinc-300 text-center">
      Health: {status}
    </div>
  );
}
