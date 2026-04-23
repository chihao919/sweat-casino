"use client";

import { useHealthSync } from "@/hooks/use-health-sync";

/**
 * Invisible component that triggers health data sync on native platforms.
 * Place this inside the protected layout so it runs after login.
 */
export function HealthSyncProvider() {
  const { syncing, lastSyncResult } = useHealthSync();
  if (!lastSyncResult && !syncing) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-800/90 px-3 py-2 text-xs text-zinc-300 text-center">
      {lastSyncResult || (syncing ? "Starting..." : "")}
    </div>
  );
}
