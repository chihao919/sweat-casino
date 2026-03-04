import { NextRequest, NextResponse } from "next/server";

const LINE_API = "https://api.line.me/v2/bot";
const LINE_API_DATA = "https://api-data.line.me/v2/bot";

/**
 * POST /api/line/setup-richmenu
 *
 * Creates and sets the default Rich Menu for the LINE Bot.
 * Protected by CRON_SECRET. Only needs to be called once.
 *
 * Steps:
 * 1. Create rich menu structure (button layout + actions)
 * 2. Upload the rich menu background image
 * 3. Set as default rich menu for all users
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Missing LINE_CHANNEL_ACCESS_TOKEN" },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://runrun-plum.vercel.app";

  try {
    // Step 1: Create rich menu
    const richMenuBody = {
      size: { width: 2500, height: 843 },
      selected: true,
      name: "汗水賭場 Menu",
      chatBarText: "🎰 開啟選單",
      areas: [
        // Top row: 3 buttons (each ~833px wide, ~421px tall)
        {
          bounds: { x: 0, y: 0, width: 833, height: 421 },
          action: { type: "message", text: "@RunRun 報名" },
        },
        {
          bounds: { x: 833, y: 0, width: 834, height: 421 },
          action: { type: "message", text: "@RunRun 隊伍" },
        },
        {
          bounds: { x: 1667, y: 0, width: 833, height: 421 },
          action: { type: "message", text: "@RunRun 排行" },
        },
        // Bottom row: 2 buttons (each 1250px wide, ~422px tall)
        {
          bounds: { x: 0, y: 421, width: 1250, height: 422 },
          action: { type: "message", text: "@RunRun 規則" },
        },
        {
          bounds: { x: 1250, y: 421, width: 1250, height: 422 },
          action: { type: "uri", uri: appUrl },
        },
      ],
    };

    const createRes = await fetch(`${LINE_API}/richmenu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(richMenuBody),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json(
        { error: "Failed to create rich menu", details: err },
        { status: 500 }
      );
    }

    const { richMenuId } = await createRes.json();

    // Step 2: Download and upload the rich menu image
    const imageUrl = `${appUrl}/api/og/richmenu`;
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch rich menu image" },
        { status: 500 }
      );
    }
    const imageBuffer = await imageRes.arrayBuffer();

    const uploadRes = await fetch(
      `${LINE_API_DATA}/richmenu/${richMenuId}/content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "image/png",
          Authorization: `Bearer ${token}`,
        },
        body: imageBuffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return NextResponse.json(
        { error: "Failed to upload rich menu image", details: err },
        { status: 500 }
      );
    }

    // Step 3: Set as default rich menu
    const defaultRes = await fetch(
      `${LINE_API}/user/all/richmenu/${richMenuId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!defaultRes.ok) {
      const err = await defaultRes.text();
      return NextResponse.json(
        { error: "Failed to set default rich menu", details: err },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      richMenuId,
      message: "Rich menu created, image uploaded, and set as default",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
