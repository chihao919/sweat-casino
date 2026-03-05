import { Activity } from "@/types";
import { differenceInDays, parseISO } from "date-fns";

export interface ComebackStatus {
  isComeback: boolean;
  inactiveDays: number;
  bonusMultiplier: number;
  message: string;
}

/**
 * Detects if a user is making a "comeback" after inactivity
 * and calculates a welcome-back bonus multiplier.
 *
 * Instead of only punishing inactivity (survival tax),
 * we also reward the act of coming back.
 *
 * Rules:
 * - 3-6 days inactive: 1.2x comeback bonus
 * - 7-13 days inactive: 1.5x comeback bonus
 * - 14+ days inactive: 2.0x comeback bonus (max)
 */
export function checkComebackStatus(activities: Activity[]): ComebackStatus {
  if (activities.length === 0) {
    return {
      isComeback: false,
      inactiveDays: 0,
      bonusMultiplier: 1,
      message: "Start your first run to begin your journey!",
    };
  }

  const sorted = [...activities].sort(
    (a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
  );
  const lastActivityDate = parseISO(sorted[0].activity_date);
  const inactiveDays = differenceInDays(new Date(), lastActivityDate);

  if (inactiveDays < 3) {
    return {
      isComeback: false,
      inactiveDays,
      bonusMultiplier: 1,
      message: "You're on track! Keep it up!",
    };
  }

  let bonusMultiplier: number;
  let message: string;

  if (inactiveDays >= 14) {
    bonusMultiplier = 2.0;
    message = "Welcome back, warrior! 2x bonus on your next run!";
  } else if (inactiveDays >= 7) {
    bonusMultiplier = 1.5;
    message = "We missed you! 1.5x bonus on your next run!";
  } else {
    bonusMultiplier = 1.2;
    message = "Good to see you again! 1.2x comeback bonus!";
  }

  return {
    isComeback: true,
    inactiveDays,
    bonusMultiplier,
    message,
  };
}
