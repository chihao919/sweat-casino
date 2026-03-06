-- Migration 007: Fix handle_new_user trigger
-- Problem: "Database error saving new user" on Google signup
-- Root cause: Missing search_path and no error handling in trigger function
-- Fix: Add search_path, use schema-qualified table names, add ON CONFLICT for resilience

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create the profile row (ON CONFLICT handles edge case of re-triggered signups)
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  -- Grant signup bonus (only if no prior signup_bonus exists for this user)
  INSERT INTO public.sc_transactions (user_id, amount, type, description, balance_after)
  SELECT NEW.id, 100.00, 'signup_bonus', 'Welcome to Sweat Casino! Here''s 100 $SC to get started.', 100.00
  WHERE NOT EXISTS (
    SELECT 1 FROM public.sc_transactions
    WHERE user_id = NEW.id AND type = 'signup_bonus'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
