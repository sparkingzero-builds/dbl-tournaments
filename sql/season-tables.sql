-- Season System Tables
-- Run this in the Supabase SQL Editor

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'upcoming')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  total_tiers INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Season rewards (what you earn at each tier)
CREATE TABLE IF NOT EXISTS season_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  tier INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  track TEXT NOT NULL DEFAULT 'free' CHECK (track IN ('free', 'premium')),
  premium_cost INTEGER DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season_id, tier)
);

-- Player progress per season
CREATE TABLE IF NOT EXISTS season_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  discord_username TEXT NOT NULL,
  xp INTEGER DEFAULT 0,
  claimed_tiers JSONB DEFAULT '[]',
  matches_played INTEGER DEFAULT 0,
  bounty_wins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season_id, discord_username)
);

-- Clan wars table (if not already created)
CREATE TABLE IF NOT EXISTS clan_wars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan1_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  clan2_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  clan1_wins INTEGER DEFAULT 0,
  clan2_wins INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_wars ENABLE ROW LEVEL SECURITY;

-- Read access for all
CREATE POLICY "seasons_read" ON seasons FOR SELECT USING (true);
CREATE POLICY "season_rewards_read" ON season_rewards FOR SELECT USING (true);
CREATE POLICY "season_progress_read" ON season_progress FOR SELECT USING (true);
CREATE POLICY "clan_wars_read" ON clan_wars FOR SELECT USING (true);

-- Write access for all (anon key, admin gated in app)
CREATE POLICY "seasons_write" ON seasons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "season_rewards_write" ON season_rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "season_progress_write" ON season_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "clan_wars_write" ON clan_wars FOR ALL USING (true) WITH CHECK (true);

-- Seed Season 1 with rewards
INSERT INTO seasons (name, status, started_at, ends_at, total_tiers)
VALUES ('Season 1: Rise of Legends', 'active', now(), now() + interval '30 days', 20);

-- Get the season ID for rewards
DO $$
DECLARE
  s_id UUID;
BEGIN
  SELECT id INTO s_id FROM seasons WHERE name = 'Season 1: Rise of Legends' LIMIT 1;

  INSERT INTO season_rewards (season_id, tier, name, type, track, description, metadata) VALUES
    (s_id, 1,  '50 Points',           'points',       'free',    'Starter points',             '{"amount": 50}'),
    (s_id, 2,  'Rising Star Title',   'flair_title',  'free',    'Equippable title',           '{"title": "Rising Star"}'),
    (s_id, 3,  '100 Points',          'points',       'free',    'Keep grinding',              '{"amount": 100}'),
    (s_id, 4,  'Flame Aura',          'aura',         'premium', 'Animated flame glow',        '{"color": "#ff4757"}'),
    (s_id, 5,  'Cyber Border',        'flair_border', 'free',    'Neon cyber profile border',  '{"border": "cyber"}'),
    (s_id, 6,  '200 Points',          'points',       'premium', 'Premium point drop',         '{"amount": 200}'),
    (s_id, 7,  'Arena Veteran Title',  'flair_title', 'free',    'Equippable title',           '{"title": "Arena Veteran"}'),
    (s_id, 8,  'Victory Quote',       'victory_quote','premium', 'Custom win message',         '{"quote": "You were never a challenge."}'),
    (s_id, 9,  '150 Points',          'points',       'free',    'Solid reward',               '{"amount": 150}'),
    (s_id, 10, 'Dragon Aura',         'aura',         'free',    'Golden dragon glow',         '{"color": "#ffd740"}'),
    (s_id, 11, '250 Points',          'points',       'premium', 'Premium stash',              '{"amount": 250}'),
    (s_id, 12, 'Legend Border',        'flair_border', 'free',   'Legendary profile border',   '{"border": "legend"}'),
    (s_id, 13, 'Apex Predator Title',  'flair_title', 'premium', 'Rare title',                '{"title": "Apex Predator"}'),
    (s_id, 14, '300 Points',          'points',       'free',    'Big drop',                   '{"amount": 300}'),
    (s_id, 15, 'Hype Bomb',           'hype_bomb',    'premium', 'Screen-shake celebration',   '{}'),
    (s_id, 16, 'Ultra Instinct Aura', 'aura',         'free',    'Silver UI glow',             '{"color": "#c0c0c0"}'),
    (s_id, 17, '500 Points',          'points',       'premium', 'Massive premium drop',       '{"amount": 500}'),
    (s_id, 18, 'Season 1 Badge',      'badge',        'free',    'Exclusive S1 badge',         '{"icon": "🏆", "exclusive": true}'),
    (s_id, 19, 'Kings Commentary',    'kings_commentary','premium','Gold trash talk effect',   '{}'),
    (s_id, 20, 'Season Champion',     'flair_title',  'free',    'The ultimate S1 title',      '{"title": "Season 1 Champion", "exclusive": true}');
END $$;
