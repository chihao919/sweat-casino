import { NextRequest, NextResponse } from "next/server";
import { pushMessage, broadcastMessage } from "@/lib/line/client";

/**
 * POST /api/line/push
 *
 * Send a push message to a LINE group or broadcast to all followers.
 * Protected by CRON_SECRET.
 *
 * Body:
 *   { "groupId": "C...", "message": "Hello!" }   — push to specific group
 *   { "broadcast": true, "message": "Hello!" }    — broadcast to all followers
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { groupId, message, broadcast } = body;

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  try {
    if (broadcast) {
      await broadcastMessage([{ type: "text", text: message }]);
      return NextResponse.json({ ok: true, type: "broadcast" });
    }

    if (groupId) {
      await pushMessage(groupId, [{ type: "text", text: message }]);
      return NextResponse.json({ ok: true, type: "push", groupId });
    }

    return NextResponse.json(
      { error: "Either groupId or broadcast:true is required" },
      { status: 400 }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
