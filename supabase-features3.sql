-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  predicted_winner_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id, session_id)
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert predictions" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own predictions" ON predictions FOR UPDATE USING (true) WITH CHECK (true);

-- Match deadline column on tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS match_deadline timestamptz;
