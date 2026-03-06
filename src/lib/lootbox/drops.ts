/**
 * Loot box drop logic - determines what drops after each run.
 *
 * Drop rates:
 *   70% - SC reward (5-30 SC)
 *   20% - Common/Rare item
 *    8% - Epic item or skin
 *    2% - Legendary drop
 *
 * Distance bonus: longer runs have better drop chances.
 */

import type { Rarity } from "./items";

export interface LootDrop {
  type: "sc" | "item" | "skin";
  rarity: Rarity;
  /** SC amount (if type === "sc") */
  scAmount?: number;
  /** Item slug (if type === "item") */
  itemSlug?: string;
  /** Skin slug (if type === "skin") */
  skinSlug?: string;
}

interface DropTableEntry {
  weight: number;
  rarity: Rarity;
  type: "sc" | "item" | "skin";
  pool?: string[];
  scRange?: [number, number];
}

const BASE_DROP_TABLE: DropTableEntry[] = [
  // SC drops (70%)
  { weight: 40, rarity: "common", type: "sc", scRange: [5, 15] },
  { weight: 30, rarity: "common", type: "sc", scRange: [15, 30] },
  // Item drops (20%)
  { weight: 10, rarity: "common", type: "item", pool: ["tax-shield", "odds-boost"] },
  { weight: 10, rarity: "rare", type: "item", pool: ["double-sc", "streak-saver"] },
  // Epic (8%)
  { weight: 5, rarity: "epic", type: "item", pool: ["lucky-charm"] },
  { weight: 3, rarity: "epic", type: "skin", pool: ["thunder-warrior", "flame-sprinter", "ice-phantom"] },
  // Legendary (2%)
  { weight: 1, rarity: "legendary", type: "skin", pool: ["phoenix-rising", "shadow-assassin"] },
  { weight: 1, rarity: "legendary", type: "item", pool: ["team-transfer"] },
];

/**
 * Apply distance-based luck modifier.
 * Longer runs shift weight from common SC → rarer drops.
 */
function getDropTable(distanceKm: number, hasLuckyCharm: boolean): DropTableEntry[] {
  const table = BASE_DROP_TABLE.map((entry) => ({ ...entry }));

  // Bonus luck from distance (each km above 5 adds 0.5% to rare+)
  const distanceBonus = Math.max(0, (distanceKm - 5) * 0.5);
  // Lucky charm doubles rare+ chances
  const luckMultiplier = hasLuckyCharm ? 2 : 1;

  for (const entry of table) {
    if (entry.rarity !== "common") {
      entry.weight = entry.weight * luckMultiplier + distanceBonus * (entry.rarity === "legendary" ? 0.1 : 0.3);
    }
  }

  return table;
}

/** Roll a single loot drop */
export function rollLootDrop(
  distanceKm: number,
  hasLuckyCharm = false
): LootDrop {
  const table = getDropTable(distanceKm, hasLuckyCharm);
  const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) {
      const drop: LootDrop = {
        type: entry.type,
        rarity: entry.rarity,
      };

      if (entry.type === "sc" && entry.scRange) {
        const [min, max] = entry.scRange;
        drop.scAmount = Math.round(min + Math.random() * (max - min));
      } else if (entry.pool && entry.pool.length > 0) {
        const picked = entry.pool[Math.floor(Math.random() * entry.pool.length)];
        if (entry.type === "item") drop.itemSlug = picked;
        else drop.skinSlug = picked;
      }

      return drop;
    }
  }

  // Fallback: small SC
  return { type: "sc", rarity: "common", scAmount: 5 };
}
