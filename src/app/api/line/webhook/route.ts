import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { replyMessage } from "@/lib/line/client";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/line/webhook
 *
 * Receives LINE webhook events and responds to commands.
 *
 * Supported commands (in group or 1-on-1):
 *   !排行 or !排行榜  — Show top 5 runners
 *   !分數 or !隊伍    — Show team scores
 *   !報名             — Show registration count + link
 *   !規則             — Show game rules link
 *   !help             — Show available commands
 *
 * When bot joins a group, it saves the group ID for future push notifications.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify LINE signature
  const signature = request.headers.get("x-line-signature");
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (channelSecret && signature) {
    const hash = crypto
      .createHmac("SHA256", channelSecret)
      .update(body)
      .digest("base64");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const data = JSON.parse(body);
  const events = data.events || [];

  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (err) {
      console.error("LINE webhook event handler error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleEvent(event: {
  type: string;
  replyToken: string;
  source: { type: string; groupId?: string; userId?: string };
  message?: { type: string; text: string };
}) {
  // When bot joins a group, save the group ID
  if (event.type === "join" && event.source.groupId) {
    await saveGroupId(event.source.groupId);
    await replyMessage(event.replyToken, [
      {
        type: "text",
        text: "🎰 汗水賭場 Bot 已加入！\n\n輸入 !help 查看可用指令\n\n📱 報名連結：https://runrun-plum.vercel.app/login",
      },
    ]);
    return;
  }

  // Handle text messages
  if (event.type === "message" && event.message?.type === "text") {
    const text = event.message.text.trim();
    const reply = await getCommandReply(text);

    if (reply) {
      await replyMessage(event.replyToken, [{ type: "text", text: reply }]);
    }
  }
}

async function getCommandReply(text: string): Promise<string | null> {
  const cmd = text.toLowerCase();

  if (cmd === "!help" || cmd === "!指令") {
    return [
      "🎰 汗水賭場 Bot 指令：",
      "",
      "!報名 — 查看報名人數",
      "!隊伍 — 查看隊伍分數",
      "!排行 — 跑步排行榜 Top 5",
      "!規則 — 遊戲規則連結",
      "!help — 顯示此說明",
    ].join("\n");
  }

  if (cmd === "!報名" || cmd === "!報名人數") {
    const supabase = createAdminClient();
    const { count: total } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { data: teams } = await supabase
      .from("teams")
      .select("id, name, emoji");

    let teamInfo = "";
    if (teams) {
      for (const team of teams) {
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("team_id", team.id);
        teamInfo += `\n${team.emoji} ${team.name}：${count ?? 0} 人`;
      }
    }

    return [
      `📊 目前報名人數：${total ?? 0} 人`,
      teamInfo,
      "",
      "🔥 3/11（週三）正式開賽！",
      "📱 報名：https://runrun-plum.vercel.app/login",
      "👀 名單：https://runrun-plum.vercel.app/players",
    ].join("\n");
  }

  if (cmd === "!隊伍" || cmd === "!分數" || cmd === "!隊伍分數") {
    const supabase = createAdminClient();
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name, emoji, color");

    if (!teams) return "❌ 無法取得隊伍資料";

    let result = "⚔️ 隊伍對戰\n";

    for (const team of teams) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("team_id", team.id);

      const memberCount = profiles?.length ?? 0;

      if (memberCount > 0) {
        const userIds = profiles!.map((p) => p.id);
        const { data: activities } = await supabase
          .from("activities")
          .select("distance_km")
          .in("user_id", userIds);

        const totalKm = activities?.reduce((sum, a) => sum + a.distance_km, 0) ?? 0;
        result += `\n${team.emoji} ${team.name}（${memberCount}人）\n   📏 ${totalKm.toFixed(1)} km`;
      } else {
        result += `\n${team.emoji} ${team.name}（0人）\n   📏 0 km`;
      }
    }

    return result;
  }

  if (cmd === "!排行" || cmd === "!排行榜") {
    const supabase = createAdminClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, sc_balance")
      .order("sc_balance", { ascending: false })
      .limit(5);

    if (!profiles || profiles.length === 0) {
      return "🏆 排行榜\n\n還沒有人開始跑步，等 3/11 開賽吧！";
    }

    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
    let result = "🏆 $SC 排行榜 Top 5\n";

    for (let i = 0; i < profiles.length; i++) {
      const p = profiles[i];
      result += `\n${medals[i]} ${p.display_name ?? "匿名"} — ${p.sc_balance} $SC`;
    }

    return result;
  }

  if (cmd === "!規則" || cmd === "!遊戲規則") {
    return [
      "📖 汗水賭場遊戲規則",
      "",
      "🏃 每跑 1 公里 = 10 $SC",
      "🌧️ 惡劣天氣跑步 = 1.5 倍獎勵",
      "💀 每週跑不到 5km 扣 5% $SC",
      "⚔️ 紅白兩隊 PK，看誰更強！",
      "",
      "📱 完整規則：https://runrun-plum.vercel.app/guide",
    ].join("\n");
  }

  // Not a command — ignore
  return null;
}

/**
 * Save a LINE group ID to the database for future push notifications.
 */
async function saveGroupId(groupId: string) {
  // Store in a simple key-value approach using Supabase
  // For now, just log it — we can persist it later
  console.log(`LINE Bot joined group: ${groupId}`);

  // TODO: persist group ID to database for push notifications
}
