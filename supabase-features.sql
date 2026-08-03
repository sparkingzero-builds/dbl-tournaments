-- =============================================
-- DBL Tournaments — Feature Additions
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Match Reports (players submit their own results)
create table if not exists match_reports (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id) on delete cascade not null,
  reported_by text not null,
  claimed_winner text not null,
  screenshot_url text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz default now()
);

alter table match_reports enable row level security;
create policy "Public read match_reports" on match_reports for select using (true);
create policy "Public insert match_reports" on match_reports for insert with check (true);
create policy "Admin update match_reports" on match_reports for update using (is_admin());
create policy "Admin delete match_reports" on match_reports for delete using (is_admin());

-- 2. Spectators (live viewer tracking)
create table if not exists spectators (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade not null,
  session_id text not null,
  page text not null default 'bracket',
  last_seen timestamptz default now(),
  unique(tournament_id, session_id)
);

alter table spectators enable row level security;
create policy "Public all spectators" on spectators for all using (true);

-- Add realtime for match_reports and spectators
alter publication supabase_realtime add table match_reports;
alter publication supabase_realtime add table spectators;

-- 3. Add theme column to tournaments
alter table tournaments add column if not exists theme text default 'cyberpunk';

-- 4. Add seeding columns
alter table tournaments add column if not exists seeding_mode text default 'random' check (seeding_mode in ('random', 'manual', 'performance'));
alter table signups add column if not exists seed int;
alter table signups add column if not exists elo int default 1000;

-- 5. Add countdown columns
alter table tournaments add column if not exists signup_deadline timestamptz;
alter table tournaments add column if not exists start_time timestamptz;

-- 6. Ban/Pick phase columns
alter table matches add column if not exists bans jsonb;
alter table matches add column if not exists picks_locked boolean default false;
