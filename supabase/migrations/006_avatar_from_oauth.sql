-- Migration 006: Auto-set avatar_url from Google OAuth metadata on signup
-- Google stores the profile picture in raw_user_meta_data->>'avatar_url'

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Grant the signup bonus
  INSERT INTO sc_transactions (user_id, amount, type, description, balance_after)
  VALUES (NEW.id, 100.00, 'signup_bonus', 'Welcome to Sweat Casino! Here''s 100 $SC to get started.', 100.00);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
