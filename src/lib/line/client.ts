const LINE_API_BASE = "https://api.line.me/v2/bot";

function getAccessToken(): string {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN environment variable");
  }
  return token;
}

interface QuickReplyItem {
  type: "action";
  action: {
    type: "message" | "uri";
    label: string;
    text?: string;
    uri?: string;
  };
}

export interface LineMessage {
  type: "text" | "flex" | "image";
  text?: string;
  altText?: string;
  contents?: Record<string, unknown>;
  originalContentUrl?: string;
  previewImageUrl?: string;
  quickReply?: {
    items: QuickReplyItem[];
  };
}

/** Standard quick reply buttons appended to every bot response */
export const QUICK_REPLY_BUTTONS: QuickReplyItem[] = [
  {
    type: "action",
    action: { type: "message", label: "📊 報名人數", text: "@RunRun 報名" },
  },
  {
    type: "action",
    action: { type: "message", label: "⚔️ 隊伍分數", text: "@RunRun 隊伍" },
  },
  {
    type: "action",
    action: { type: "message", label: "🏆 排行榜", text: "@RunRun 排行" },
  },
  {
    type: "action",
    action: { type: "message", label: "📖 規則", text: "@RunRun 規則" },
  },
  {
    type: "action",
    action: {
      type: "uri",
      label: "📱 開啟網站",
      uri: "https://runrun-plum.vercel.app",
    },
  },
];

/**
 * Push a message to a specific user or group.
 */
export async function pushMessage(
  to: string,
  messages: LineMessage[]
): Promise<void> {
  const res = await fetch(`${LINE_API_BASE}/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ to, messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE push message failed: ${res.status} ${body}`);
  }
}

/**
 * Reply to a webhook event.
 */
export async function replyMessage(
  replyToken: string,
  messages: LineMessage[]
): Promise<void> {
  const res = await fetch(`${LINE_API_BASE}/message/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE reply message failed: ${res.status} ${body}`);
  }
}

/**
 * Broadcast a message to all followers.
 */
export async function broadcastMessage(
  messages: LineMessage[]
): Promise<void> {
  const res = await fetch(`${LINE_API_BASE}/message/broadcast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE broadcast failed: ${res.status} ${body}`);
  }
}

/**
 * Get the group summary info.
 */
export async function getGroupSummary(
  groupId: string
): Promise<{ groupId: string; groupName: string; pictureUrl?: string }> {
  const res = await fetch(`${LINE_API_BASE}/group/${groupId}/summary`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE get group summary failed: ${res.status} ${body}`);
  }

  return res.json();
}
