import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { replyMessage, QUICK_REPLY_BUTTONS } from "@/lib/line/client";
import { menuCard, dataCard } from "@/lib/line/templates";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/line/webhook
 *
 * Receives LINE webhook events. The bot ONLY responds when:
 * 1. It is @mentioned in a group message
 * 2. It receives a direct 1-on-1 message
 * 3. It joins a group (greeting)
 *
 * Reply messages are FREE and unlimited — no cost incurred.
 * Push/broadcast messages cost money and are NOT used here.
 *
 * Supported commands (after @mention or in DM):
 *   報名 / 報名人數  — Registration count
 *   隊伍 / 分數      — Team scores
 *   排行 / 排行榜    — Top 5 leaderboard
 *   規則             — Game rules link
 *   help / 指令      — Available commands
 */

// The bot's LINE user ID — set via env or detected at runtime
const BOT_USER_ID = process.env.LINE_BOT_USER_ID || "";

export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify LINE signature (log mismatch but don't block during setup)
  const signature = request.headers.get("x-line-signature");
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (channelSecret && signature) {
    const hash = crypto
      .createHmac("SHA256", channelSecret)
      .update(body)
      .digest("base64");

    if (hash !== signature) {
      console.warn("LINE webhook signature mismatch — check LINE_CHANNEL_SECRET env var");
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

interface LineEvent {
  type: string;
  replyToken: string;
  source: { type: string; groupId?: string; userId?: string };
  message?: {
    type: string;
    text: string;
    mention?: {
      mentionees: Array<{
        index: number;
        length: number;
        type: string;
        userId?: string;
      }>;
    };
  };
}

async function handleEvent(event: LineEvent) {
  // When bot joins a group, save the group ID and greet
  if (event.type === "join" && event.source.groupId) {
    await saveGroupId(event.source.groupId);
    try {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: "🎰 汗水賭場 Bot 已加入！\n\n在群組裡 @我 或點下方按鈕查詢 👇",
        },
        menuCard(),
      ]);
    } catch {
      // Fallback to simple text if Flex fails
      try {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: "🎰 汗水賭場 Bot 已加入！\n\n輸入：報名、隊伍、排行、規則\n📱 https://runrun-plum.vercel.app",
          },
        ]);
      } catch {
        // Token expired — ignore
      }
    }
    return;
  }

  // Only handle text messages
  if (event.type !== "message" || event.message?.type !== "text") {
    return;
  }

  const isGroupChat =
    event.source.type === "group" || event.source.type === "room";

  const rawText = event.message!.text.trim();

  // Known commands that buttons send directly (no @mention needed)
  const directCommands = ["報名", "隊伍", "分數", "排行", "排行榜", "規則", "help", "指令"];
  const isDirectCommand = directCommands.includes(rawText);

  // In group chats: respond if @mentioned OR if it's a known direct command (from button tap)
  if (isGroupChat && !isDirectCommand) {
    const isMentioned = isBotMentioned(event.message);
    if (!isMentioned) return; // Ignore — no cost, no reply
  }

  // Extract the actual command (strip the @mention part)
  const commandText = extractCommand(rawText, isGroupChat);
  const reply = await getCommandReply(commandText);

  try {
    if (reply) {
      const title = extractTitle(commandText);
      await replyMessage(event.replyToken, [dataCard(title, reply)]);
    } else {
      await replyMessage(event.replyToken, [menuCard()]);
    }
  } catch (err) {
    // If Flex Message fails, fall back to simple text reply
    const errMsg = err instanceof Error ? err.message : "";
    console.error("Flex reply failed, trying text fallback:", errMsg);

    if (!errMsg.includes("Invalid reply token")) {
      try {
        const fallbackText = reply || "🎰 汗水賭場\n\n輸入：報名、隊伍、排行、規則";
        await replyMessage(event.replyToken, [{ type: "text", text: fallbackText }]);
      } catch {
        // Reply token already used or expired — ignore
      }
    }
  }
}

/**
 * Check if the bot is @mentioned in the message.
 * Works by checking the mention.mentionees array for the bot's userId,
 * or by detecting @RunRun in the text as a fallback.
 */
function isBotMentioned(
  message?: LineEvent["message"]
): boolean {
  if (!message) return false;

  // Method 1: Check mentionees for bot's user ID
  if (message.mention?.mentionees) {
    for (const m of message.mention.mentionees) {
      // If we know the bot's user ID, match exactly
      if (BOT_USER_ID && m.userId === BOT_USER_ID) return true;
      // Otherwise, any "all" type mention or matched mention counts
      if (m.type === "all") return true;
    }
    // If there are mentionees but we don't know bot ID,
    // assume any mention in a message is for us
    if (!BOT_USER_ID && message.mention.mentionees.length > 0) return true;
  }

  // Method 2: Fallback — check text for @RunRun or @runrun
  const text = message.text?.toLowerCase() || "";
  if (text.includes("@runrun")) return true;

  return false;
}

/**
 * Extract the command part from a message, stripping the @mention.
 * e.g. "@RunRun 報名" → "報名"
 */
function extractCommand(text: string, isGroup: boolean): string {
  if (!isGroup) return text.trim();

  // Remove @mentions (format: @DisplayName)
  let cleaned = text.replace(/@\S+/g, "").trim();

  // Also try removing common bot name patterns
  cleaned = cleaned
    .replace(/^runrun\s*/i, "")
    .trim();

  return cleaned;
}

async function getCommandReply(text: string): Promise<string | null> {
  const cmd = text.toLowerCase().replace(/^!/, "").trim();

  if (cmd === "help" || cmd === "指令" || cmd === "?" || cmd === "？") {
    return [
      "🎰 汗水賭場 Bot",
      "",
      "在群組裡 @我 + 指令：",
      "  報名 — 查看報名人數",
      "  隊伍 — 查看隊伍分數",
      "  排行 — 跑步排行榜 Top 5",
      "  規則 — 遊戲規則連結",
      "  help — 顯示此說明",
    ].join("\n");
  }

  if (cmd === "報名" || cmd === "報名人數" || cmd === "人數") {
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

  if (cmd === "隊伍" || cmd === "分數" || cmd === "隊伍分數" || cmd === "pk") {
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

        const totalKm =
          activities?.reduce((sum, a) => sum + a.distance_km, 0) ?? 0;
        result += `\n${team.emoji} ${team.name}（${memberCount}人）\n   📏 ${totalKm.toFixed(1)} km`;
      } else {
        result += `\n${team.emoji} ${team.name}（0人）\n   📏 0 km`;
      }
    }

    return result;
  }

  if (cmd === "排行" || cmd === "排行榜" || cmd === "top" || cmd === "rank") {
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

  if (cmd === "規則" || cmd === "遊戲規則" || cmd === "rules") {
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

  // Command not recognized
  return null;
}

/** Map command text to a display title for the Flex card header */
function extractTitle(cmd: string): string {
  const c = cmd.toLowerCase().replace(/^!/, "").trim();
  if (c.includes("報名")) return "📊 報名人數";
  if (c.includes("隊伍") || c.includes("分數")) return "⚔️ 隊伍對戰";
  if (c.includes("排行")) return "🏆 排行榜";
  if (c.includes("規則")) return "📖 遊戲規則";
  if (c.includes("help") || c.includes("指令")) return "🎰 指令列表";
  return "🎰 汗水賭場";
}

/**
 * Save a LINE group ID to the database for future push notifications.
 */
async function saveGroupId(groupId: string) {
  console.log(`LINE Bot joined group: ${groupId}`);
  // TODO: persist group ID to database for push notifications
}
