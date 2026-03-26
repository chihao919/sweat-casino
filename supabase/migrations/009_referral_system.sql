-- Migration 009: Referral System
-- Adds referral tracking to profiles and rewards referrers with $SC

-- Add referral tracking column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Add referral count for easy lookup
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Function: process referral reward
-- Called after a new user completes signup with a referral code.
-- Awards the referrer 50 $SC and increments their referral_count.
CREATE OR REPLACE FUNCTION process_referral_reward(
  p_new_user_id UUID,
  p_referrer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_exists BOOLEAN;
BEGIN
  -- Verify the referrer exists and is not the same person
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_referrer_id AND id != p_new_user_id)
  INTO v_referrer_exists;

  IF NOT v_referrer_exists THEN
    RETURN false;
  END IF;

  -- Set the referred_by on the new user's profile
  UPDATE profiles
  SET referred_by = p_referrer_id
  WHERE id = p_new_user_id AND referred_by IS NULL;

  -- Award 50 $SC to the referrer
  PERFORM process_sc_transaction(
    p_referrer_id,
    50.00,
    'referral_reward',
    'Referral bonus: a new player joined via your invite link!'
  );

  -- Increment referral count
  UPDATE profiles
  SET referral_count = referral_count + 1
  WHERE id = p_referrer_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
