import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/health/debug
 * Temporary endpoint to dump raw HealthKit data for debugging.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await request.json();

  // Log to server console for inspection
  console.log(`\n===== HEALTH DEBUG for ${data.user.email} =====`);
  console.log(JSON.stringify(body.debugData, null, 2));
  console.log("===== END HEALTH DEBUG =====\n");

  return NextResponse.json(
    { ok: true, user: data.user.email },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
