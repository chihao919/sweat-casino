-- Migration 008: Gamification system - Ranks, Skins, Shop, Loot Boxes
-- Adds: skins, items, user_skins, user_inventory, loot_drops tables
-- Alters: profiles with active_skin_id, title, total_distance_km

-- ---------------------------------------------------------------------------
-- Skin definitions (like LOL champion skins)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  category TEXT NOT NULL DEFAULT 'outfit' CHECK (category IN ('outfit', 'effect', 'title_frame')),
  price_sc NUMERIC DEFAULT 0,
  -- SVG layer references (stored as JSONB for flexibility)
  svg_layers JSONB NOT NULL DEFAULT '{}',
  -- Availability
  is_purchasable BOOLEAN DEFAULT true,
  is_limited BOOLEAN DEFAULT false,
  season_id UUID REFERENCES public.seasons(id),
  -- Requirements (null = no requirement)
  required_rank TEXT,
  required_achievement TEXT,
  required_team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Item definitions (consumable items, boost cards, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  item_type TEXT NOT NULL CHECK (item_type IN ('consumable', 'boost', 'protection', 'cosmetic')),
  effect JSONB DEFAULT '{}',
  duration_hours INTEGER,
  price_sc NUMERIC DEFAULT 0,
  is_purchasable BOOLEAN DEFAULT true,
  max_stack INTEGER DEFAULT 99,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- User owned skins
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skin_id UUID NOT NULL REFERENCES public.skins(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('purchase', 'rank_up', 'loot_drop', 'achievement', 'gift', 'season_reward')),
  acquired_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, skin_id)
);

-- ---------------------------------------------------------------------------
-- User inventory (stackable items)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  acquired_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, item_id)
);

-- ---------------------------------------------------------------------------
-- Loot drop records (history of what dropped after each run)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loot_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id),
  drop_type TEXT NOT NULL CHECK (drop_type IN ('sc', 'item', 'skin')),
  -- Polymorphic: one of these will be set
  sc_amount NUMERIC,
  item_id UUID REFERENCES public.items(id),
  skin_id UUID REFERENCES public.skins(id),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Extend profiles for gamification
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_skin_id UUID REFERENCES public.skins(id),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS total_distance_km NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'bronze';

-- ---------------------------------------------------------------------------
-- Update sc_transactions CHECK to include shop_purchase
-- ---------------------------------------------------------------------------
ALTER TABLE public.sc_transactions
  DROP CONSTRAINT IF EXISTS sc_transactions_type_check;

ALTER TABLE public.sc_transactions
  ADD CONSTRAINT sc_transactions_type_check CHECK (type IN (
    'activity_reward', 'weather_bonus', 'bet_stake', 'bet_payout', 'bet_refund',
    'pool_entry', 'pool_payout', 'pool_refund', 'survival_tax', 'season_bonus',
    'signup_bonus', 'manual_adjustment', 'shop_purchase', 'rank_reward', 'loot_drop'
  ));

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loot_drops ENABLE ROW LEVEL SECURITY;

-- Skins & items: readable by all authenticated users
CREATE POLICY "Skins are viewable by authenticated users" ON public.skins
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Items are viewable by authenticated users" ON public.items
  FOR SELECT TO authenticated USING (true);

-- User skins/inventory: users can only see their own
CREATE POLICY "Users can view own skins" ON public.user_skins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own inventory" ON public.user_inventory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own loot drops" ON public.loot_drops
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed: Default skins
-- ---------------------------------------------------------------------------
INSERT INTO public.skins (name, slug, description, rarity, category, price_sc, is_purchasable, svg_layers) VALUES
  ('Basic Runner', 'basic-runner', 'The default runner outfit. Simple and clean.', 'common', 'outfit', 0, false,
   '{"base":"basic","outfit":"default","color":"#6B7280"}'),
  ('Morning Jogger', 'morning-jogger', 'Early bird gets the worm. Fresh pastel colors for dawn runners.', 'common', 'outfit', 0, false,
   '{"base":"basic","outfit":"jogger","color":"#FCD34D"}'),
  ('Night Runner', 'night-runner', 'Reflective gear for those who own the night.', 'rare', 'outfit', 300, true,
   '{"base":"basic","outfit":"night","color":"#1E293B","accent":"#22D3EE"}'),
  ('Storm Chaser', 'storm-chaser', 'Rain or shine, nothing stops the Storm Chaser.', 'rare', 'outfit', 300, true,
   '{"base":"basic","outfit":"storm","color":"#475569","accent":"#38BDF8"}'),
  ('Trail Blazer', 'trail-blazer', 'Born for the mountains and dirt paths.', 'rare', 'outfit', 300, true,
   '{"base":"basic","outfit":"trail","color":"#78350F","accent":"#A3E635"}'),
  ('Thunder Warrior', 'thunder-warrior', 'Electricity crackles with every stride.', 'epic', 'outfit', 800, true,
   '{"base":"epic","outfit":"thunder","color":"#7C3AED","accent":"#FDE047","effect":"lightning"}'),
  ('Flame Sprinter', 'flame-sprinter', 'Leave a trail of fire behind you.', 'epic', 'outfit', 800, true,
   '{"base":"epic","outfit":"flame","color":"#DC2626","accent":"#FB923C","effect":"fire"}'),
  ('Ice Phantom', 'ice-phantom', 'Cold never bothered you anyway.', 'epic', 'outfit', 800, true,
   '{"base":"epic","outfit":"ice","color":"#0EA5E9","accent":"#E0F2FE","effect":"frost"}'),
  ('Phoenix Rising', 'phoenix-rising', 'From the ashes, a legend is reborn. Season 1 exclusive.', 'legendary', 'outfit', 1500, true,
   '{"base":"legendary","outfit":"phoenix","color":"#F59E0B","accent":"#EF4444","effect":"wings","aura":"fire"}'),
  ('Shadow Assassin', 'shadow-assassin', 'Silent. Deadly. Fast.', 'legendary', 'outfit', 1500, true,
   '{"base":"legendary","outfit":"shadow","color":"#18181B","accent":"#A855F7","effect":"smoke","aura":"dark"}'),
  ('Marathon God', 'marathon-god', 'Only those who have run 1000km can wear this crown.', 'mythic', 'outfit', 0, false,
   '{"base":"mythic","outfit":"god","color":"#FDE68A","accent":"#FBBF24","effect":"divine","aura":"golden"}')
ON CONFLICT (slug) DO NOTHING;

-- Seed: Default items
INSERT INTO public.items (name, slug, description, rarity, item_type, effect, duration_hours, price_sc) VALUES
  ('Tax Shield', 'tax-shield', 'Exempt from survival tax for 1 week.', 'rare', 'protection',
   '{"type":"tax_exempt","duration_weeks":1}', 168, 200),
  ('Double SC Card', 'double-sc', 'Your next run earns 2x SC reward.', 'rare', 'boost',
   '{"type":"sc_multiplier","value":2}', null, 300),
  ('Odds Boost', 'odds-boost', 'Add +0.2x to your next personal bet odds.', 'rare', 'boost',
   '{"type":"odds_boost","value":0.2}', null, 150),
  ('Streak Saver', 'streak-saver', 'Protect your running streak from breaking once.', 'epic', 'protection',
   '{"type":"streak_protect","uses":1}', null, 250),
  ('Lucky Charm', 'lucky-charm', 'Increases loot box drop rarity for 3 runs.', 'epic', 'boost',
   '{"type":"luck_boost","runs":3}', null, 400),
  ('Team Transfer Ticket', 'team-transfer', 'Switch teams once. Use wisely.', 'legendary', 'consumable',
   '{"type":"team_transfer"}', null, 1000)
ON CONFLICT (slug) DO NOTHING;

-- Set required_rank for mythic skin
UPDATE public.skins SET required_rank = 'master', is_purchasable = false WHERE slug = 'marathon-god';

-- Give all existing users the basic-runner skin
INSERT INTO public.user_skins (user_id, skin_id, source)
SELECT p.id, s.id, 'achievement'
FROM public.profiles p
CROSS JOIN public.skins s
WHERE s.slug = 'basic-runner'
ON CONFLICT (user_id, skin_id) DO NOTHING;

-- Set basic-runner as active skin for users without one
UPDATE public.profiles
SET active_skin_id = (SELECT id FROM public.skins WHERE slug = 'basic-runner')
WHERE active_skin_id IS NULL;
