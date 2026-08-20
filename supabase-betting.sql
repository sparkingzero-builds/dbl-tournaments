-- Betting system table
CREATE TABLE IF NOT EXISTS bets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL,
  tournament_id uuid NOT NULL,
  bettor text NOT NULL,
  bet_on text NOT NULL,
  amount int NOT NULL CHECK (amount >= 50),
  odds numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  payout int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- One bet per user per match
CREATE UNIQUE INDEX IF NOT EXISTS bets_unique_bettor_match ON bets (bettor, match_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS bets_match_id_idx ON bets (match_id);
CREATE INDEX IF NOT EXISTS bets_bettor_idx ON bets (bettor);
CREATE INDEX IF NOT EXISTS bets_tournament_id_idx ON bets (tournament_id);

-- Enable RLS
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Allow all reads
CREATE POLICY "bets_select" ON bets FOR SELECT USING (true);

-- Allow inserts from authenticated users
CREATE POLICY "bets_insert" ON bets FOR INSERT WITH CHECK (true);

-- Allow updates (for bet resolution)
CREATE POLICY "bets_update" ON bets FOR UPDATE USING (true);
