import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignTeam } from "@/lib/teams/assignment";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Profile } from "@/types";

/**
 * Server-side layout for all protected routes.
 * Handles auth guard and automatic team assignment on first login.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Verify the user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user profile with team relation
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, team:teams(*)")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    // Profile should be created on signup; if missing something went wrong
    redirect("/login");
  }

  // Auto-assign team if the user does not have one yet
  if (!profile.team_id) {
    try {
      await assignTeam(user.id);
    } catch (err) {
      // Log the error but do not block the user from accessing the app
      console.error("ProtectedLayout: failed to assign team", err);
    }
  }

  // Determine team color for BottomNav active indicator
  const teamColor: "red" | "white" | null = profile.team
    ? profile.team.name.toLowerCase().includes("red")
      ? "red"
      : "white"
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950">
      <Header profile={profile} />

      {/* Main content — add bottom padding on mobile to avoid BottomNav overlap */}
      <main className="mx-auto w-full max-w-screen-lg flex-1 px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      <BottomNav teamColor={teamColor} />
    </div>
  );
}
