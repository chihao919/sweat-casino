"use client";

import { useHealthSync } from "@/hooks/use-health-sync";

/**
 * Component that triggers health data sync on native platforms.
 * Shows debug toast with sync status.
 */
export function HealthSyncProvider() {
  const { syncing, lastSyncResult } = useHealthSync();

  // Show a small debug banner at the top when there's a result
  if (!lastSyncResult && !syncing) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-800/90 px-3 py-1.5 text-xs text-zinc-300 text-center">
      {syncing ? "Health sync..." : lastSyncResult}
    </div>
  );
}
