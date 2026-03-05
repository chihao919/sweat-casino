/**
 * Motivational quotes displayed throughout the app.
 * A mix of health-focused, discipline, and empowerment messages.
 */

const MOTIVATIONAL_QUOTES = [
  // Health & body focused
  { text: "Your body is the only machine that gets better the more you use it.", author: null },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "The body achieves what the mind believes.", author: null },
  { text: "Health is not about the weight you lose, but the life you gain.", author: null },
  { text: "A one-hour workout is 4% of your day. No excuses.", author: null },
  { text: "Sweat is just fat crying.", author: null },
  { text: "The only bad workout is the one you didn't do.", author: null },

  // Consistency & discipline
  { text: "It's not about being the best. It's about being better than yesterday.", author: null },
  { text: "Small steps every day lead to big changes over time.", author: null },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "You don't have to be extreme, just consistent.", author: null },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },

  // Running specific
  { text: "Run when you can, walk if you have to, crawl if you must; just never give up.", author: "Dean Karnazes" },
  { text: "The miracle isn't that I finished. The miracle is that I had the courage to start.", author: "John Bingham" },
  { text: "Every mile is a gift. Cherish every step.", author: null },

  // Fighting entropy / anti-aging
  { text: "Motion is lotion. The more you move, the better you feel.", author: null },
  { text: "Exercise is the closest thing to an anti-aging pill.", author: null },
  { text: "Your future self will thank you for the run you did today.", author: null },
  { text: "In the war against entropy, every run is a battle won.", author: null },

  // Community & team spirit
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
  { text: "We rise by lifting others. Your run inspires your team.", author: null },
  { text: "You are not just running for yourself. You are running for your team.", author: null },
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
