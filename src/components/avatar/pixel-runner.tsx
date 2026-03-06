"use client";

/**
 * Pixel art runner avatar - SVG-based character with skin system.
 * Each skin changes colors, accessories, and effects.
 */

interface PixelRunnerProps {
  skinColors?: {
    primary: string;
    accent?: string;
    effect?: string;
    aura?: string;
  };
  size?: number;
  className?: string;
  animate?: boolean;
}

export function PixelRunner({
  skinColors = { primary: "#6B7280" },
  size = 120,
  className = "",
  animate = false,
}: PixelRunnerProps) {
  const { primary, accent, effect, aura } = skinColors;
  const skin = accent || primary;
  const px = size / 16; // pixel unit

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Aura glow effect */}
      {aura && (
        <div
          className={`absolute inset-0 rounded-full blur-xl opacity-40 ${
            animate ? "animate-pulse" : ""
          }`}
          style={{
            background:
              aura === "fire"
                ? `radial-gradient(circle, #F59E0B44, #EF444422, transparent)`
                : aura === "dark"
                ? `radial-gradient(circle, #A855F744, #18181B22, transparent)`
                : aura === "golden"
                ? `radial-gradient(circle, #FDE68A66, #FBBF2433, transparent)`
                : `radial-gradient(circle, ${primary}44, transparent)`,
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        className={animate ? "animate-bounce-slow" : ""}
        style={{ imageRendering: "pixelated" }}
      >
        {/* Head */}
        <rect x="6" y="1" width="4" height="4" rx="0.5" fill="#FBBF24" />
        {/* Eyes */}
        <rect x="7" y="2" width="1" height="1" fill="#18181B" />
        <rect x="9" y="2" width="1" height="1" fill="#18181B" />
        {/* Smile */}
        <rect x="7.5" y="3.5" width="2" height="0.5" rx="0.25" fill="#92400E" />

        {/* Hair / headband */}
        <rect x="6" y="0.5" width="4" height="1" rx="0.3" fill={primary} />

        {/* Body / shirt */}
        <rect x="5" y="5" width="6" height="4" rx="0.5" fill={primary} />
        {/* Shirt accent stripe */}
        {accent && (
          <rect x="5" y="6.5" width="6" height="1" fill={accent} opacity="0.8" />
        )}
        {/* Number on shirt */}
        <rect x="7.5" y="5.5" width="1" height="2" fill={skin} opacity="0.3" />

        {/* Arms */}
        <rect x="3.5" y="5.5" width="1.5" height="3" rx="0.5" fill="#FBBF24" />
        <rect x="11" y="5.5" width="1.5" height="3" rx="0.5" fill="#FBBF24" />

        {/* Shorts */}
        <rect x="5.5" y="9" width="5" height="2" rx="0.3" fill={accent || "#374151"} />

        {/* Legs */}
        <rect x="6" y="11" width="1.5" height="3" rx="0.3" fill="#FBBF24" />
        <rect x="9" y="11" width="1.5" height="3" rx="0.3" fill="#FBBF24" />

        {/* Shoes */}
        <rect x="5.5" y="14" width="2.5" height="1.5" rx="0.5" fill={accent || "#EF4444"} />
        <rect x="8.5" y="14" width="2.5" height="1.5" rx="0.5" fill={accent || "#EF4444"} />

        {/* Effect particles */}
        {effect === "lightning" && (
          <>
            <polygon points="3,2 4,4 3.5,4 4.5,6" fill="#FDE047" opacity="0.8" />
            <polygon points="12,3 13,5 12.5,5 13.5,7" fill="#FDE047" opacity="0.6" />
          </>
        )}
        {effect === "fire" && (
          <>
            <ellipse cx="4" cy="13" rx="1" ry="1.5" fill="#FB923C" opacity="0.6" />
            <ellipse cx="12" cy="12" rx="0.8" ry="1.2" fill="#EF4444" opacity="0.5" />
            <ellipse cx="3" cy="11" rx="0.6" ry="1" fill="#FDE047" opacity="0.4" />
          </>
        )}
        {effect === "frost" && (
          <>
            <circle cx="3" cy="4" r="0.5" fill="#E0F2FE" opacity="0.7" />
            <circle cx="13" cy="6" r="0.4" fill="#BAE6FD" opacity="0.6" />
            <circle cx="2" cy="9" r="0.3" fill="#E0F2FE" opacity="0.5" />
            <circle cx="14" cy="3" r="0.35" fill="#BAE6FD" opacity="0.5" />
          </>
        )}
        {effect === "wings" && (
          <>
            <path d="M3,5 Q1,3 2,1 Q4,3 5,5" fill="#F59E0B" opacity="0.6" />
            <path d="M13,5 Q15,3 14,1 Q12,3 11,5" fill="#F59E0B" opacity="0.6" />
          </>
        )}
        {effect === "smoke" && (
          <>
            <circle cx="3" cy="8" r="1" fill="#A855F7" opacity="0.2" />
            <circle cx="13" cy="7" r="1.2" fill="#A855F7" opacity="0.15" />
            <circle cx="2" cy="12" r="0.8" fill="#6B21A8" opacity="0.1" />
          </>
        )}
        {effect === "divine" && (
          <>
            {/* Crown */}
            <polygon points="6,0 7,1 8,0 9,1 10,0 10,1.5 6,1.5" fill="#FBBF24" />
            {/* Sparkles */}
            <circle cx="2" cy="3" r="0.4" fill="#FDE68A" opacity="0.8" />
            <circle cx="14" cy="5" r="0.3" fill="#FDE68A" opacity="0.7" />
            <circle cx="1" cy="10" r="0.35" fill="#FBBF24" opacity="0.6" />
          </>
        )}
      </svg>
    </div>
  );
}
