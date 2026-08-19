-- Draft Picks table for snake-draft tournament format
CREATE TABLE IF NOT EXISTS draft_picks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL,
  discord_username text NOT NULL,
  character_id text NOT NULL,
  pick_number int NOT NULL,
  round int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups by tournament
CREATE INDEX IF NOT EXISTS idx_draft_picks_tournament ON draft_picks(tournament_id);

-- Add draft columns to tournaments table (safe to re-run)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS format text DEFAULT 'standard';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS draft_order text DEFAULT 'random';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS draft_picks_per_player int DEFAULT 3;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS draft_time_per_pick int DEFAULT 60;
