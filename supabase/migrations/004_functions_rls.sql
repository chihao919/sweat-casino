-- Migration 004: Functions, Triggers, RLS Policies, and Views
-- Depends on: 001_base_tables.sql, 002_profiles_activities.sql, 003_betting_system.sql
-- This migration adds all server-side logic and access control.

-- ========== TRIGGER: auto-create profile on signup ==========

-- handle_new_user runs after every row inserted into auth.users.
-- It creates the corresponding profile and records the welcome bonus transaction
-- in a single atomic operation (SECURITY DEFINER allows access to auth schema).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    -- Use display_name from OAuth metadata if available, otherwise derive from email
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  -- Grant the signup bonus directly so the profile starts with a consistent balance
  INSERT INTO sc_transactions (user_id, amount, type, description, balance_after)
  VALUES (NEW.id, 100.00, 'signup_bonus', 'Welcome to Sweat Casino! Here''s 100 $SC to get started.', 100.00);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========== FUNCTION: atomic $SC transaction ==========

-- process_sc_transaction handles all balance mutations.
-- Using FOR UPDATE on the profile row ensures that concurrent calls
-- (e.g., two Strava webhooks arriving simultaneously) do not produce
-- a race condition on sc_balance.
CREATE OR REPLACE FUNCTION process_sc_transaction(
  p_user_id UUID,
  p_amount DECIMAL,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, transaction_id UUID) AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- Acquire a row-level lock to serialize concurrent balance updates
  SELECT sc_balance INTO v_current_balance
  FROM profiles WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, NULL::UUID;
    RETURN;
  END IF;

  v_new_balance := v_current_balance + p_amount;

  -- Reject any debit that would cause a negative balance, except for
  -- survival_tax which is allowed to drain the account to zero.
  IF v_new_balance < 0 AND p_type != 'survival_tax' THEN
    RETURN QUERY SELECT false, v_current_balance, NULL::UUID;
    RETURN;
  END IF;

  -- Survival tax floors at zero rather than going negative
  IF v_new_balance < 0 THEN
    v_new_balance := 0;
  END IF;

  UPDATE profiles
  SET sc_balance = v_new_balance, updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO sc_transactions (user_id, amount, type, description, reference_id, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id, v_new_balance)
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT true, v_new_balance, v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== FUNCTION: calculate team activity rate ==========

-- calculate_team_activity_rate returns per-week team performance metrics.
-- adjusted_score = total_distance * activity_rate, which rewards teams that
-- have both high mileage AND broad participation (not just a few power runners).
CREATE OR REPLACE FUNCTION calculate_team_activity_rate(
  p_team_id UUID,
  p_week_start DATE DEFAULT date_trunc('week', CURRENT_DATE)::DATE
)
RETURNS TABLE(
  total_km DECIMAL,
  active_members BIGINT,
  total_members BIGINT,
  activity_rate DECIMAL,
  adjusted_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH team_stats AS (
    SELECT
      COALESCE(SUM(a.distance_km), 0) AS total_distance,
      COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN p.id END) AS active_count,
      COUNT(p.id) AS total_count
    FROM profiles p
    LEFT JOIN activities a
      ON a.user_id = p.id
      AND a.start_date >= p_week_start
      AND a.start_date < p_week_start + INTERVAL '7 days'
    WHERE p.team_id = p_team_id
  )
  SELECT
    ts.total_distance,
    ts.active_count,
    ts.total_count,
    CASE WHEN ts.total_count > 0
      THEN ts.active_count::DECIMAL / ts.total_count
      ELSE 0
    END,
    CASE WHEN ts.total_count > 0
      THEN ts.total_distance * (ts.active_count::DECIMAL / ts.total_count)
      ELSE 0
    END
  FROM team_stats ts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== ROW LEVEL SECURITY ==========

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE betting_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_records ENABLE ROW LEVEL SECURITY;

-- profiles: any authenticated user can read the leaderboard;
-- only the owner can write their own row.
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- teams: static reference data, readable by all authenticated users
CREATE POLICY "Teams are viewable by authenticated users" ON teams
  FOR SELECT TO authenticated USING (true);

-- seasons: static reference data, readable by all authenticated users
CREATE POLICY "Seasons are viewable by authenticated users" ON seasons
  FOR SELECT TO authenticated USING (true);

-- activities: public read (needed for leaderboard), restricted write
CREATE POLICY "Activities are viewable by authenticated users" ON activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- sc_transactions: strictly private — a user can only see their own ledger
CREATE POLICY "Users can view own transactions" ON sc_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- personal_bets: private to the owner
CREATE POLICY "Users can view own bets" ON personal_bets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bets" ON personal_bets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- betting_pools: public read so any user can browse and join open pools
CREATE POLICY "Pools are viewable by authenticated users" ON betting_pools
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create pools" ON betting_pools
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

-- pool_entries: public read (amounts visible for transparency in parimutuel markets)
CREATE POLICY "Users can view pool entries" ON pool_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create pool entries" ON pool_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- weekly_snapshots: public leaderboard data
CREATE POLICY "Snapshots are viewable by authenticated users" ON weekly_snapshots
  FOR SELECT TO authenticated USING (true);

-- weather_records: public reference data
CREATE POLICY "Weather records are viewable by authenticated users" ON weather_records
  FOR SELECT TO authenticated USING (true);

-- ========== SECURE VIEW ==========

-- public_profiles strips Strava OAuth tokens so the leaderboard endpoint
-- never exposes access or refresh tokens, even to authenticated users.
CREATE VIEW public.public_profiles AS
SELECT
  id,
  email,
  display_name,
  avatar_url,
  team_id,
  sc_balance,
  total_distance_km,
  total_activities,
  current_streak,
  longest_streak,
  is_strava_connected,
  last_active_at,
  created_at
FROM profiles;
