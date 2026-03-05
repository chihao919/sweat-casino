import { Activity } from "@/types";

export interface Milestone {
  id: string;
  label: string;
  description: string;
  icon: string;
  targetKm: number;
  achieved: boolean;
  progress: number; // 0-100
}

const DISTANCE_MILESTONES = [
  { id: "first_step", label: "踏出第一步", description: "完成你的第一次跑步", targetKm: 0.01 },
  { id: "5k_runner", label: "5K 跑者", description: "累計跑步 5 公里", targetKm: 5 },
  { id: "10k_runner", label: "10K 探索者", description: "累計跑步 10 公里", targetKm: 10 },
  { id: "half_marathon", label: "半馬精神", description: "累計跑步 21.1 公里", targetKm: 21.1 },
  { id: "marathon", label: "全馬意志", description: "累計跑步 42.195 公里", targetKm: 42.195 },
  { id: "100k_club", label: "百K俱樂部", description: "累計跑步 100 公里", targetKm: 100 },
  { id: "200k_warrior", label: "200K 戰士", description: "累計跑步 200 公里", targetKm: 200 },
  { id: "500k_legend", label: "500K 傳奇", description: "累計跑步 500 公里", targetKm: 500 },
  { id: "1000k_immortal", label: "千K不朽", description: "累計跑步 1,000 公里", targetKm: 1000 },
];

const MILESTONE_ICONS: Record<string, string> = {
  first_step: "👟",
  "5k_runner": "🏃",
  "10k_runner": "🗺️",
  half_marathon: "🏅",
  marathon: "🎖️",
  "100k_club": "💯",
  "200k_warrior": "⚔️",
  "500k_legend": "👑",
  "1000k_immortal": "🏛️",
};

export function calculateMilestones(activities: Activity[]): Milestone[] {
  const totalKm = activities.reduce((sum, a) => sum + a.distance_km, 0);

  return DISTANCE_MILESTONES.map((m) => ({
    id: m.id,
    label: m.label,
    description: m.description,
    icon: MILESTONE_ICONS[m.id] || "🎯",
    targetKm: m.targetKm,
    achieved: totalKm >= m.targetKm,
    progress: Math.min(100, Math.round((totalKm / m.targetKm) * 100)),
  }));
}

export function getNextMilestone(activities: Activity[]): Milestone | null {
  const milestones = calculateMilestones(activities);
  return milestones.find((m) => !m.achieved) ?? null;
}

export function getAchievedCount(activities: Activity[]): number {
  return calculateMilestones(activities).filter((m) => m.achieved).length;
}
