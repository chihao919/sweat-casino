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
    <div className="relative overflow-hidden rounded-lg border border-emerald-900/50 bg-gradient-to-r from-emerald-950/60 to-teal-950/40 px-4 py-3">
      <div className="flex items-start gap-3">
        <Heart className="mt-0.5 size-4 shrink-0 text-emerald-400" />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug text-emerald-100">
            &ldquo;{quote.text}&rdquo;
          </p>
          {quote.author && (
            <p className="mt-1 text-xs text-emerald-400/70">— {quote.author}</p>
          )}
        </div>
      </div>
      {/* Decorative glow */}
      <div className="absolute -right-4 -top-4 size-16 rounded-full bg-emerald-500/10 blur-2xl" />
    </div>
  );
}
