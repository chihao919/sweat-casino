"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HealthSyncProvider } from "@/components/health/health-sync-provider";
import { API_BASE_URL } from "@/lib/config";
import { Profile } from "@/types";

/**
 * Client-side layout for all protected routes.
 * Handles auth guard and automatic team assignment on first login.
 *
 * Converted from server component to support static export (Capacitor local
 * bundle mode). Server redirects are not available in static export, so auth
 * and profile checks run client-side here.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initLayout() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, team:teams(*)")
        .eq("id", user.id)
        .single<Profile>();

      if (!profileData) {
        // Profile should be created on signup; redirect if missing
        router.replace("/login");
        return;
      }

      // Auto-assign team if the user does not have one yet
      if (!profileData.team_id) {
        try {
          await fetch(`${API_BASE_URL}/api/profile/assign-team`, {
            method: "POST",
          });
          // Re-fetch profile so team info is available in the header
          const { data: updatedProfile } = await supabase
            .from("profiles")
            .select("*, team:teams(*)")
            .eq("id", user.id)
            .single<Profile>();
          setProfile(updatedProfile ?? profileData);
        } catch (err) {
          // Log but do not block the user from accessing the app
          console.error("ProtectedLayout: failed to assign team", err);
          setProfile(profileData);
        }
      } else {
        setProfile(profileData);
      }

      // Redirect new users (no display name) to onboarding — skip if already on /setup
      if (!profileData.display_name && !pathname.startsWith("/setup")) {
        router.replace("/setup");
        return;
      }

      setIsReady(true);
    }

    initLayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teamColor: "red" | "white" | null = profile?.team
    ? profile.team.name.toLowerCase().includes("red")
      ? "red"
      : "white"
    : null;

  // Render nothing until auth check is complete to prevent flash of protected content
  if (!isReady) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header profile={profile} />
      <HealthSyncProvider />

      {/* Main content — add bottom padding on mobile to avoid BottomNav overlap */}
      <main className="mx-auto w-full max-w-screen-lg flex-1 px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      <BottomNav teamColor={teamColor} />
    </div>
  );
}
