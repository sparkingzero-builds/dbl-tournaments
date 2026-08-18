-- ============================================
-- ENGAGEMENT FEATURES: Points, Shop, Trash Talk, Power Rankings, Tier List, Hype Meter
-- ============================================

-- 1. Points System
CREATE TABLE IF NOT EXISTS player_points (
  discord_username text PRIMARY KEY,
  balance int DEFAULT 0,
  lifetime_earned int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_username text NOT NULL,
  amount int NOT NULL,
  reason text NOT NULL,
  reference_id text,
  created_at timestamptz DEFAULT now()
);

-- 2. Shop
CREATE TABLE IF NOT EXISTS shop_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  name text NOT NULL,
  description text,
  cost int NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_username text NOT NULL,
  item_id uuid REFERENCES shop_items(id) ON DELETE CASCADE,
  equipped boolean DEFAULT false,
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(discord_username, item_id)
);

-- 3. Trash Talk
CREATE TABLE IF NOT EXISTS trash_talk (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  username text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trash_talk_tournament ON trash_talk(tournament_id, created_at);

-- 4. Power Rankings Votes
CREATE TABLE IF NOT EXISTS power_rankings_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  round int NOT NULL,
  voter_session text NOT NULL,
  voted_for text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, round, voter_session)
);

-- 5. Character Tier Votes
CREATE TABLE IF NOT EXISTS character_tier_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id text NOT NULL,
  tier text NOT NULL,
  voter_session text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(character_id, voter_session)
);

-- 6. Match Hype
CREATE TABLE IF NOT EXISTS match_hype (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  hype_count int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id, session_id)
);

-- ============================================
-- RLS Policies
-- ============================================

-- Player Points
ALTER TABLE player_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read points" ON player_points FOR SELECT USING (true);
CREATE POLICY "Admins manage points" ON player_points FOR ALL USING (is_admin());

-- Point Transactions
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read transactions" ON point_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert transactions" ON point_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage transactions" ON point_transactions FOR ALL USING (is_admin());

-- Shop Items
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shop" ON shop_items FOR SELECT USING (true);
CREATE POLICY "Admins manage shop" ON shop_items FOR ALL USING (is_admin());

-- Player Inventory
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read inventory" ON player_inventory FOR SELECT USING (true);
CREATE POLICY "Admins manage inventory" ON player_inventory FOR ALL USING (is_admin());

-- Trash Talk
ALTER TABLE trash_talk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read trash talk" ON trash_talk FOR SELECT USING (true);
CREATE POLICY "Anyone can post trash talk" ON trash_talk FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage trash talk" ON trash_talk FOR DELETE USING (is_admin());

-- Power Rankings
ALTER TABLE power_rankings_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read power rankings" ON power_rankings_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can vote power rankings" ON power_rankings_votes FOR INSERT WITH CHECK (true);

-- Tier Votes
ALTER TABLE character_tier_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tier votes" ON character_tier_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can vote tiers" ON character_tier_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tier votes" ON character_tier_votes FOR UPDATE USING (true);

-- Match Hype
ALTER TABLE match_hype ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hype" ON match_hype FOR SELECT USING (true);
CREATE POLICY "Anyone can hype" ON match_hype FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update hype" ON match_hype FOR UPDATE USING (true);

-- Enable Realtime on trash talk
ALTER PUBLICATION supabase_realtime ADD TABLE trash_talk;
