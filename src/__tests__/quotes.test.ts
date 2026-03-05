import { describe, it, expect } from "vitest";
import { getDailyQuote, getRandomQuote } from "@/lib/health/quotes";

describe("getDailyQuote", () => {
  it("returns a quote with text", () => {
    const quote = getDailyQuote();
    expect(quote.text).toBeTruthy();
    expect(typeof quote.text).toBe("string");
  });

  it("returns the same quote when called twice on the same day", () => {
    const q1 = getDailyQuote();
    const q2 = getDailyQuote();
    expect(q1.text).toBe(q2.text);
  });
});

describe("getRandomQuote", () => {
  it("returns a quote with text", () => {
    const quote = getRandomQuote();
    expect(quote.text).toBeTruthy();
  });
});
