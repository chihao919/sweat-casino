-- Migration 003: Betting System
-- Depends on: 001_base_tables.sql, 002_profiles_activities.sql
-- Creates the full wagering layer:
--   sc_transactions  - immutable financial ledger
--   personal_bets    - user bets on their own performance
--   betting_pools    - public prediction markets (long/short)
--   pool_entries     - individual positions within a pool
--   weekly_snapshots - pre-aggregated weekly team stats for fast reads

-- sc_transactions: append-only ledger; rows must never be updated or deleted.
-- balance_after is denormalized here so any row can be audited independently
-- without replaying the full history.
CREATE TABLE sc_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,  -- positive = credit, negative = debit
  type TEXT NOT NULL CHECK (type IN (
    'activity_reward',
    'weather_bonus',
    'bet_stake',
    'bet_payout',
    'bet_refund',
    'pool_entry',
    'pool_payout',
    'pool_refund',
    'survival_tax',
    'season_bonus',
    'signup_bonus',
    'manual_adjustment'
  )),
  description TEXT,
  reference_id UUID,              -- optional FK to the activity, bet, or pool that caused this transaction
  balance_after DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sc_transactions_user_id ON sc_transactions(user_id);

-- personal_bets: a user commits stake and sets a personal goal (distance or count)
-- over a defined window. Odds are fixed at creation time.
CREATE TABLE personal_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('distance', 'count')),
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  stake DECIMAL(10,2) NOT NULL,
  odds DECIMAL(4,2) NOT NULL,             -- multiplier between 1.5x and 5.0x
  potential_payout DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')),
  resolved_at TIMESTAMPTZ,
  season_id UUID REFERENCES seasons(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_personal_bets_user_id ON personal_bets(user_id);
CREATE INDEX idx_personal_bets_status ON personal_bets(status);

-- betting_pools: public markets where users predict whether a team or individual
-- will hit a numeric target. Works as a parimutuel long/short pool.
CREATE TABLE betting_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pool_type TEXT NOT NULL CHECK (pool_type IN ('team_distance', 'team_activity', 'individual', 'custom')),
  target_team_id UUID REFERENCES teams(id),
  target_value DECIMAL(10,2),
  total_pool DECIMAL(12,2) DEFAULT 0,
  long_total DECIMAL(12,2) DEFAULT 0,     -- total $SC on the "will hit" side
  short_total DECIMAL(12,2) DEFAULT 0,    -- total $SC on the "will not hit" side
  resolve_date TIMESTAMPTZ NOT NULL,
  actual_value DECIMAL(10,2),             -- populated when the pool is resolved
  winning_side TEXT CHECK (winning_side IN ('long', 'short')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved', 'cancelled')),
  season_id UUID REFERENCES seasons(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- pool_entries: one row per user per pool; UNIQUE enforces one position per user.
-- A user can only be on one side — if they want to change sides they must cancel
-- and re-enter (handled at the application layer).
CREATE TABLE pool_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES betting_pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  amount DECIMAL(10,2) NOT NULL,
  potential_payout DECIMAL(10,2),         -- estimated at entry time based on current pool ratio
  actual_payout DECIMAL(10,2),            -- populated when the pool resolves
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pool_id, user_id)
);

-- weekly_snapshots: materialized weekly team stats used by the leaderboard and
-- betting pool resolution. Populated by a scheduled function or edge function.
-- The UNIQUE constraint on (team_id, week_start) prevents duplicate snapshots.
CREATE TABLE weekly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  season_id UUID REFERENCES seasons(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_distance_km DECIMAL(12,2) DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,
  activity_rate DECIMAL(5,4) DEFAULT 0,   -- fraction of members who ran at least once
  adjusted_score DECIMAL(12,2) DEFAULT 0, -- total_distance * activity_rate
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, week_start)
);
