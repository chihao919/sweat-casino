"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Listens for Capacitor deep link (runrun://auth/callback?access_token=...&refresh_token=...)
 * after OAuth completes in the system browser, then sets the session in the WebView.
 */
export function CapacitorAuthHandler() {
  useEffect(() => {
    const isNative =
      typeof window !== "undefined" &&
      (window as unknown as Record<string, unknown>).Capacitor !== undefined;

    if (!isNative) return;

    let cleanup: (() => void) | undefined;

    async function setupListener() {
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("appUrlOpen", async (event) => {
          const url = new URL(event.url);

          if (url.pathname === "/auth/callback" || url.host === "auth") {
            const accessToken = url.searchParams.get("access_token");
            const refreshToken = url.searchParams.get("refresh_token");

            if (accessToken && refreshToken) {
              const supabase = createClient();
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (!error) {
                // Close the system browser and navigate to dashboard
                const { Browser } = await import("@capacitor/browser");
                await Browser.close();
                window.location.href = "/dashboard";
              } else {
                console.error("[CapacitorAuth] setSession failed:", error.message);
              }
            }
          }
        });

        cleanup = () => listener.remove();
      } catch (err) {
        console.error("[CapacitorAuth] Failed to setup listener:", err);
      }
    }

    setupListener();

    return () => {
      cleanup?.();
    };
  }, []);

  return null;
}
