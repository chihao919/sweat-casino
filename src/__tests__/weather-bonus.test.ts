import { describe, it, expect } from "vitest";
import { evaluateWeatherBonus } from "@/lib/weather/bonus";

describe("evaluateWeatherBonus", () => {
  it("returns 1.5x for heavy rain (code 502-504)", () => {
    const result = evaluateWeatherBonus(502, 25, 3);
    expect(result.isBonus).toBe(true);
    expect(result.multiplier).toBe(1.5);
    expect(result.reason).toBe("Heavy Rain");
  });

  it("returns 1.5x for thunderstorm (code 200-232)", () => {
    const result = evaluateWeatherBonus(211, 25, 3);
    expect(result.isBonus).toBe(true);
    expect(result.reason).toBe("Thunderstorm");
  });

  it("returns 1.5x for extreme heat (>35C)", () => {
    const result = evaluateWeatherBonus(800, 38, 3);
    expect(result.isBonus).toBe(true);
    expect(result.reason).toBe("Extreme Heat");
  });

  it("returns 1.5x for extreme cold (<0C)", () => {
    const result = evaluateWeatherBonus(800, -5, 3);
    expect(result.isBonus).toBe(true);
    expect(result.reason).toBe("Extreme Cold");
  });

  it("returns 1.5x for strong wind (>10 m/s)", () => {
    const result = evaluateWeatherBonus(800, 20, 15);
    expect(result.isBonus).toBe(true);
    expect(result.reason).toBe("Strong Wind");
  });

  it("returns 1.5x for snow (code 600-622)", () => {
    const result = evaluateWeatherBonus(601, 2, 3);
    expect(result.isBonus).toBe(true);
    expect(result.reason).toBe("Snow");
  });

  it("returns no bonus for normal weather", () => {
    const result = evaluateWeatherBonus(800, 25, 3);
    expect(result.isBonus).toBe(false);
    expect(result.multiplier).toBe(1.0);
    expect(result.reason).toBeNull();
  });

  it("heavy rain has priority over other conditions", () => {
    // Code 502 (heavy rain) + extreme heat + strong wind
    const result = evaluateWeatherBonus(502, 40, 15);
    expect(result.reason).toBe("Heavy Rain");
  });
});
