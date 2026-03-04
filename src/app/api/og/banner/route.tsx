import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * GET /api/og/banner
 *
 * Generates a wide banner image for LINE Bot background, social sharing, etc.
 * Default: 1080x560
 *
 * Query params:
 *   ?w=1080&h=560 (optional)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const w = Number(searchParams.get("w") || "1080");
  const h = Number(searchParams.get("h") || "560");

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
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0505 40%, #0a0a0a 70%, #050a1a 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Red glow top-left */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            left: "-10%",
            width: "60%",
            height: "80%",
            background: "radial-gradient(ellipse, rgba(220,38,38,0.25) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Gold glow bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-5%",
            width: "50%",
            height: "70%",
            background: "radial-gradient(ellipse, rgba(234,179,8,0.15) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: h * 0.02,
          }}
        >
          {/* Emoji */}
          <div style={{ fontSize: h * 0.22, display: "flex" }}>🎰</div>

          {/* Title */}
          <div
            style={{
              fontSize: h * 0.18,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            汗水賭場
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: h * 0.065,
              color: "#f87171",
              fontWeight: 700,
              display: "flex",
            }}
          >
            用汗水下注，讓跑步變成一場賭局
          </div>

          {/* URL */}
          <div
            style={{
              fontSize: h * 0.045,
              color: "#71717a",
              marginTop: h * 0.03,
              display: "flex",
            }}
          >
            runrun-plum.vercel.app
          </div>
        </div>

        {/* Decorative chips */}
        <div
          style={{
            position: "absolute",
            top: "12%",
            left: "8%",
            fontSize: h * 0.1,
            opacity: 0.3,
            display: "flex",
          }}
        >
          🏃
        </div>
        <div
          style={{
            position: "absolute",
            top: "15%",
            right: "10%",
            fontSize: h * 0.1,
            opacity: 0.3,
            display: "flex",
          }}
        >
          💰
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            left: "12%",
            fontSize: h * 0.1,
            opacity: 0.3,
            display: "flex",
          }}
        >
          🎲
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "8%",
            fontSize: h * 0.1,
            opacity: 0.3,
            display: "flex",
          }}
        >
          🔥
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: "4px",
            background: "linear-gradient(90deg, transparent 10%, #dc2626 50%, transparent 90%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { width: w, height: h }
  );
}
