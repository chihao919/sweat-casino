/**
 * LINE Flex Message templates for the Sweat Casino bot.
 *
 * Flex Messages render as rich card UI visible to ALL group members.
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
          {
            type: "text",
            text: "點選按鈕查詢資訊",
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
          makeButton("📊  查看報名人數", "報名"),
          makeButton("⚔️  查看隊伍分數", "隊伍"),
          makeButton("🏆  查看排行榜", "排行"),
          makeButton("📖  查看遊戲規則", "規則"),
          {
            type: "button",
            action: {
              type: "uri",
              label: "📱  開啟網站",
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
          makeButton("📊 報名", "報名"),
          makeButton("⚔️ 隊伍", "隊伍"),
          makeButton("🏆 排行", "排行"),
        ],
        paddingAll: "12px",
      },
    },
  };
}

function makeButton(label: string, text: string) {
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
