-- Blacklist table
CREATE TABLE IF NOT EXISTS blacklist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_username text UNIQUE NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read blacklist" ON blacklist FOR SELECT USING (true);
CREATE POLICY "Admins can manage blacklist" ON blacklist FOR ALL USING (is_admin());
