"use client";

import { useHealthSync } from "@/hooks/use-health-sync";

/**
 * Invisible component that triggers health data sync on native platforms.
 * Place this inside the protected layout so it runs after login.
 */
export function HealthSyncProvider() {
  useHealthSync();
  return null;
}
