/**
 * Rank system - Calculate player rank from cumulative distance.
 * Ranks are purely based on total km run (white hat: accomplishment).
 */

export interface RankDefinition {
  id: string;
  name: string;
  nameCn: string;
  minKm: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  scReward: number;
}

export const RANKS: RankDefinition[] = [
  {
    id: "bronze",
    name: "Bronze",
    nameCn: "青銅",
    minKm: 0,
    color: "text-amber-600",
    bgColor: "bg-amber-900/30",
    borderColor: "border-amber-700",
    icon: "🥉",
    scReward: 0,
  },
  {
    id: "silver",
    name: "Silver",
    nameCn: "白銀",
    minKm: 50,
    color: "text-neutral-300",
    bgColor: "bg-neutral-700/30",
    borderColor: "border-neutral-500",
    icon: "🥈",
    scReward: 50,
  },
  {
    id: "gold",
    name: "Gold",
    nameCn: "黃金",
    minKm: 150,
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/30",
    borderColor: "border-yellow-600",
    icon: "🥇",
    scReward: 100,
  },
  {
    id: "diamond",
    name: "Diamond",
    nameCn: "鑽石",
    minKm: 400,
    color: "text-cyan-300",
    bgColor: "bg-cyan-900/30",
    borderColor: "border-cyan-600",
    icon: "💎",
    scReward: 200,
  },
  {
    id: "master",
    name: "Master",
    nameCn: "大師",
    minKm: 1000,
    color: "text-purple-300",
    bgColor: "bg-purple-900/30",
    borderColor: "border-purple-500",
    icon: "👑",
    scReward: 500,
  },
];

/** Get rank definition for a given total distance */
export function getRank(totalKm: number): RankDefinition {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (totalKm >= r.minKm) rank = r;
    else break;
  }
  return rank;
}

/** Get the next rank (or null if already max) */
export function getNextRank(totalKm: number): RankDefinition | null {
  const current = getRank(totalKm);
  const idx = RANKS.findIndex((r) => r.id === current.id);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

/** Get progress percentage toward next rank (0-100) */
export function getRankProgress(totalKm: number): number {
  const current = getRank(totalKm);
  const next = getNextRank(totalKm);
  if (!next) return 100;
  const range = next.minKm - current.minKm;
  const progress = totalKm - current.minKm;
  return Math.min(100, Math.round((progress / range) * 100));
}

/** Check if the user just ranked up (given old and new km) */
export function checkRankUp(
  oldKm: number,
  newKm: number
): RankDefinition | null {
  const oldRank = getRank(oldKm);
  const newRank = getRank(newKm);
  if (newRank.id !== oldRank.id && RANKS.indexOf(newRank) > RANKS.indexOf(oldRank)) {
    return newRank;
  }
  return null;
}
