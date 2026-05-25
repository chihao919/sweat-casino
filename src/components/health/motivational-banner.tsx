"use client";

import { useEffect, useState } from "react";
import { getDailyQuote, type Quote } from "@/lib/health/quotes";
import { Heart } from "lucide-react";

export function MotivationalBanner() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    setQuote(getDailyQuote());
  }, []);

  if (!quote) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-white px-6 py-6 shadow-sm">
      {/* Large decorative quote mark */}
      <span className="absolute left-3 top-2 text-5xl font-serif leading-none text-emerald-300 select-none" aria-hidden>
        &ldquo;
      </span>

      <div className="relative z-10 flex flex-col items-center text-center gap-3 px-2">
        <p className="text-lg sm:text-xl font-bold leading-relaxed tracking-wide text-emerald-800">
          {quote.text}
        </p>
        {quote.author && (
          <p className="text-sm font-medium text-emerald-600">
            &mdash; {quote.author}
          </p>
        )}
      </div>

      {/* Decorative glows */}
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute -left-4 -bottom-4 size-20 rounded-full bg-teal-200/30 blur-2xl" />
    </div>
  );
}
