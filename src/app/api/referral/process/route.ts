import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/referral/process
 *
 * Called after a new user logs in for the first time with a referral cookie.
 * Links the new user to the referrer and awards the referrer 50 $SC.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { referrerId } = await request.json();

  if (!referrerId || referrerId === user.id) {
    return NextResponse.json({ error: "Invalid referrer" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check if this user already has a referrer (prevent double-claiming)
  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", user.id)
    .single();

  if (profile?.referred_by) {
    return NextResponse.json({ message: "Referral already processed" });
  }

  // Process the referral reward via the DB function
  const { data, error } = await admin.rpc("process_referral_reward", {
    p_new_user_id: user.id,
    p_referrer_id: referrerId,
  });

  if (error) {
    console.error("[referral/process] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to process referral" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: data });
}
