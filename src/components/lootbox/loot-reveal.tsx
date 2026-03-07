"use client";

import { useState, useEffect } from "react";
import { PixelRunner } from "@/components/avatar/pixel-runner";
import { RARITY_CONFIG, getSkinBySlug, getItemBySlug } from "@/lib/lootbox/items";
import type { LootDrop } from "@/lib/lootbox/drops";
import { cn } from "@/lib/utils";

interface LootRevealProps {
  drop: LootDrop;
  onClose: () => void;
}

export function LootReveal({ drop, onClose }: LootRevealProps) {
  const [phase, setPhase] = useState<"opening" | "revealed">("opening");
  const rarityConf = RARITY_CONFIG[drop.rarity];

  useEffect(() => {
    const timer = setTimeout(() => setPhase("revealed"), 1200);
    return () => clearTimeout(timer);
  }, []);

  const skin = drop.skinSlug ? getSkinBySlug(drop.skinSlug) : null;
  const item = drop.itemSlug ? getItemBySlug(drop.itemSlug) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={cn(
          "relative flex flex-col items-center gap-4 rounded-2xl border p-8 transition-all duration-500",
          phase === "opening" ? "scale-75 opacity-0" : "scale-100 opacity-100",
          rarityConf.bgColor,
          rarityConf.borderColor
        )}
      >
        {/* Glow background */}
        <div
          className="absolute inset-0 rounded-2xl opacity-20 blur-2xl"
          style={{
            background: `radial-gradient(circle, ${
              drop.rarity === "legendary" ? "#F59E0B" :
              drop.rarity === "epic" ? "#A855F7" :
              drop.rarity === "rare" ? "#3B82F6" : "#6B7280"
            }, transparent)`,
          }}
        />

        {/* Rarity */}
        <span
          className={cn(
            "relative text-xs font-bold uppercase tracking-widest",
            rarityConf.color
          )}
        >
          {rarityConf.labelCn} {rarityConf.label}
        </span>

        {/* Content */}
        <div className="relative flex flex-col items-center gap-3">
          {drop.type === "sc" && (
            <>
              <span className="text-5xl">💰</span>
              <p className="text-2xl font-black text-green-400">
                +{drop.scAmount} $SC
              </p>
            </>
          )}
          {drop.type === "skin" && skin && (
            <>
              <PixelRunner skinSlug={skin.slug} size={120} animate />
              <p className="text-lg font-black text-neutral-100">{skin.nameCn}</p>
              <p className="text-xs text-neutral-400">{skin.name}</p>
              <p className="text-[11px] text-neutral-500 text-center max-w-[200px]">
                {skin.description}
              </p>
            </>
          )}
          {drop.type === "item" && item && (
            <>
              <span className="text-5xl">{item.icon}</span>
              <p className="text-lg font-black text-neutral-100">{item.nameCn}</p>
              <p className="text-xs text-neutral-400">{item.name}</p>
              <p className="text-[11px] text-neutral-500 text-center max-w-[200px]">
                {item.description}
              </p>
            </>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="relative mt-2 rounded-lg bg-neutral-700 px-6 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-600 transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
