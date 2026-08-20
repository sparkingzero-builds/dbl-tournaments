-- Clan System with Player Contracts
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS clans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  tag text NOT NULL UNIQUE CHECK (char_length(tag) <= 5),
  leader text NOT NULL,
  description text,
  logo_emoji text DEFAULT '⚔️',
  color text DEFAULT '#00e5ff',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clan_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  discord_username text NOT NULL UNIQUE,
  role text DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
  joined_at timestamptz DEFAULT now(),
  contract_until timestamptz,
  season_id uuid
);

CREATE TABLE IF NOT EXISTS clan_wars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clan1_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  clan2_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  clan1_wins int DEFAULT 0,
  clan2_wins int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clan1_id, clan2_id)
);

-- RLS policies
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_wars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clans_read" ON clans FOR SELECT USING (true);
CREATE POLICY "clans_insert" ON clans FOR INSERT WITH CHECK (true);
CREATE POLICY "clans_update" ON clans FOR UPDATE USING (true);
CREATE POLICY "clans_delete" ON clans FOR DELETE USING (true);

CREATE POLICY "clan_members_read" ON clan_members FOR SELECT USING (true);
CREATE POLICY "clan_members_insert" ON clan_members FOR INSERT WITH CHECK (true);
CREATE POLICY "clan_members_update" ON clan_members FOR UPDATE USING (true);
CREATE POLICY "clan_members_delete" ON clan_members FOR DELETE USING (true);

CREATE POLICY "clan_wars_read" ON clan_wars FOR SELECT USING (true);
CREATE POLICY "clan_wars_insert" ON clan_wars FOR INSERT WITH CHECK (true);
CREATE POLICY "clan_wars_update" ON clan_wars FOR UPDATE USING (true);
