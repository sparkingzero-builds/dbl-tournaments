CREATE TABLE IF NOT EXISTS player_titles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_username text NOT NULL,
  title_id text NOT NULL,
  equipped boolean DEFAULT false,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(discord_username, title_id)
);
