/**
 * Lightweight wrapper around the OpenWeatherMap "Current Weather" API.
 * API docs: https://openweathermap.org/current
 */

export interface WeatherData {
  weather_code: number
  weather_main: string
  weather_description: string
  temperature: number    // Celsius
  wind_speed: number     // m/s
}

/** Shape of the relevant fields from the OWM JSON response */
interface OWMCurrentWeatherResponse {
  weather: Array<{
    id: number
    main: string
    description: string
  }>
  main: {
    temp: number
  }
  wind: {
    speed: number
  }
}

/**
 * Fetches the current weather conditions for the given coordinates.
 *
 * Requires the OPENWEATHERMAP_API_KEY environment variable to be set.
 * Throws if the API responds with a non-2xx status.
 */
export async function fetchCurrentWeather(
  lat: number,
  lng: number
): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing required environment variable: OPENWEATHERMAP_API_KEY"
    );
  }

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `OpenWeatherMap API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as OWMCurrentWeatherResponse;

  // The API may return multiple weather conditions; we use the primary one
  const primary = data.weather[0];

  if (!primary) {
    throw new Error("OpenWeatherMap response contained no weather conditions");
  }

  return {
    weather_code: primary.id,
    weather_main: primary.main,
    weather_description: primary.description,
    temperature: data.main.temp,
    wind_speed: data.wind.speed,
  };
}
