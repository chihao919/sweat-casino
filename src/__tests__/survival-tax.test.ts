import { describe, it, expect } from "vitest";
import { calculateSurvivalTax, isExemptFromTax } from "@/lib/sc/survival-tax";

describe("calculateSurvivalTax", () => {
  it("returns 0 for zero balance", () => {
    expect(calculateSurvivalTax(0, 0.1)).toBe(0);
  });

  it("returns 0 for negative balance", () => {
    expect(calculateSurvivalTax(-50, 0.1)).toBe(0);
  });

  it("calculates tax as balance * rate", () => {
    expect(calculateSurvivalTax(1000, 0.1)).toBe(100);
  });

  it("enforces minimum tax of 1 for small balances", () => {
    expect(calculateSurvivalTax(5, 0.1)).toBe(1);
  });

  it("enforces minimum tax of 1 even for very small rate", () => {
    expect(calculateSurvivalTax(3, 0.01)).toBe(1);
  });
});

describe("isExemptFromTax", () => {
  it("exempts user who ran enough", () => {
    expect(isExemptFromTax(15, 10)).toBe(true);
  });

  it("exempts user at exact threshold", () => {
    expect(isExemptFromTax(10, 10)).toBe(true);
  });

  it("does not exempt user below threshold", () => {
    expect(isExemptFromTax(9.9, 10)).toBe(false);
  });

  it("does not exempt zero distance", () => {
    expect(isExemptFromTax(0, 10)).toBe(false);
  });
});
