import { Activity } from "@/types";
import { format, parseISO, differenceInDays } from "date-fns";

export interface BodyVersion {
  major: number;
  minor: number;
  patch: number;
  display: string;
  title: string;
  description: string;
}

/**
 * Calculates a "Body Version" number based on running consistency.
 *
 * - Major: increments every 4 consecutive active weeks
 * - Minor: increments every active week within current major cycle
 * - Patch: number of activities in the current week
 *
 * This rewards consistency over raw performance.
 */
export function calculateBodyVersion(activities: Activity[]): BodyVersion {
  if (activities.length === 0) {
    return {
      major: 1,
      minor: 0,
      patch: 0,
      display: "v1.0.0",
      title: "Uninitialized",
      description: "Start running to boot up your system",
    };
  }

  const activeWeeks = countActiveWeeks(activities);
  const major = 1 + Math.floor(activeWeeks / 4);
  const minor = activeWeeks % 4;

  // Patch = activities in the most recent 7 days
  const now = new Date();
  const recentActivities = activities.filter((a) => {
    const diff = differenceInDays(now, parseISO(a.activity_date));
    return diff >= 0 && diff < 7;
  });
  const patch = recentActivities.length;

  const display = `v${major}.${minor}.${patch}`;
  const { title, description } = getVersionMeta(major);

  return { major, minor, patch, display, title, description };
}

function countActiveWeeks(activities: Activity[]): number {
  // Group activities by ISO week (YYYY-ww)
  const weekSet = new Set<string>();
  for (const a of activities) {
    const date = parseISO(a.activity_date);
    const weekKey = format(date, "RRRR-II"); // ISO week year + week number
    weekSet.add(weekKey);
  }
  return weekSet.size;
}

interface VersionMeta {
  title: string;
  description: string;
}

function getVersionMeta(major: number): VersionMeta {
  if (major <= 1) return { title: "Boot Sequence", description: "System initializing..." };
  if (major === 2) return { title: "Beta Release", description: "Building healthy habits" };
  if (major === 3) return { title: "Stable Build", description: "Consistency is your superpower" };
  if (major === 4) return { title: "Performance Edition", description: "Your body is optimized" };
  if (major === 5) return { title: "Pro Version", description: "Elite-level discipline" };
  return { title: "Legendary OS", description: "You are the algorithm" };
}
