/**
 * Item and skin catalog definitions.
 * Used for client-side rendering before DB data loads.
 */

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface SkinDef {
  slug: string;
  name: string;
  nameCn: string;
  description: string;
  rarity: Rarity;
  priceSc: number;
  isPurchasable: boolean;
  colors: {
    primary: string;
    accent?: string;
    effect?: string;
    aura?: string;
  };
}

export interface ItemDef {
  slug: string;
  name: string;
  nameCn: string;
  description: string;
  rarity: Rarity;
  priceSc: number;
  icon: string;
}

export const SKIN_CATALOG: SkinDef[] = [
  {
    slug: "basic-runner",
    name: "Basic Runner",
    nameCn: "基礎跑者",
    description: "The default runner outfit. Simple and clean.",
    rarity: "common",
    priceSc: 0,
    isPurchasable: false,
    colors: { primary: "#6B7280" },
  },
  {
    slug: "morning-jogger",
    name: "Morning Jogger",
    nameCn: "晨跑裝",
    description: "Early bird gets the worm. Fresh pastel colors.",
    rarity: "common",
    priceSc: 0,
    isPurchasable: false,
    colors: { primary: "#FCD34D" },
  },
  {
    slug: "night-runner",
    name: "Night Runner",
    nameCn: "暗夜疾風",
    description: "Reflective gear for those who own the night.",
    rarity: "rare",
    priceSc: 300,
    isPurchasable: true,
    colors: { primary: "#1E293B", accent: "#22D3EE" },
  },
  {
    slug: "storm-chaser",
    name: "Storm Chaser",
    nameCn: "風雨無阻",
    description: "Rain or shine, nothing stops the Storm Chaser.",
    rarity: "rare",
    priceSc: 300,
    isPurchasable: true,
    colors: { primary: "#475569", accent: "#38BDF8" },
  },
  {
    slug: "trail-blazer",
    name: "Trail Blazer",
    nameCn: "山林跑者",
    description: "Born for the mountains and dirt paths.",
    rarity: "rare",
    priceSc: 300,
    isPurchasable: true,
    colors: { primary: "#78350F", accent: "#A3E635" },
  },
  {
    slug: "thunder-warrior",
    name: "Thunder Warrior",
    nameCn: "雷霆戰士",
    description: "Electricity crackles with every stride.",
    rarity: "epic",
    priceSc: 800,
    isPurchasable: true,
    colors: { primary: "#7C3AED", accent: "#FDE047", effect: "lightning" },
  },
  {
    slug: "flame-sprinter",
    name: "Flame Sprinter",
    nameCn: "烈焰衝刺",
    description: "Leave a trail of fire behind you.",
    rarity: "epic",
    priceSc: 800,
    isPurchasable: true,
    colors: { primary: "#DC2626", accent: "#FB923C", effect: "fire" },
  },
  {
    slug: "ice-phantom",
    name: "Ice Phantom",
    nameCn: "冰霜跑者",
    description: "Cold never bothered you anyway.",
    rarity: "epic",
    priceSc: 800,
    isPurchasable: true,
    colors: { primary: "#0EA5E9", accent: "#E0F2FE", effect: "frost" },
  },
  {
    slug: "phoenix-rising",
    name: "Phoenix Rising",
    nameCn: "鳳凰涅槃",
    description: "From the ashes, a legend is reborn. Season 1 exclusive.",
    rarity: "legendary",
    priceSc: 1500,
    isPurchasable: true,
    colors: { primary: "#F59E0B", accent: "#EF4444", effect: "wings", aura: "fire" },
  },
  {
    slug: "shadow-assassin",
    name: "Shadow Assassin",
    nameCn: "暗影刺客",
    description: "Silent. Deadly. Fast.",
    rarity: "legendary",
    priceSc: 1500,
    isPurchasable: true,
    colors: { primary: "#18181B", accent: "#A855F7", effect: "smoke", aura: "dark" },
  },
  {
    slug: "marathon-god",
    name: "Marathon God",
    nameCn: "馬拉松之神",
    description: "Only those who have run 1000km can wear this crown.",
    rarity: "mythic",
    priceSc: 0,
    isPurchasable: false,
    colors: { primary: "#FDE68A", accent: "#FBBF24", effect: "divine", aura: "golden" },
  },
];

export const ITEM_CATALOG: ItemDef[] = [
  { slug: "tax-shield", name: "Tax Shield", nameCn: "免稅盾", description: "Exempt from survival tax for 1 week.", rarity: "rare", priceSc: 200, icon: "🛡️" },
  { slug: "double-sc", name: "Double SC Card", nameCn: "雙倍獎勵卡", description: "Your next run earns 2x SC.", rarity: "rare", priceSc: 300, icon: "⚡" },
  { slug: "odds-boost", name: "Odds Boost", nameCn: "賠率加成卡", description: "+0.2x to your next bet odds.", rarity: "rare", priceSc: 150, icon: "🎯" },
  { slug: "streak-saver", name: "Streak Saver", nameCn: "連續保護卡", description: "Protect your streak from breaking once.", rarity: "epic", priceSc: 250, icon: "🔄" },
  { slug: "lucky-charm", name: "Lucky Charm", nameCn: "幸運符", description: "Better loot box drops for 3 runs.", rarity: "epic", priceSc: 400, icon: "🍀" },
  { slug: "team-transfer", name: "Team Transfer", nameCn: "轉隊令", description: "Switch teams once. Use wisely.", rarity: "legendary", priceSc: 1000, icon: "🏳️" },
];

export const RARITY_CONFIG: Record<Rarity, { label: string; labelCn: string; color: string; bgColor: string; borderColor: string }> = {
  common: { label: "Common", labelCn: "普通", color: "text-neutral-400", bgColor: "bg-neutral-800", borderColor: "border-neutral-600" },
  rare: { label: "Rare", labelCn: "稀有", color: "text-blue-400", bgColor: "bg-blue-950/50", borderColor: "border-blue-700" },
  epic: { label: "Epic", labelCn: "史詩", color: "text-purple-400", bgColor: "bg-purple-950/50", borderColor: "border-purple-700" },
  legendary: { label: "Legendary", labelCn: "傳說", color: "text-amber-400", bgColor: "bg-amber-950/50", borderColor: "border-amber-600" },
  mythic: { label: "Mythic", labelCn: "神話", color: "text-red-400", bgColor: "bg-red-950/50", borderColor: "border-red-700" },
};

export function getSkinBySlug(slug: string): SkinDef | undefined {
  return SKIN_CATALOG.find((s) => s.slug === slug);
}

export function getItemBySlug(slug: string): ItemDef | undefined {
  return ITEM_CATALOG.find((i) => i.slug === slug);
}
