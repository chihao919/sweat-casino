import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * GET /api/og/logo
 *
 * Generates a 512x512 PNG logo for the Sweat Casino app.
 * Used as LINE Bot avatar, PWA icon, social media preview, etc.
 *
 * Query params:
 *   ?size=240  (optional, default 512)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Number(searchParams.get("size") || "512");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 50%, #1a0505 100%)",
          borderRadius: size > 256 ? "64px" : "32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Red glow background */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "10%",
            width: "80%",
            height: "60%",
            background: "radial-gradient(ellipse, rgba(220,38,38,0.3) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Slot machine emoji */}
        <div
          style={{
            fontSize: size * 0.35,
            display: "flex",
          }}
        >
          🎰
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: size * 0.14,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-0.02em",
            marginTop: size * 0.02,
            display: "flex",
          }}
        >
          汗水賭場
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: size * 0.055,
            color: "#a1a1aa",
            marginTop: size * 0.015,
            display: "flex",
          }}
        >
          SWEAT CASINO
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            width: "40%",
            height: "3px",
            background: "linear-gradient(90deg, transparent, #dc2626, transparent)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
