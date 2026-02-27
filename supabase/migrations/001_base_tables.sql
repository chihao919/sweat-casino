-- Migration 001: Base Tables
-- Creates the foundational tables for Sweat Casino:
-- seasons, teams, and weather_records

-- seasons: 3-month season periods that define the competition window
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- e.g. "Season 1: Genesis"
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  -- config holds per-season tunable parameters:
  --   sc_per_km: how many $SC tokens are awarded per kilometer
  --   survival_tax_rate: fraction of balance charged weekly to inactive users
  --   survival_tax_min_km: minimum weekly km to avoid the survival tax
  --   weather_multiplier: bonus multiplier applied on qualifying weather days
  config JSONB DEFAULT '{"sc_per_km": 10, "survival_tax_rate": 0.05, "survival_tax_min_km": 5, "weather_multiplier": 1.5}'::jsonb,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- teams: the two competing groups in every season
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- "Red Bulls" or "White Bears"
  color TEXT NOT NULL,          -- "red" or "white"
  emoji TEXT NOT NULL,          -- "🐂" or "🐻‍❄️"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed the two fixed teams; these rows are referenced throughout the app
INSERT INTO teams (name, color, emoji) VALUES
  ('Red Bulls', 'red', '🐂'),
  ('White Bears', 'white', '🐻‍❄️');

-- weather_records: point-in-time snapshots from OpenWeatherMap
-- Stored so that each activity can reference the weather at the time it started,
-- enabling reproducible bonus calculations even after conditions change.
CREATE TABLE weather_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  weather_code INTEGER NOT NULL,
  weather_main TEXT NOT NULL,
  weather_description TEXT NOT NULL,
  temperature DOUBLE PRECISION NOT NULL,
  wind_speed DOUBLE PRECISION NOT NULL,
  is_bonus_weather BOOLEAN DEFAULT false,
  bonus_reason TEXT,            -- human-readable explanation of why a bonus was triggered
  fetched_at TIMESTAMPTZ DEFAULT now()
);
