"use client";

/**
 * Chibi-style runner avatar - cute, big-head proportions (2:1 head-to-body ratio).
 * Big sparkly eyes, round face, small body = kawaii running character.
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
  const shoeColor = accent || "#EF4444";
  const shortsColor = accent ? `${accent}BB` : "#374151";
  const skinTone = "#FDDCB5";
  const skinShadow = "#F0C8A0";
  const cheekColor = "#FCA5A5";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Aura glow */}
      {aura && (
        <div
          className={`absolute inset-0 rounded-full blur-xl opacity-30 ${animate ? "animate-pulse" : ""}`}
          style={{
            background:
              aura === "fire" ? `radial-gradient(circle, #F59E0B55, #EF444433, transparent)`
              : aura === "dark" ? `radial-gradient(circle, #A855F755, #18181B33, transparent)`
              : aura === "golden" ? `radial-gradient(circle, #FDE68A77, #FBBF2444, transparent)`
              : `radial-gradient(circle, ${primary}44, transparent)`,
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 32 36"
        xmlns="http://www.w3.org/2000/svg"
        className={animate ? "animate-bounce-slow" : ""}
      >
        {/* === BIG ROUND HEAD (chibi = head is huge) === */}
        {/* Hair back */}
        <ellipse cx="16" cy="9" rx="9" ry="8.5" fill={primary} />

        {/* Face */}
        <ellipse cx="16" cy="10" rx="7.5" ry="7" fill={skinTone} />

        {/* Hair front / bangs */}
        <path d="M8.5,7 Q10,3 16,2.5 Q22,3 23.5,7 Q22,5 19,4.5 Q16,4 13,4.5 Q10,5 8.5,7Z" fill={primary} />
        {/* Side hair tufts */}
        <ellipse cx="9" cy="7" rx="2" ry="3" fill={primary} />
        <ellipse cx="23" cy="7" rx="2" ry="3" fill={primary} />

        {/* === HEADBAND === */}
        <rect x="8.5" y="6.5" width="15" height="1.8" rx="0.9" fill={accent || primary} opacity="0.85" />
        {/* Headband knot */}
        <circle cx="23.5" cy="7.4" r="1" fill={accent || primary} opacity="0.85" />
        <path d="M24.5,6.5 Q26,5 25.5,7.5" stroke={accent || primary} strokeWidth="0.8" fill="none" opacity="0.7" />

        {/* === BIG CUTE EYES === */}
        {/* Eye whites */}
        <ellipse cx="13" cy="10.5" rx="2.5" ry="2.8" fill="white" />
        <ellipse cx="19" cy="10.5" rx="2.5" ry="2.8" fill="white" />
        {/* Iris */}
        <ellipse cx="13.3" cy="10.8" rx="1.6" ry="1.8" fill="#4A3728" />
        <ellipse cx="19.3" cy="10.8" rx="1.6" ry="1.8" fill="#4A3728" />
        {/* Pupil */}
        <circle cx="13.5" cy="10.5" r="0.9" fill="#1E1209" />
        <circle cx="19.5" cy="10.5" r="0.9" fill="#1E1209" />
        {/* Eye sparkle (big) */}
        <circle cx="12.5" cy="9.8" r="0.7" fill="white" />
        <circle cx="18.5" cy="9.8" r="0.7" fill="white" />
        {/* Eye sparkle (small) */}
        <circle cx="14" cy="11.5" r="0.35" fill="white" opacity="0.8" />
        <circle cx="20" cy="11.5" r="0.35" fill="white" opacity="0.8" />

        {/* Eyebrows - cute arched */}
        <path d="M11,8 Q13,7 15,8" stroke="#8B6914" strokeWidth="0.5" fill="none" strokeLinecap="round" />
        <path d="M17,8 Q19,7 21,8" stroke="#8B6914" strokeWidth="0.5" fill="none" strokeLinecap="round" />

        {/* Cute little nose */}
        <ellipse cx="16" cy="12.5" rx="0.5" ry="0.3" fill={skinShadow} />

        {/* Happy smile */}
        <path d="M13.5,14 Q16,16 18.5,14" stroke="#C2410C" strokeWidth="0.6" fill="none" strokeLinecap="round" />
        {/* Smile teeth peek */}
        <path d="M15,14.8 Q16,15.3 17,14.8" fill="white" />

        {/* Blush cheeks */}
        <ellipse cx="10.5" cy="13" rx="1.5" ry="0.8" fill={cheekColor} opacity="0.35" />
        <ellipse cx="21.5" cy="13" rx="1.5" ry="0.8" fill={cheekColor} opacity="0.35" />

        {/* Ears */}
        <ellipse cx="8.5" cy="10.5" rx="1" ry="1.3" fill={skinTone} />
        <ellipse cx="8.5" cy="10.5" rx="0.5" ry="0.8" fill={skinShadow} />
        <ellipse cx="23.5" cy="10.5" rx="1" ry="1.3" fill={skinTone} />
        <ellipse cx="23.5" cy="10.5" rx="0.5" ry="0.8" fill={skinShadow} />

        {/* === SMALL CUTE BODY === */}
        {/* Neck */}
        <rect x="14.5" y="16.5" width="3" height="1.5" fill={skinTone} />

        {/* Shirt body */}
        <path d="M11,18 Q10.5,18 10.5,18.5 L10.5,24 Q10.5,24.5 11,24.5 L21,24.5 Q21.5,24.5 21.5,24 L21.5,18.5 Q21.5,18 21,18Z" fill={primary} />
        {/* Shirt collar V */}
        <path d="M14,18 L16,19.5 L18,18" stroke="white" strokeWidth="0.4" fill="none" opacity="0.4" />
        {/* Stripe */}
        {accent && (
          <rect x="10.8" y="21" width="10.4" height="1.2" rx="0.3" fill={accent} opacity="0.6" />
        )}

        {/* Arms - cute stubby running arms */}
        {/* Left arm forward */}
        <path d="M10.5,19 Q8,18 7,20" stroke={skinTone} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="6.8" cy="20.3" r="1" fill={skinTone} />
        {/* Right arm back */}
        <path d="M21.5,19 Q23.5,20 24,22" stroke={skinTone} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="24.2" cy="22.2" r="1" fill={skinTone} />

        {/* === SHORTS === */}
        <rect x="11" y="24" width="10" height="3" rx="1" fill={shortsColor} />

        {/* === LEGS (running stride) === */}
        {/* Left leg forward */}
        <path d="M13.5,27 Q11.5,29 10,31.5" stroke={skinTone} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Right leg back */}
        <path d="M18.5,27 Q20.5,29 22,31" stroke={skinTone} strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* === CUTE ROUND SHOES === */}
        <ellipse cx="9.5" cy="32.5" rx="2.2" ry="1.5" fill={shoeColor} />
        <ellipse cx="9.5" cy="32" rx="1.5" ry="0.5" fill="white" opacity="0.3" />
        <ellipse cx="22.5" cy="32" rx="2.2" ry="1.5" fill={shoeColor} />
        <ellipse cx="22.5" cy="31.5" rx="1.5" ry="0.5" fill="white" opacity="0.3" />

        {/* === MOTION LINES === */}
        <line x1="26" y1="20" x2="29" y2="20" stroke="#9CA3AF" strokeWidth="0.4" opacity="0.3" strokeLinecap="round" />
        <line x1="27" y1="22" x2="30" y2="22" stroke="#9CA3AF" strokeWidth="0.4" opacity="0.25" strokeLinecap="round" />
        <line x1="26" y1="24" x2="28.5" y2="24" stroke="#9CA3AF" strokeWidth="0.4" opacity="0.2" strokeLinecap="round" />

        {/* === EFFECTS === */}
        {effect === "lightning" && (
          <>
            <path d="M3,4 L5,8 L3.5,8 L5.5,12" stroke="#FDE047" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M27,5 L29,9 L27.5,9 L29.5,13" stroke="#FDE047" strokeWidth="0.6" fill="none" opacity="0.7" strokeLinecap="round" />
            <circle cx="4" cy="2" r="0.5" fill="#FDE047" opacity="0.6" />
            <circle cx="28" cy="3" r="0.4" fill="#FDE047" opacity="0.5" />
          </>
        )}
        {effect === "fire" && (
          <>
            <ellipse cx="8" cy="31" rx="2" ry="3" fill="#FB923C" opacity="0.4">
              {animate && <animate attributeName="ry" values="3;3.8;3" dur="0.5s" repeatCount="indefinite" />}
            </ellipse>
            <ellipse cx="24" cy="30" rx="1.5" ry="2.5" fill="#EF4444" opacity="0.35">
              {animate && <animate attributeName="ry" values="2.5;3.2;2.5" dur="0.4s" repeatCount="indefinite" />}
            </ellipse>
            <ellipse cx="6" cy="28" rx="1" ry="1.8" fill="#FDE047" opacity="0.25" />
          </>
        )}
        {effect === "frost" && (
          <>
            {[
              { cx: 3, cy: 6, r: 0.7 }, { cx: 29, cy: 10, r: 0.6 },
              { cx: 2, cy: 18, r: 0.5 }, { cx: 30, cy: 5, r: 0.55 },
              { cx: 4, cy: 26, r: 0.45 }, { cx: 28, cy: 24, r: 0.6 },
            ].map((s, i) => (
              <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={i % 2 === 0 ? "#E0F2FE" : "#BAE6FD"} opacity={0.4 + i * 0.05}>
                {animate && <animate attributeName="opacity" values="0.2;0.6;0.2" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />}
              </circle>
            ))}
          </>
        )}
        {effect === "wings" && (
          <>
            <path d="M10,18 Q5,14 3,6 Q5,5 7,9 Q8,12 10,16Z" fill="#F59E0B" opacity="0.45" />
            <path d="M10,18 Q6,16 2,10 Q4,9 6,12 Q8,14 10,17Z" fill="#FBBF24" opacity="0.35" />
            <path d="M22,18 Q27,14 29,6 Q27,5 25,9 Q24,12 22,16Z" fill="#F59E0B" opacity="0.45" />
            <path d="M22,18 Q26,16 30,10 Q28,9 26,12 Q24,14 22,17Z" fill="#FBBF24" opacity="0.35" />
          </>
        )}
        {effect === "smoke" && (
          <>
            {[
              { cx: 3, cy: 14, r: 2.5 }, { cx: 29, cy: 12, r: 2.8 },
              { cx: 2, cy: 24, r: 2 }, { cx: 30, cy: 26, r: 2.2 },
            ].map((s, i) => (
              <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#A855F7" opacity={0.06 + i * 0.02}>
                {animate && <animate attributeName="r" values={`${s.r};${s.r + 0.8};${s.r}`} dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />}
              </circle>
            ))}
          </>
        )}
        {effect === "divine" && (
          <>
            {/* Golden Crown */}
            <path d="M10,2.5 L12,5 L14,3 L16,5.5 L18,3 L20,5 L22,2.5 L22,6 L10,6Z" fill="#FBBF24" />
            <circle cx="16" cy="3.5" r="0.8" fill="#FDE68A" />
            <circle cx="13" cy="4" r="0.5" fill="#FDE68A" opacity="0.7" />
            <circle cx="19" cy="4" r="0.5" fill="#FDE68A" opacity="0.7" />
            {/* Sparkles */}
            {[
              { cx: 2, cy: 6 }, { cx: 30, cy: 8 }, { cx: 1, cy: 20 },
              { cx: 31, cy: 18 }, { cx: 3, cy: 30 }, { cx: 29, cy: 28 },
            ].map((s, i) => (
              <g key={i}>
                <line x1={s.cx - 0.8} y1={s.cy} x2={s.cx + 0.8} y2={s.cy} stroke="#FDE68A" strokeWidth="0.4" opacity={0.4 + i * 0.05} />
                <line x1={s.cx} y1={s.cy - 0.8} x2={s.cx} y2={s.cy + 0.8} stroke="#FDE68A" strokeWidth="0.4" opacity={0.4 + i * 0.05} />
                {animate && (
                  <circle cx={s.cx} cy={s.cy} r="0.4" fill="#FBBF24" opacity="0.3">
                    <animate attributeName="opacity" values="0.1;0.5;0.1" dur={`${1 + i * 0.3}s`} repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}
