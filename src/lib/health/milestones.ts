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
  { id: "first_step", label: "First Step", description: "Complete your first run", targetKm: 0.01 },
  { id: "5k_runner", label: "5K Runner", description: "Run a total of 5 km", targetKm: 5 },
  { id: "10k_runner", label: "10K Explorer", description: "Run a total of 10 km", targetKm: 10 },
  { id: "half_marathon", label: "Half Marathon", description: "Accumulate 21.1 km", targetKm: 21.1 },
  { id: "marathon", label: "Marathon Spirit", description: "Accumulate 42.195 km", targetKm: 42.195 },
  { id: "100k_club", label: "100K Club", description: "Accumulate 100 km", targetKm: 100 },
  { id: "200k_warrior", label: "200K Warrior", description: "Accumulate 200 km", targetKm: 200 },
  { id: "500k_legend", label: "500K Legend", description: "Accumulate 500 km", targetKm: 500 },
  { id: "1000k_immortal", label: "1000K Immortal", description: "Accumulate 1,000 km", targetKm: 1000 },
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
