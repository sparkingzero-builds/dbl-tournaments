-- Win Streak tracking
ALTER TABLE player_points ADD COLUMN IF NOT EXISTS current_streak int DEFAULT 0;
ALTER TABLE player_points ADD COLUMN IF NOT EXISTS best_streak int DEFAULT 0;
