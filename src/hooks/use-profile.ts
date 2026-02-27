"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";

interface ProfileStore {
  profile: Profile | null
  isLoading: boolean
  fetchProfile: () => Promise<void>
  updateBalance: (newBalance: number) => void
  setProfile: (profile: Profile) => void
}

/**
 * Global Zustand store for the authenticated user's profile.
 *
 * Centralising profile state here avoids prop-drilling and ensures that
 * components such as the nav bar and betting widgets always reflect the
 * same $SC balance without redundant Supabase queries.
 */
export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  isLoading: false,

  /**
   * Fetches the current user's profile from Supabase, joining the team row
   * so downstream components can display team name and colour without a
   * second request.
   */
  fetchProfile: async () => {
    set({ isLoading: true });

    const supabase = createClient();

    try {
      // Resolve the authenticated session first to get the user id
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        set({ profile: null, isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*, team:teams(*)")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        console.error("Failed to fetch profile:", error?.message);
        set({ profile: null, isLoading: false });
        return;
      }

      set({ profile: data as Profile, isLoading: false });
    } catch (err) {
      console.error("Unexpected error while fetching profile:", err);
      set({ isLoading: false });
    }
  },

  /**
   * Optimistically updates the in-memory $SC balance after a transaction.
   * The canonical value is always persisted in the database; this update
   * prevents the UI from flickering while the realtime event propagates.
   */
  updateBalance: (newBalance: number) => {
    set((state) => {
      if (!state.profile) return state;
      return { profile: { ...state.profile, sc_balance: newBalance } };
    });
  },

  /**
   * Directly replaces the profile — used by the realtime subscription
   * to apply server-pushed updates without an extra fetch round-trip.
   */
  setProfile: (profile: Profile) => {
    set({ profile });
  },
}));
