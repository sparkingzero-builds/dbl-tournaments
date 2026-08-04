-- New Features SQL - Run in Supabase SQL Editor

-- 1. Match Chat table
CREATE TABLE IF NOT EXISTS match_chat (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  username text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE match_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read match chat" ON match_chat FOR SELECT USING (true);
CREATE POLICY "Anyone can send chat" ON match_chat FOR INSERT WITH CHECK (true);

-- Enable realtime for match_chat
ALTER PUBLICATION supabase_realtime ADD TABLE match_chat;

-- 2. ELO Ratings table
CREATE TABLE IF NOT EXISTS elo_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_username text NOT NULL UNIQUE,
  elo int DEFAULT 1000,
  wins int DEFAULT 0,
  losses int DEFAULT 0,
  tournaments_played int DEFAULT 0,
  peak_elo int DEFAULT 1000,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE elo_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read elo" ON elo_ratings FOR SELECT USING (true);
CREATE POLICY "Admin can update elo" ON elo_ratings FOR ALL USING (is_admin());
CREATE POLICY "System insert elo" ON elo_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "System update elo" ON elo_ratings FOR UPDATE USING (true);
