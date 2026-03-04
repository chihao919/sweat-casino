/**
 * Central type definitions for Sweat Casino ($SC) application.
 * All database entities, enums, and shared interfaces live here.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum TransactionType {
  SIGNUP_BONUS = "signup_bonus",
  ACTIVITY_EARNED = "activity_earned",
  SURVIVAL_TAX = "survival_tax",
  BET_PLACED = "bet_placed",
  BET_WON = "bet_won",
  BET_REFUND = "bet_refund",
  POOL_ENTRY = "pool_entry",
  POOL_PAYOUT = "pool_payout",
}

export enum BetType {
  OVER = "over",
  UNDER = "under",
  EXACT = "exact",
}

export enum BetStatus {
  PENDING = "pending",
  WON = "won",
  LOST = "lost",
  CANCELLED = "cancelled",
}

export enum PoolType {
  TEAM_WIN = "team_win",
  PERSONAL_KM = "personal_km",
  WEEKLY_STREAK = "weekly_streak",
}

export enum PoolStatus {
  OPEN = "open",
  LOCKED = "locked",
  SETTLED = "settled",
  CANCELLED = "cancelled",
}

export enum PoolSide {
  A = "a",
  B = "b",
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Per-season $SC economy configuration, loaded from the season config JSON.
 */
export interface SCConfig {
  sc_per_km: number
  survival_tax_rate: number
  survival_tax_min_km: number
  weather_multiplier: number
}

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

export interface WeatherBonus {
  isBonus: boolean
  multiplier: number
  reason: string | null
}

// ---------------------------------------------------------------------------
// Database types (mirror Supabase table rows)
// ---------------------------------------------------------------------------

export interface Season {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  config: SCConfig
  created_at: string
}

export interface Team {
  id: string
  season_id: string
  name: string
  color: string
  created_at: string
}

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  team_id: string | null
  sc_balance: number
  strava_athlete_id: string | null
  strava_access_token: string | null
  strava_refresh_token: string | null
  strava_token_expires_at: string | null
  created_at: string
  updated_at: string
  // Joined relation (optional, present when team is fetched)
  team?: Team
}

export interface Activity {
  id: string
  user_id: string
  season_id: string
  strava_activity_id: string | null
  distance_km: number
  duration_seconds: number
  pace_per_km: number
  activity_date: string
  weather_code: number | null
  weather_description: string | null
  temperature: number | null
  wind_speed: number | null
  weather_multiplier: number
  sc_earned: number
  is_manual: boolean
  created_at: string
}

export interface SCTransaction {
  id: string
  user_id: string
  season_id: string
  type: TransactionType
  amount: number
  balance_after: number
  reference_id: string | null
  description: string | null
  created_at: string
}

export interface PersonalBet {
  id: string
  user_id: string
  season_id: string
  bet_type: BetType
  target_value: number
  current_value: number
  stake: number
  odds: number
  potential_payout: number
  status: BetStatus
  period_start: string
  period_end: string
  resolved_at: string | null
  created_at: string
}

export interface BettingPool {
  id: string
  season_id: string
  pool_type: PoolType
  title: string
  description: string | null
  status: PoolStatus
  total_pool: number
  side_a_total: number
  side_b_total: number
  side_a_label: string
  side_b_label: string
  winning_side: PoolSide | null
  lock_at: string
  resolve_at: string
  created_at: string
}

export interface PoolEntry {
  id: string
  pool_id: string
  user_id: string
  side: PoolSide
  amount: number
  payout: number | null
  created_at: string
}

export interface WeeklySnapshot {
  id: string
  user_id: string
  season_id: string
  week_number: number
  week_start: string
  week_end: string
  total_km: number
  total_sc_earned: number
  survival_tax_paid: number
  was_exempt: boolean
  balance_start: number
  balance_end: number
  created_at: string
}

export interface WeatherRecord {
  id: string
  recorded_at: string
  latitude: number
  longitude: number
  weather_code: number
  weather_main: string
  weather_description: string
  temperature: number
  wind_speed: number
  bonus_multiplier: number
  bonus_reason: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Strava types
// ---------------------------------------------------------------------------

export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete_id: number
  profile_url?: string
}

export interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  distance: number        // meters
  moving_time: number     // seconds
  elapsed_time: number    // seconds
  start_date: string
  start_date_local: string
  start_latlng: [number, number] | null
  average_speed: number   // m/s
  max_speed: number       // m/s
  average_heartrate?: number
  max_heartrate?: number
  total_elevation_gain: number
  map?: {
    summary_polyline: string
  }
}

export interface MockActivity extends StravaActivity {
  _isMock: true
  _userId: string
}
