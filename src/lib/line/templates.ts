/**
 * LINE Flex Message templates for the Sweat Casino bot.
 *
 * Flex Messages render as rich card UI visible to ALL group members,
 * unlike Quick Reply buttons which only show to the sender.
 */

/** Button card shown when bot is @mentioned or joins a group */
export function menuCard() {
  return {
    type: "flex" as const,
    altText: "🎰 汗水賭場 — 點選功能按鈕",
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
            text: "點選下方按鈕查詢資訊：",
            size: "sm",
            color: "#999999",
            margin: "none",
          },
        ],
        paddingAll: "12px",
        paddingBottom: "4px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              makeButton("📊 報名人數", "@RunRun 報名"),
              makeButton("⚔️ 隊伍分數", "@RunRun 隊伍"),
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              makeButton("🏆 排行榜", "@RunRun 排行"),
              makeButton("📖 遊戲規則", "@RunRun 規則"),
            ],
          },
          {
            type: "button",
            action: {
              type: "uri",
              label: "📱 開啟網站",
              uri: "https://runrun-plum.vercel.app",
            },
            style: "primary",
            color: "#0ea5e9",
            height: "sm",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
}

/** Response card with data + buttons for follow-up */
export function dataCard(title: string, body: string) {
  return {
    type: "flex" as const,
    altText: `${title}\n${body}`,
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
            text: body,
            size: "sm",
            color: "#333333",
            wrap: true,
            whiteSpace: "pre-wrap",
          },
        ],
        paddingAll: "16px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          makeButton("📊 報名", "@RunRun 報名"),
          makeButton("⚔️ 隊伍", "@RunRun 隊伍"),
          makeButton("🏆 排行", "@RunRun 排行"),
        ],
        paddingAll: "12px",
      },
    },
  };
}

function makeButton(label: string, text: string) {
  return {
    type: "button",
    action: {
      type: "message",
      label,
      text,
    },
    style: "secondary",
    height: "sm",
    flex: 1,
  };
}
