-- Migration 002: Profiles and Activities
-- Depends on: 001_base_tables.sql (teams, seasons, weather_records)
-- Creates the user profile table (linked to Supabase Auth) and
-- the activities table for Strava-synced running data.

-- profiles: extends auth.users with app-specific user data
-- One row is created automatically via trigger when a user signs up.
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  team_id UUID REFERENCES teams(id),
  sc_balance DECIMAL(12,2) DEFAULT 100.00,  -- users start with 100 $SC
  total_distance_km DECIMAL(10,2) DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  -- Strava OAuth fields; kept in profiles for simplicity but hidden from
  -- the public_profiles view to avoid leaking access tokens.
  strava_athlete_id BIGINT,
  strava_access_token TEXT,
  strava_refresh_token TEXT,
  strava_token_expires_at BIGINT,
  is_strava_connected BOOLEAN DEFAULT false,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- activities: one row per run synced from Strava (or recorded manually)
-- The strava_activity_id UNIQUE constraint prevents duplicate imports.
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  strava_activity_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  distance_km DECIMAL(8,2) NOT NULL,
  duration_seconds INTEGER NOT NULL,
  pace_per_km DECIMAL(6,2),                -- minutes per km
  start_date TIMESTAMPTZ NOT NULL,
  start_latitude DOUBLE PRECISION,
  start_longitude DOUBLE PRECISION,
  weather_record_id UUID REFERENCES weather_records(id),
  weather_multiplier DECIMAL(3,1) DEFAULT 1.0,
  sc_earned DECIMAL(10,2) DEFAULT 0,
  is_mock BOOLEAN DEFAULT false,            -- true for dev/demo seed data
  season_id UUID REFERENCES seasons(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes to support common query patterns:
-- leaderboard queries by user, chronological feeds, season-scoped aggregations
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_start_date ON activities(start_date);
CREATE INDEX idx_activities_season_id ON activities(season_id);
