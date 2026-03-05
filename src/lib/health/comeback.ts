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
      message: "開始你的第一次跑步，展開旅程！",
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
      message: "你正在軌道上，繼續保持！",
    };
  }

  let bonusMultiplier: number;
  let message: string;

  if (inactiveDays >= 14) {
    bonusMultiplier = 2.0;
    message = "歡迎回來，戰士！下一次跑步可獲得 2 倍加成！";
  } else if (inactiveDays >= 7) {
    bonusMultiplier = 1.5;
    message = "我們想你了！下一次跑步可獲得 1.5 倍加成！";
  } else {
    bonusMultiplier = 1.2;
    message = "很高興再見到你！回歸獎勵 1.2 倍加成！";
  }

  return {
    isComeback: true,
    inactiveDays,
    bonusMultiplier,
    message,
  };
}
