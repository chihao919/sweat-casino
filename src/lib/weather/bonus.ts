import { WeatherBonus } from "@/types";

// Maximum multiplier cap — prevents runaway $SC inflation on extreme days
const MAX_MULTIPLIER = 1.5;
const BASE_MULTIPLIER = 1.0;

// OWM weather code ranges
// Full reference: https://openweathermap.org/weather-conditions
const THUNDERSTORM_MIN = 200;
const THUNDERSTORM_MAX = 232;
const HEAVY_RAIN_MIN = 502;
const HEAVY_RAIN_MAX = 504;
const SNOW_MIN = 600;
const SNOW_MAX = 622;

// Temperature thresholds in Celsius
const EXTREME_HEAT_THRESHOLD = 35;
const EXTREME_COLD_THRESHOLD = 0;

// Wind speed threshold in m/s
const STRONG_WIND_THRESHOLD = 10;

/**
 * Evaluates whether the current weather conditions warrant an $SC bonus.
 *
 * Only the FIRST matching condition is applied — bonuses do not stack.
 * This keeps the economy predictable while still rewarding gritty athletes.
 *
 * Conditions checked (in priority order):
 *  1. Heavy rain (OWM code 502-504)  → 1.5x
 *  2. Thunderstorm (OWM code 200-232) → 1.5x
 *  3. Extreme heat (>35°C)            → 1.5x
 *  4. Extreme cold (<0°C)             → 1.5x
 *  5. Strong wind (>10 m/s)           → 1.5x
 *  6. Snow (OWM code 600-622)         → 1.5x
 */
export function evaluateWeatherBonus(
  weatherCode: number,
  temperature: number,
  windSpeed: number
): WeatherBonus {
  // Heavy rain takes priority over general thunderstorm check
  if (weatherCode >= HEAVY_RAIN_MIN && weatherCode <= HEAVY_RAIN_MAX) {
    return { isBonus: true, multiplier: MAX_MULTIPLIER, reason: "Heavy Rain" };
  }

  if (weatherCode >= THUNDERSTORM_MIN && weatherCode <= THUNDERSTORM_MAX) {
    return {
      isBonus: true,
      multiplier: MAX_MULTIPLIER,
      reason: "Thunderstorm",
    };
  }

  if (temperature > EXTREME_HEAT_THRESHOLD) {
    return {
      isBonus: true,
      multiplier: MAX_MULTIPLIER,
      reason: "Extreme Heat",
    };
  }

  if (temperature < EXTREME_COLD_THRESHOLD) {
    return {
      isBonus: true,
      multiplier: MAX_MULTIPLIER,
      reason: "Extreme Cold",
    };
  }

  if (windSpeed > STRONG_WIND_THRESHOLD) {
    return {
      isBonus: true,
      multiplier: MAX_MULTIPLIER,
      reason: "Strong Wind",
    };
  }

  if (weatherCode >= SNOW_MIN && weatherCode <= SNOW_MAX) {
    return { isBonus: true, multiplier: MAX_MULTIPLIER, reason: "Snow" };
  }

  return { isBonus: false, multiplier: BASE_MULTIPLIER, reason: null };
}
