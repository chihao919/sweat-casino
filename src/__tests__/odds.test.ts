import { describe, it, expect } from "vitest";
import { formatOdds, oddsToImpliedProbability, getOddsColor } from "@/lib/betting/odds";

describe("formatOdds", () => {
  it("formats as multiplier string", () => {
    expect(formatOdds(2.5)).toBe("2.50x");
  });

  it("formats whole number", () => {
    expect(formatOdds(3)).toBe("3.00x");
  });
});

describe("oddsToImpliedProbability", () => {
  it("converts 2.0x to 50%", () => {
    expect(oddsToImpliedProbability(2)).toBe(50);
  });

  it("converts 1.0x to 100%", () => {
    expect(oddsToImpliedProbability(1)).toBe(100);
  });

  it("returns 0 for zero or negative odds", () => {
    expect(oddsToImpliedProbability(0)).toBe(0);
    expect(oddsToImpliedProbability(-1)).toBe(0);
  });

  it("converts 4.0x to 25%", () => {
    expect(oddsToImpliedProbability(4)).toBe(25);
  });
});

describe("getOddsColor", () => {
  it("returns green for low odds (<2.0)", () => {
    expect(getOddsColor(1.5)).toBe("text-green-500");
  });

  it("returns yellow for moderate odds (2.0-3.5)", () => {
    expect(getOddsColor(2.5)).toBe("text-yellow-500");
  });

  it("returns red for high odds (>3.5)", () => {
    expect(getOddsColor(5)).toBe("text-red-500");
  });
});
