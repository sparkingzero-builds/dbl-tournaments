-- MVP Votes table for Season Awards
CREATE TABLE IF NOT EXISTS mvp_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id uuid NOT NULL,
  voter text NOT NULL,
  category text NOT NULL CHECK (category IN ('mvp', 'most_improved', 'best_newcomer', 'clutch_king', 'fan_favourite')),
  nominee text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(season_id, voter, category)
);

-- Enable RLS
ALTER TABLE mvp_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read votes
CREATE POLICY "Anyone can read votes" ON mvp_votes FOR SELECT USING (true);

-- Authenticated users can insert/update their own votes
CREATE POLICY "Users can insert votes" ON mvp_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own votes" ON mvp_votes FOR UPDATE USING (true);
