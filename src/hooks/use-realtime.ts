"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Activity, BettingPool, Profile } from "@/types";

/**
 * Subscribes to INSERT events on the activities table.
 *
 * Each new activity posted by any user triggers the provided callback,
 * allowing the leaderboard and team stats to update in real-time without
 * requiring a full page refresh or polling interval.
 *
 * The subscription is automatically removed when the component unmounts.
 */
export function useRealtimeActivities(
  onNewActivity: (activity: Activity) => void
): void {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("realtime:activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        (payload) => {
          onNewActivity(payload.new as Activity);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // onNewActivity is excluded intentionally — callers should wrap it in
    // useCallback to avoid re-subscribing on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Subscribes to UPDATE events on the profiles table for a specific user.
 *
 * Used to keep the $SC balance and profile data in sync when another
 * server-side process (e.g. the survival tax cron job) mutates the row.
 *
 * The subscription is scoped to a single userId to prevent all profile
 * updates from being broadcast to unrelated components.
 */
export function useRealtimeProfile(
  userId: string,
  onUpdate: (profile: Profile) => void
): void {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`realtime:profile:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          onUpdate(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}

/**
 * Subscribes to UPDATE events on the betting_pools table for a specific pool.
 *
 * Keeps the odds display accurate as other users place entries — the total
 * pool and side totals change with every new bet, shifting the pari-mutuel odds.
 */
export function useRealtimePool(
  poolId: string,
  onUpdate: (pool: BettingPool) => void
): void {
  useEffect(() => {
    if (!poolId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`realtime:pool:${poolId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "betting_pools",
          filter: `id=eq.${poolId}`,
        },
        (payload) => {
          onUpdate(payload.new as BettingPool);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId]);
}
