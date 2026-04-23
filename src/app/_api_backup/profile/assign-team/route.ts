import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assignTeam } from "@/lib/teams/assignment";

/**
 * POST /api/profile/assign-team
 *
 * Assigns the authenticated user to a team if they are not yet assigned.
 * Called from the client-side protected layout after auth check.
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teamId = await assignTeam(user.id);
    return NextResponse.json({ teamId });
  } catch (err) {
    console.error("[assign-team] Failed to assign team:", err);
    return NextResponse.json(
      { error: "Failed to assign team" },
      { status: 500 }
    );
  }
}
