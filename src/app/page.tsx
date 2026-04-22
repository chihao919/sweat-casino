"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * TEMP DEBUG: Full flow diagnostics
 */
export default function RootPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().slice(11, 19)} ${msg}`]);
  };

  useEffect(() => {
    // Listen for appUrlOpen (deep link callback)
    import("@capacitor/app").then(({ App }) => {
      App.addListener("appUrlOpen", (event) => {
        log(`appUrlOpen: ${event.url}`);
        // Try to set session
        const url = new URL(event.url);
        const accessToken = url.searchParams.get("access_token");
        const refreshToken = url.searchParams.get("refresh_token");
        if (accessToken && refreshToken) {
          log("Tokens received! Setting session...");
          const supabase = createClient();
          supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            .then(({ error }) => {
              if (error) log(`setSession error: ${error.message}`);
              else log("Session set OK! Refreshing...");
              // Re-run diagnose
              setTimeout(() => window.location.reload(), 1000);
            });
        } else {
          log("No tokens in URL");
        }
      });
      log("appUrlOpen listener registered");
    }).catch(e => log(`App listener error: ${e}`));

    async function diagnose() {
      // 1. Capacitor
      const { Capacitor } = await import("@capacitor/core");
      log(`Platform: ${Capacitor.getPlatform()}, Native: ${Capacitor.isNativePlatform()}`);

      // 2. Supabase session
      const supabase = createClient();
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) log(`Auth error: ${authErr.message}`);
      log(`User: ${user ? user.email || user.id : "NOT LOGGED IN"}`);

      // 3. If logged in, test HealthKit
      if (user && Capacitor.isNativePlatform()) {
        log("--- HealthKit Test ---");
        try {
          const { Health } = await import("@capgo/capacitor-health");
          const avail = await Health.isAvailable();
          log(`Available: ${avail.available}`);

          const auth = await Health.requestAuthorization({
            read: ["distance", "exerciseTime", "calories"],
            write: [],
          });
          log(`Auth: ${JSON.stringify(auth)}`);

          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const samples = await Health.readSamples({
            dataType: "distance",
            startDate: weekAgo.toISOString(),
            endDate: new Date().toISOString(),
          });
          const km = (samples.samples || []).reduce((s, d) => s + (d.value || 0), 0) / 1000;
          log(`Distance (7d): ${km.toFixed(2)} km, samples: ${samples.samples?.length || 0}`);
        } catch (e) { log(`HealthKit error: ${e}`); }
      }

      // 4. If NOT logged in, test OAuth flow
      if (!user) {
        log("--- OAuth Test ---");
        log("Testing signInWithOAuth (skipBrowserRedirect)...");
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: "https://runrun-plum.vercel.app/auth-native.html",
              skipBrowserRedirect: true,
              queryParams: { response_type: "token" },
            },
          });
          if (error) {
            log(`OAuth error: ${error.message}`);
          } else {
            log(`OAuth URL generated: ${data?.url ? "YES" : "NO"}`);
            log(`URL: ${data?.url?.slice(0, 80)}...`);
            log("Tap 'Open Login' button below to test Browser.open()");
          }
        } catch (e) { log(`OAuth exception: ${e}`); }
      }
    }

    diagnose();
  }, []);

  async function openLogin() {
    log("Opening Browser...");
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://runrun-plum.vercel.app/auth-native.html",
          skipBrowserRedirect: true,
          queryParams: { response_type: "token" },
        },
      });
      if (data?.url) {
        const { Browser } = await import("@capacitor/browser");
        log(`Calling Browser.open()...`);
        await Browser.open({ url: data.url });
        log("Browser.open() called OK");
      } else {
        log("No URL from OAuth");
      }
    } catch (e) {
      log(`Browser.open error: ${e}`);
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 font-mono text-xs leading-relaxed">
      <h1 className="text-base font-bold text-white mb-3">Full Flow Debug</h1>
      <button onClick={openLogin} className="mb-4 px-4 py-3 bg-blue-600 text-white font-bold rounded-lg text-sm w-full">
        Open Login (Google)
      </button>
      <div className="space-y-0.5">
        {logs.map((l, i) => (
          <div key={i} className={l.includes("error") || l.includes("Error") ? "text-red-400" : l.includes("---") ? "text-yellow-400" : ""}>{l}</div>
        ))}
      </div>
    </div>
  );
}
