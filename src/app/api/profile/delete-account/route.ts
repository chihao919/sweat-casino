import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/profile/delete-account
 *
 * Permanently deletes the authenticated user's account and all associated data.
 * Required by Apple App Store guidelines (guideline 5.1.1 — Data Collection and Storage).
 *
 * Supports both cookie-based auth (web) and Bearer token auth (native app).
 *
 * Deletion order:
 *   1. activities
 *   2. sc_transactions
 *   3. bets
 *   4. profiles
 *   5. auth.users (via admin API)
 */

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function DELETE(request: NextRequest) {
  // Resolve the user via Bearer token (native) or session cookie (web)
  const authHeader = request.headers.get("authorization");
  let userId: string;

  const admin = createAdminClient();

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
    userId = data.user.id;
  } else {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
    userId = data.user.id;
  }

  const corsHeaders = { "Access-Control-Allow-Origin": "*" };

  try {
    // Delete activities
    const { error: activitiesError } = await admin
      .from("activities")
      .delete()
      .eq("user_id", userId);

    if (activitiesError) {
      console.error("[delete-account] Failed to delete activities:", activitiesError.message);
      return NextResponse.json(
        { error: "Failed to delete activities" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Delete sc_transactions
    const { error: txError } = await admin
      .from("sc_transactions")
      .delete()
      .eq("user_id", userId);

    if (txError) {
      console.error("[delete-account] Failed to delete sc_transactions:", txError.message);
      // Non-fatal: continue with remaining deletions
    }

    // Delete bets
    const { error: betsError } = await admin
      .from("bets")
      .delete()
      .eq("user_id", userId);

    if (betsError) {
      console.error("[delete-account] Failed to delete bets:", betsError.message);
      // Non-fatal: continue
    }

    // Delete profile row
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("[delete-account] Failed to delete profile:", profileError.message);
      return NextResponse.json(
        { error: "Failed to delete profile" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Finally delete the auth user — must be last because it invalidates the session
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("[delete-account] Failed to delete auth user:", authDeleteError.message);
      return NextResponse.json(
        { error: "Failed to delete auth user" },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    console.error("[delete-account] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
