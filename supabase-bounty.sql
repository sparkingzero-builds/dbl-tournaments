-- Bounty Hunters tables

CREATE TABLE IF NOT EXISTS bounties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_username text NOT NULL UNIQUE,
  bounty int DEFAULT 0,
  streak int DEFAULT 0,
  wins int DEFAULT 0,
  losses int DEFAULT 0,
  dodges int DEFAULT 0,
  peak_bounty int DEFAULT 0,
  threat_level int DEFAULT 1, -- 1-5 stars
  wanted_for text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active', 'stripped', 'claimed')),
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bounty_challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger text NOT NULL,
  target text NOT NULL,
  winner text,
  bounty_at_stake int DEFAULT 0,
  elo_change int DEFAULT 0,
  currency_reward int DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'expired', 'declined')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- RLS
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read bounties" ON bounties FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bounties" ON bounties FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update bounties" ON bounties FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage bounties" ON bounties FOR ALL USING (is_admin());

ALTER TABLE bounty_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read challenges" ON bounty_challenges FOR SELECT USING (true);
CREATE POLICY "Anyone can insert challenges" ON bounty_challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update challenges" ON bounty_challenges FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage challenges" ON bounty_challenges FOR ALL USING (is_admin());
