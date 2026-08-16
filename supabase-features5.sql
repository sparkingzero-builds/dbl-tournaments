-- Tournament-wide permanent bans
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tournament_bans jsonb DEFAULT '[]'::jsonb;
