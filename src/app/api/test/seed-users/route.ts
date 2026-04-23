import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/test/seed-users
 *
 * Creates 10 test users with pre-assigned teams for development/testing.
 * Protected by CRON_SECRET to prevent abuse.
 *
 * Each user gets:
 * - An auto-generated email (testN@sweatcasino.dev)
 * - A random display name in Chinese
 * - Auto-assigned to alternating Red Bulls / White Bears teams
 * - 100 $SC starting balance (handled by DB trigger)
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch existing teams
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name")
    .order("name");

  if (teamsError || !teams || teams.length < 2) {
    return NextResponse.json(
      { error: "Teams not found", details: teamsError?.message },
      { status: 500 }
    );
  }

  const testUsers = [
    { name: "跑步小王子", email: "test1@sweatcasino.dev" },
    { name: "汗水戰士", email: "test2@sweatcasino.dev" },
    { name: "賭神阿明", email: "test3@sweatcasino.dev" },
    { name: "速度之星", email: "test4@sweatcasino.dev" },
    { name: "晨跑達人", email: "test5@sweatcasino.dev" },
    { name: "夜跑俠", email: "test6@sweatcasino.dev" },
    { name: "馬拉松狂人", email: "test7@sweatcasino.dev" },
    { name: "慢跑小妹", email: "test8@sweatcasino.dev" },
    { name: "風速跑者", email: "test9@sweatcasino.dev" },
    { name: "鐵腿阿嬤", email: "test10@sweatcasino.dev" },
  ];

  const results: Array<{
    email: string;
    name: string;
    team: string;
    status: string;
  }> = [];

  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    // Alternate teams: even index -> team[0], odd -> team[1]
    const team = teams[i % 2];

    // Create auth user via Supabase Admin API
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: user.email,
        password: "test123456",
        email_confirm: true,
        user_metadata: {
          display_name: user.name,
          full_name: user.name,
        },
      });

    if (authError) {
      // User might already exist
      if (authError.message.includes("already been registered")) {
        results.push({
          email: user.email,
          name: user.name,
          team: team.name,
          status: "already_exists",
        });
        continue;
      }
      results.push({
        email: user.email,
        name: user.name,
        team: team.name,
        status: `error: ${authError.message}`,
      });
      continue;
    }

    if (!authUser.user) {
      results.push({
        email: user.email,
        name: user.name,
        team: team.name,
        status: "error: no user returned",
      });
      continue;
    }

    // Update the profile with team and display name
    // (profile is auto-created by handle_new_user trigger)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: user.name,
        team_id: team.id,
      })
      .eq("id", authUser.user.id);

    if (profileError) {
      results.push({
        email: user.email,
        name: user.name,
        team: team.name,
        status: `user_created_but_profile_error: ${profileError.message}`,
      });
      continue;
    }

    results.push({
      email: user.email,
      name: user.name,
      team: team.name,
      status: "created",
    });
  }

  const created = results.filter((r) => r.status === "created").length;
  const existing = results.filter((r) => r.status === "already_exists").length;
  const errors = results.filter(
    (r) => r.status !== "created" && r.status !== "already_exists"
  ).length;

  return NextResponse.json({
    summary: { created, existing, errors, total: testUsers.length },
    results,
  });
}
