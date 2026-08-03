-- Ban Phase Setup
-- Run this in Supabase SQL Editor

-- 1. Add 'banning' to tournament status constraint
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check
  CHECK (status IN ('draft', 'signup', 'banning', 'active', 'completed'));

-- 2. Add ban_count to tournaments (how many chars each player can ban)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS ban_count int DEFAULT 3;

-- 3. Add bans column to signups (stores array of banned character IDs)
ALTER TABLE signups ADD COLUMN IF NOT EXISTS bans jsonb DEFAULT '[]'::jsonb;
