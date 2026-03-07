"use client";

import Image from "next/image";

/**
 * Runner avatar component - displays character skin as image.
 * Falls back to skin slug mapping to /skins/[slug].png
 */

interface PixelRunnerProps {
  skinSlug?: string;
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

const SKIN_IMAGES: Record<string, string> = {
  "basic-runner": "/skins/basic-runner.png",
  "morning-jogger": "/skins/morning-jogger.png",
  "night-runner": "/skins/night-runner.png",
  "storm-chaser": "/skins/storm-chaser.png",
  "trail-blazer": "/skins/trail-blazer.png",
  "thunder-warrior": "/skins/thunder-warrior.png",
  "flame-sprinter": "/skins/flame-sprinter.png",
  "ice-phantom": "/skins/ice-phantom.png",
  "phoenix-rising": "/skins/phoenix-rising.png",
  "shadow-assassin": "/skins/shadow-assassin.png",
  "marathon-god": "/skins/marathon-god.png",
};

export function PixelRunner({
  skinSlug = "basic-runner",
  size = 120,
  className = "",
  animate = false,
}: PixelRunnerProps) {
  const src = SKIN_IMAGES[skinSlug] || SKIN_IMAGES["basic-runner"];

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-lg ${animate ? "animate-bounce-slow" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={skinSlug}
        width={size}
        height={size}
        className="object-contain"
        unoptimized
      />
    </div>
  );
}
