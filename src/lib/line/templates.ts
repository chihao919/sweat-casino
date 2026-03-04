/**
 * LINE Flex Message templates for the Sweat Casino bot.
 *
 * Flex Messages render as rich card UI visible to ALL group members.
 */

const APP_URL = "https://runrun-plum.vercel.app";

function makeUriButton(label: string, uri: string, color?: string) {
  return {
    type: "button" as const,
    action: {
      type: "uri" as const,
      label,
      uri,
    },
    style: "primary" as const,
    color: color || "#0ea5e9",
    height: "sm" as const,
  };
}

function makeTextButton(label: string, text: string) {
  return {
    type: "button" as const,
    action: {
      type: "message" as const,
      label,
      text,
    },
    style: "secondary" as const,
    height: "sm" as const,
  };
}

/** Button card shown when bot is @mentioned or joins a group */
export function menuCard() {
  return {
    type: "flex" as const,
    altText: "🎰 汗水賭場 — 點選按鈕",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🎰 汗水賭場",
            weight: "bold",
            size: "lg",
            color: "#ffffff",
          },
          {
            type: "text",
            text: "用汗水下注，讓跑步變成一場賭局",
            size: "xs",
            color: "#ffcccc",
          },
        ],
        backgroundColor: "#dc2626",
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          makeUriButton("🎰  立即加入", `${APP_URL}/login`, "#dc2626"),
          makeUriButton("⌚  如何設定", `${APP_URL}/setup`, "#0ea5e9"),
          makeUriButton("📣  邀請朋友（宣傳頁）", `${APP_URL}/invite`, "#16a34a"),
        ],
        paddingAll: "12px",
      },
    },
  };
}

/** Response card with data + buttons for follow-up */
export function dataCard(title: string, bodyText: string) {
  return {
    type: "flex" as const,
    altText: `${title}\n${bodyText}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "lg",
            color: "#ffffff",
          },
        ],
        backgroundColor: "#dc2626",
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: bodyText,
            size: "sm",
            color: "#333333",
            wrap: true,
          },
        ],
        paddingAll: "16px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          makeUriButton("🎰 加入", `${APP_URL}/login`, "#dc2626"),
          makeUriButton("⌚ 設定教學", `${APP_URL}/setup`, "#0ea5e9"),
          makeUriButton("📣 宣傳頁", `${APP_URL}/invite`, "#16a34a"),
        ],
        paddingAll: "12px",
      },
    },
  };
}
