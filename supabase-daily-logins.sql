-- Daily Login Rewards tracking table
CREATE TABLE IF NOT EXISTS daily_logins (
  discord_username text PRIMARY KEY,
  last_login date NOT NULL DEFAULT CURRENT_DATE,
  streak int NOT NULL DEFAULT 0,
  total_logins int NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE daily_logins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated reads/writes (matches other tables' pattern)
CREATE POLICY "Allow all access to daily_logins" ON daily_logins
  FOR ALL USING (true) WITH CHECK (true);
