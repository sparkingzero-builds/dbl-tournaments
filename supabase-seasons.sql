-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  theme text DEFAULT 'default',
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  total_tiers int DEFAULT 20,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Season rewards (what's available at each tier)
CREATE TABLE IF NOT EXISTS season_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
  tier int NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL, -- 'points', 'flair_border', 'flair_title', 'badge', 'ban_immunity', 'profile_bg'
  track text DEFAULT 'free' CHECK (track IN ('free', 'premium')),
  premium_cost int DEFAULT 0, -- points cost to claim premium rewards
  metadata jsonb DEFAULT '{}'::jsonb, -- e.g. {effect: "flair-fire", amount: 50}
  created_at timestamptz DEFAULT now(),
  UNIQUE(season_id, tier)
);

-- Player season progress
CREATE TABLE IF NOT EXISTS season_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
  discord_username text NOT NULL,
  xp int DEFAULT 0,
  claimed_tiers jsonb DEFAULT '[]'::jsonb, -- array of tier numbers claimed
  created_at timestamptz DEFAULT now(),
  UNIQUE(season_id, discord_username)
);

-- RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Admins manage seasons" ON seasons FOR ALL USING (is_admin());

ALTER TABLE season_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read season rewards" ON season_rewards FOR SELECT USING (true);
CREATE POLICY "Admins manage season rewards" ON season_rewards FOR ALL USING (is_admin());

ALTER TABLE season_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read season progress" ON season_progress FOR SELECT USING (true);
CREATE POLICY "Admins manage season progress" ON season_progress FOR ALL USING (is_admin());
