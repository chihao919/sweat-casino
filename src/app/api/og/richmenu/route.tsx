import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * GET /api/og/richmenu
 *
 * Generates the Rich Menu background image for LINE Bot.
 * Size: 2500x843 (half-size rich menu)
 *
 * Layout (3 top + 2 bottom):
 * ┌──────────┬──────────┬──────────┐
 * │   報名   │   隊伍   │   排行   │
 * ├────────────────┬────────────────┤
 * │     規則       │     網站       │
 * └────────────────┴────────────────┘
 */
export async function GET() {
  const w = 2500;
  const h = 843;
  const topH = h / 2;
  const colW = w / 3;
  const botColW = w / 2;

  const topButtons = [
    { emoji: "📊", label: "報名人數", color: "#dc2626" },
    { emoji: "⚔️", label: "隊伍分數", color: "#f59e0b" },
    { emoji: "🏆", label: "排行榜", color: "#22c55e" },
  ];

  const bottomButtons = [
    { emoji: "📖", label: "遊戲規則", color: "#6366f1" },
    { emoji: "📱", label: "開啟網站", color: "#0ea5e9" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
        }}
      >
        {/* Top row: 3 buttons */}
        <div style={{ display: "flex", flex: 1 }}>
          {topButtons.map((btn, i) => (
            <div
              key={i}
              style={{
                width: `${colW}px`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                borderRight: i < 2 ? "2px solid #1a1a1a" : "none",
                borderBottom: "2px solid #1a1a1a",
                background: `linear-gradient(180deg, ${btn.color}15 0%, ${btn.color}08 100%)`,
              }}
            >
              <div style={{ fontSize: 80, display: "flex" }}>{btn.emoji}</div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: "white",
                  display: "flex",
                }}
              >
                {btn.label}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row: 2 buttons */}
        <div style={{ display: "flex", flex: 1 }}>
          {bottomButtons.map((btn, i) => (
            <div
              key={i}
              style={{
                width: `${botColW}px`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                borderRight: i < 1 ? "2px solid #1a1a1a" : "none",
                background: `linear-gradient(180deg, ${btn.color}15 0%, ${btn.color}08 100%)`,
              }}
            >
              <div style={{ fontSize: 80, display: "flex" }}>{btn.emoji}</div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: "white",
                  display: "flex",
                }}
              >
                {btn.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: w, height: h }
  );
}
