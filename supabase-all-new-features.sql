-- ============================================================
-- DBL TOURNAMENTS — ALL NEW FEATURE TABLES
-- Run this entire script in Supabase SQL Editor (one go)
-- ============================================================

-- ==================== SITE SETTINGS ====================
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated can upsert settings" ON site_settings FOR ALL USING (true);

-- ==================== DAILY LOGIN REWARDS ====================
CREATE TABLE IF NOT EXISTS daily_logins (
  discord_username text PRIMARY KEY,
  last_login date NOT NULL DEFAULT CURRENT_DATE,
  streak int NOT NULL DEFAULT 0,
  total_logins int NOT NULL DEFAULT 0
);
ALTER TABLE daily_logins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to daily_logins" ON daily_logins FOR ALL USING (true) WITH CHECK (true);

-- ==================== PLAYER TITLES ====================
CREATE TABLE IF NOT EXISTS player_titles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_username text NOT NULL,
  title_id text NOT NULL,
  equipped boolean DEFAULT false,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(discord_username, title_id)
);
ALTER TABLE player_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_titles_read" ON player_titles FOR SELECT USING (true);
CREATE POLICY "player_titles_insert" ON player_titles FOR INSERT WITH CHECK (true);
CREATE POLICY "player_titles_update" ON player_titles FOR UPDATE USING (true);

-- ==================== AUCTION HOUSE ====================
CREATE TABLE IF NOT EXISTS auction_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller text NOT NULL,
  inventory_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_name text NOT NULL,
  item_type text NOT NULL,
  starting_price int NOT NULL DEFAULT 100,
  buy_now_price int,
  current_bid int DEFAULT 0,
  current_bidder text,
  bid_count int DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auction_bids (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES auction_listings(id),
  bidder text NOT NULL,
  amount int NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE auction_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view listings" ON auction_listings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create listings" ON auction_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update listings" ON auction_listings FOR UPDATE USING (true);
CREATE POLICY "Anyone can view bids" ON auction_bids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can place bids" ON auction_bids FOR INSERT WITH CHECK (true);

-- ==================== DRAFT MODE ====================
CREATE TABLE IF NOT EXISTS draft_picks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL,
  discord_username text NOT NULL,
  character_id text NOT NULL,
  pick_number int NOT NULL,
  round int NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_draft_picks_tournament ON draft_picks(tournament_id);

-- Add draft columns to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS format text DEFAULT 'standard';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS draft_order text DEFAULT 'random';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS draft_picks_per_player int DEFAULT 3;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS draft_time_per_pick int DEFAULT 60;

-- ==================== BETTING SYSTEM ====================
CREATE TABLE IF NOT EXISTS bets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL,
  tournament_id uuid NOT NULL,
  bettor text NOT NULL,
  bet_on text NOT NULL,
  amount int NOT NULL CHECK (amount >= 50),
  odds numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  payout int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bets_unique_bettor_match ON bets (bettor, match_id);
CREATE INDEX IF NOT EXISTS bets_match_id_idx ON bets (match_id);
CREATE INDEX IF NOT EXISTS bets_bettor_idx ON bets (bettor);
CREATE INDEX IF NOT EXISTS bets_tournament_id_idx ON bets (tournament_id);
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bets_select" ON bets FOR SELECT USING (true);
CREATE POLICY "bets_insert" ON bets FOR INSERT WITH CHECK (true);
CREATE POLICY "bets_update" ON bets FOR UPDATE USING (true);

-- ==================== MVP VOTES ====================
CREATE TABLE IF NOT EXISTS mvp_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id uuid NOT NULL,
  voter text NOT NULL,
  category text NOT NULL CHECK (category IN ('mvp', 'most_improved', 'best_newcomer', 'clutch_king', 'fan_favourite')),
  nominee text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(season_id, voter, category)
);
ALTER TABLE mvp_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON mvp_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert votes" ON mvp_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own votes" ON mvp_votes FOR UPDATE USING (true);

-- ==================== CLAN SYSTEM ====================
CREATE TABLE IF NOT EXISTS clans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  tag text NOT NULL UNIQUE CHECK (char_length(tag) <= 5),
  leader text NOT NULL,
  description text,
  logo_emoji text DEFAULT '⚔️',
  color text DEFAULT '#00e5ff',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS clan_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  discord_username text NOT NULL UNIQUE,
  role text DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
  joined_at timestamptz DEFAULT now(),
  contract_until timestamptz,
  season_id uuid
);
CREATE TABLE IF NOT EXISTS clan_wars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clan1_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  clan2_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  clan1_wins int DEFAULT 0,
  clan2_wins int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clan1_id, clan2_id)
);
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_wars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clans_read" ON clans FOR SELECT USING (true);
CREATE POLICY "clans_insert" ON clans FOR INSERT WITH CHECK (true);
CREATE POLICY "clans_update" ON clans FOR UPDATE USING (true);
CREATE POLICY "clans_delete" ON clans FOR DELETE USING (true);
CREATE POLICY "clan_members_read" ON clan_members FOR SELECT USING (true);
CREATE POLICY "clan_members_insert" ON clan_members FOR INSERT WITH CHECK (true);
CREATE POLICY "clan_members_update" ON clan_members FOR UPDATE USING (true);
CREATE POLICY "clan_members_delete" ON clan_members FOR DELETE USING (true);
CREATE POLICY "clan_wars_read" ON clan_wars FOR SELECT USING (true);
CREATE POLICY "clan_wars_insert" ON clan_wars FOR INSERT WITH CHECK (true);
CREATE POLICY "clan_wars_update" ON clan_wars FOR UPDATE USING (true);

-- ============================================================
-- DONE! All new feature tables created.
-- ============================================================
