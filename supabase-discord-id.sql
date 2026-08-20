-- Add discord_id column to player tables for stable identity matching
ALTER TABLE player_points ADD COLUMN IF NOT EXISTS discord_id text;
ALTER TABLE elo_ratings ADD COLUMN IF NOT EXISTS discord_id text;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS discord_id text;
ALTER TABLE signups ADD COLUMN IF NOT EXISTS discord_id text;

-- Index for fast lookups by discord_id
CREATE INDEX IF NOT EXISTS idx_player_points_discord_id ON player_points(discord_id);
CREATE INDEX IF NOT EXISTS idx_elo_ratings_discord_id ON elo_ratings(discord_id);
CREATE INDEX IF NOT EXISTS idx_bounties_discord_id ON bounties(discord_id);
CREATE INDEX IF NOT EXISTS idx_signups_discord_id ON signups(discord_id);
