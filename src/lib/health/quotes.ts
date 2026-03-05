/**
 * Motivational quotes displayed throughout the app.
 * A mix of health-focused, discipline, and empowerment messages.
 */

const MOTIVATIONAL_QUOTES = [
  // Health & body focused
  { text: "你的身體是唯一越使用越強大的機器。", author: null },
  { text: "好好照顧你的身體，那是你唯一能住的地方。", author: "Jim Rohn" },
  { text: "身體能達成的，取決於心智所相信的。", author: null },
  { text: "健康不是你減掉了多少體重，而是你獲得了多少生命。", author: null },
  { text: "一小時的運動只佔你一天的 4%，沒有藉口。", author: null },
  { text: "汗水，是脂肪在哭泣。", author: null },
  { text: "唯一糟糕的運動，就是你沒做的那一次。", author: null },

  // Consistency & discipline
  { text: "不是要成為最好的，而是要比昨天更好。", author: null },
  { text: "每天一小步，日積月累成大變化。", author: null },
  { text: "紀律，是在你現在想要的和最終想要的之間做選擇。", author: "Abraham Lincoln" },
  { text: "你不需要極端，只需要持續。", author: null },
  { text: "領先的秘訣就是開始行動。", author: "Mark Twain" },
  { text: "不要數日子，要讓每一天都有意義。", author: "Muhammad Ali" },

  // Running specific
  { text: "能跑就跑，不行就走，再不行就爬；但絕對不要放棄。", author: "Dean Karnazes" },
  { text: "奇蹟不是我跑完了全程，奇蹟是我有勇氣踏出第一步。", author: "John Bingham" },
  { text: "每一公里都是禮物，珍惜每一步。", author: null },

  // Fighting entropy / anti-aging
  { text: "運動是最好的潤滑劑，動得越多，感覺越好。", author: null },
  { text: "運動是最接近抗老仙丹的東西。", author: null },
  { text: "未來的你，會感謝今天去跑步的自己。", author: null },
  { text: "在對抗熵增的戰爭中，每一次跑步都是一場勝利。", author: null },

  // Community & team spirit
  { text: "一個人能做的有限，一群人能做的無限。", author: "Helen Keller" },
  { text: "我們因提攜他人而崛起，你的每一步都在激勵隊友。", author: null },
  { text: "你不只是為自己而跑，你是為整個團隊而跑。", author: null },
];

export interface Quote {
  text: string;
  author: string | null;
}

/**
 * Returns a deterministic daily quote based on the current date.
 */
export function getDailyQuote(): Quote {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}

/**
 * Returns a random quote.
 */
export function getRandomQuote(): Quote {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}
