"use client";

import { useEffect, useState } from "react";

/**
 * Health sync component — reads daily distance from HealthKit
 * using queryAggregated (auto de-duplicates sources) and writes to Supabase.
 */
export function HealthSyncProvider() {
  const [status, setStatus] = useState("init");

  useEffect(() => {
    async function run() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const { Health } = await import("@capgo/capacitor-health");

        const avail = await Health.isAvailable();
        if (!avail.available) { setStatus("Health not available"); return; }

        await Health.requestAuthorization({
          read: ["distance", "exerciseTime", "calories", "workouts" as never],
          write: [],
        });

        setStatus("reading...");
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);

        // queryAggregated by day — auto de-duplicates sources (like Health app does)
        const result = await Health.queryAggregated({
          dataType: "distance",
          startDate: monthAgo.toISOString(),
          endDate: new Date().toISOString(),
          bucket: "day",
          aggregation: "sum",
        });

        const days = (result.samples || []).filter(s => s.value > 100); // >100m = actual activity
        if (days.length === 0) { setStatus("No distance data"); return; }

        setStatus(`${days.length} days, syncing...`);

        // Write to Supabase
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setStatus("no user"); return; }

        // Get existing activities to avoid duplicates
        const { data: existing } = await supabase
          .from("activities")
          .select("start_date")
          .eq("user_id", user.id)
          .gte("start_date", monthAgo.toISOString());

        const existingDates = new Set(
          (existing || []).map(a => a.start_date?.slice(0, 10))
        );

        let synced = 0;
        let totalKm = 0;

        for (const day of days) {
          const dateStr = day.startDate.slice(0, 10);
          if (existingDates.has(dateStr)) continue;
          const km = day.value / 1000;
          if (km < 0.5) continue; // skip days with less than 0.5 km

          const { error } = await supabase
            .from("activities")
            .insert({
              user_id: user.id,
              name: "Run (Health)",
              distance_km: Math.round(km * 100) / 100,
              duration_seconds: 0,
              pace_per_km: 0,
              start_date: `${dateStr}T00:00:00.000Z`,
              sc_earned: Math.round(km * 5 * 100) / 100,
              is_mock: false,
            });

          if (!error) { synced++; totalKm += km; }
        }

        // Update profile stats
        if (synced > 0) {
          const { data: allActs } = await supabase
            .from("activities")
            .select("distance_km")
            .eq("user_id", user.id);

          const total = (allActs || []).reduce((s, a) => s + a.distance_km, 0);
          await supabase
            .from("profiles")
            .update({
              total_distance_km: total,
              total_activities: (allActs || []).length,
              last_active_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        }

        setStatus(synced > 0 ? `+${synced} days (${totalKm.toFixed(1)} km)` : "Up to date");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStatus(`err: ${msg.slice(0, 100)}`);
      }
    }

    setTimeout(run, 3000);
  }, []);

  return null;
}
