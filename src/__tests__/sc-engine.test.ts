import { describe, it, expect } from "vitest";
import { calculateSCEarned, calculateSignupBonus, formatSC } from "@/lib/sc/engine";
import { SCConfig } from "@/types";

const config: SCConfig = {
  sc_per_km: 5,
  survival_tax_rate: 0.1,
  survival_tax_min_km: 10,
  weather_multiplier: 1.5,
};

describe("calculateSCEarned", () => {
  it("calculates base SC for a run", () => {
    expect(calculateSCEarned(10, 1, config)).toBe(50);
  });

  it("applies weather multiplier", () => {
    expect(calculateSCEarned(10, 1.5, config)).toBe(75);
  });

  it("returns 0 for zero distance", () => {
    expect(calculateSCEarned(0, 1, config)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    expect(calculateSCEarned(3.33, 1, config)).toBe(16.65);
  });
});

describe("calculateSignupBonus", () => {
  it("returns 100", () => {
    expect(calculateSignupBonus()).toBe(100);
  });
});

describe("formatSC", () => {
  it("formats whole numbers", () => {
    expect(formatSC(100)).toBe("$100.00 SC");
  });

  it("formats decimals", () => {
    expect(formatSC(42.5)).toBe("$42.50 SC");
  });

  it("formats zero", () => {
    expect(formatSC(0)).toBe("$0.00 SC");
  });
});
