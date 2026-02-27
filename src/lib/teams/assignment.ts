import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Assigns a newly registered user to the team with the fewest members.
 * If both teams have an equal count, the selection is randomised to prevent
 * a deterministic bias toward one team over time.
 *
 * Uses the admin client so the operation bypasses Row Level Security and can
 * be executed safely from a server-side route (e.g. after Strava OAuth).
 *
 * @returns The team_id that was assigned to the user.
 */
export async function assignTeam(userId: string): Promise<string> {
  const supabase = createAdminClient();

  // Fetch all teams with a count of their current members
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, profiles(count)");

  if (teamsError || !teams || teams.length === 0) {
    throw new Error(
      `Failed to fetch teams for assignment: ${teamsError?.message ?? "no teams found"}`
    );
  }

  // Normalise the Supabase aggregate into a plain list
  const teamCounts = teams.map((team) => ({
    id: team.id as string,
    memberCount: (
      team.profiles as unknown as Array<{ count: number }>
    )[0]?.count ?? 0,
  }));

  // Find the minimum member count across all teams
  const minCount = Math.min(...teamCounts.map((t) => t.memberCount));

  // Collect all teams tied at the minimum — randomise when there is a tie
  const candidates = teamCounts.filter((t) => t.memberCount === minCount);
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  // Persist the assignment to the user's profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ team_id: chosen.id })
    .eq("id", userId);

  if (updateError) {
    throw new Error(
      `Failed to update profile with team assignment: ${updateError.message}`
    );
  }

  return chosen.id;
}
