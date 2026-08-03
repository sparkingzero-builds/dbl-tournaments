-- Add countdown-related date columns to the tournaments table
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS signup_deadline TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT NULL;
