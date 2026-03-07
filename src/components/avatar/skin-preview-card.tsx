"use client";

import { PixelRunner } from "./pixel-runner";
import { RARITY_CONFIG, type Rarity } from "@/lib/lootbox/items";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

interface SkinPreviewCardProps {
  name: string;
  nameCn: string;
  description: string;
  rarity: Rarity;
  priceSc: number;
  isPurchasable: boolean;
  isOwned: boolean;
  isEquipped: boolean;
  colors: {
    primary: string;
    accent?: string;
    effect?: string;
    aura?: string;
  };
  onBuy?: () => void;
  onEquip?: () => void;
  locked?: boolean;
  lockReason?: string;
}

export function SkinPreviewCard({
  name,
  nameCn,
  description,
  rarity,
  priceSc,
  isPurchasable,
  isOwned,
  isEquipped,
  colors,
  onBuy,
  onEquip,
  locked,
  lockReason,
}: SkinPreviewCardProps) {
  const rarityConf = RARITY_CONFIG[rarity];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
        rarityConf.bgColor,
        rarityConf.borderColor,
        isEquipped && "ring-2 ring-yellow-400/60",
        locked && "opacity-60"
      )}
    >
      {/* Rarity label */}
      <span className={cn("text-[10px] font-bold uppercase tracking-wider", rarityConf.color)}>
        {rarityConf.labelCn}
      </span>

      {/* Character preview */}
      <div className="relative">
        <PixelRunner skinColors={colors} size={80} animate={isEquipped} />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
            <Lock className="size-5 text-neutral-400" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="text-xs font-bold text-neutral-200">{nameCn}</p>
        <p className="text-[10px] text-neutral-500">{name}</p>
      </div>

      {/* Description */}
      <p className="text-[10px] text-neutral-500 text-center line-clamp-2">
        {description}
      </p>

      {/* Action button */}
      {isEquipped ? (
        <span className="text-[10px] font-bold text-yellow-400 uppercase">Equipped</span>
      ) : isOwned ? (
        <button
          onClick={onEquip}
          className="w-full rounded-md bg-neutral-700 px-3 py-1.5 text-[11px] font-semibold text-neutral-200 hover:bg-neutral-600 transition-colors"
        >
          Equip
        </button>
      ) : locked ? (
        <span className="text-[10px] text-neutral-500">{lockReason || "Locked"}</span>
      ) : isPurchasable ? (
        <button
          onClick={onBuy}
          className={cn(
            "w-full rounded-md px-3 py-1.5 text-[11px] font-bold transition-colors",
            rarity === "legendary"
              ? "bg-amber-600 text-white hover:bg-amber-500"
              : rarity === "epic"
              ? "bg-purple-600 text-white hover:bg-purple-500"
              : "bg-blue-600 text-white hover:bg-blue-500"
          )}
        >
          {priceSc} $SC
        </button>
      ) : (
        <span className="text-[10px] text-neutral-500">Not for sale</span>
      )}
    </div>
  );
}
