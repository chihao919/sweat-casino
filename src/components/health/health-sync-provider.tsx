"use client";

import { useEffect } from "react";
import { useHealthSync } from "@/hooks/use-health-sync";
import { createClient } from "@/lib/supabase/client";

/**
 * Mount marker: writes a debug_logs entry immediately when the provider
 * mounts so we can tell whether the protected layout actually reached this.
 */
export function HealthSyncProvider() {
  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          await sb.from("debug_logs").insert({
            user_id: user.id,
            data: {
              marker: "HealthSyncProvider mounted",
              at: new Date().toISOString(),
            },
          });
        }
      } catch {
        /* swallow */
      }
    })();
  }, []);

  useHealthSync();
  return null;
}
