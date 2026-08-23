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
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season_id, discord_username)
);

-- Season challenges (admin-defined per season)
CREATE TABLE IF NOT EXISTS season_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
  xp_reward INTEGER NOT NULL DEFAULT 0,
  goal INTEGER NOT NULL DEFAULT 1,
  track_stat TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Player challenge progress
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES season_challenges(id) ON DELETE CASCADE,
  discord_username TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  period TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, discord_username, period)
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
ALTER TABLE season_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_wars ENABLE ROW LEVEL SECURITY;

-- Read access for all
CREATE POLICY "seasons_read" ON seasons FOR SELECT USING (true);
CREATE POLICY "season_rewards_read" ON season_rewards FOR SELECT USING (true);
CREATE POLICY "season_progress_read" ON season_progress FOR SELECT USING (true);
CREATE POLICY "season_challenges_read" ON season_challenges FOR SELECT USING (true);
CREATE POLICY "challenge_progress_read" ON challenge_progress FOR SELECT USING (true);
CREATE POLICY "clan_wars_read" ON clan_wars FOR SELECT USING (true);

-- Write access for all (anon key, admin gated in app)
CREATE POLICY "seasons_write" ON seasons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "season_rewards_write" ON season_rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "season_progress_write" ON season_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "season_challenges_write" ON season_challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "challenge_progress_write" ON challenge_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "clan_wars_write" ON clan_wars FOR ALL USING (true) WITH CHECK (true);

-- If season_progress already exists but is missing is_premium column:
-- ALTER TABLE season_progress ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

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

  -- Seed default challenges for Season 1
  INSERT INTO season_challenges (season_id, name, description, type, xp_reward, goal, track_stat) VALUES
    (s_id, 'Daily Check-In',      'Log into the season pass',          'daily',  5,   1,   'login'),
    (s_id, 'Bounty Hunter',       'Win 2 bounty matches today',        'daily',  50,  2,   'bounty_wins'),
    (s_id, 'Tournament Fighter',  'Complete a tournament match',       'daily',  30,  1,   'matches'),
    (s_id, 'Explorer',            'Visit 5 different pages',           'daily',  10,  5,   'visits'),
    (s_id, 'Bounty Veteran',      'Win 10 bounty matches this week',   'weekly', 200, 10,  'bounty_wins'),
    (s_id, 'Arena Regular',       'Complete 5 tournament matches',     'weekly', 150, 5,   'matches'),
    (s_id, 'Reward Collector',    'Claim 3 season rewards',            'weekly', 100, 3,   'claims'),
    (s_id, 'XP Grinder',          'Earn 500 total XP this week',       'weekly', 250, 500, 'xp');
END $$;
