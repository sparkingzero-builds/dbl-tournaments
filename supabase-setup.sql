-- =============================================
-- DBL Tournaments — Supabase Setup
-- Run this in the SQL Editor on your Supabase dashboard
-- =============================================

-- Drop existing tables (order matters for foreign keys)
drop table if exists matches cascade;
drop table if exists signups cascade;
drop table if exists tournaments cascade;
drop table if exists admin_config cascade;
drop function if exists is_admin();
drop function if exists update_updated_at();

-- 1. Tournaments table
create table tournaments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  status text not null default 'signup' check (status in ('signup', 'active', 'completed')),
  max_players int,
  teams_visible boolean default false,
  allowed_characters jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Signups table
create table signups (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade not null,
  discord_username text not null,
  team jsonb,
  seed int,
  created_at timestamptz default now(),
  unique(tournament_id, discord_username)
);

-- 3. Matches table
create table matches (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade not null,
  round int not null,
  match_number int not null,
  player1_id uuid references signups(id) on delete set null,
  player2_id uuid references signups(id) on delete set null,
  winner_id uuid references signups(id) on delete set null,
  score text,
  is_bye boolean default false,
  next_match_id uuid references matches(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. Admin config (stores your secret admin key)
create table admin_config (
  id int primary key default 1 check (id = 1),
  admin_key text not null
);

-- Insert your admin key — change 'your-secret-key-here' to whatever you want
insert into admin_config (admin_key) values ('your-secret-key-here');

-- 5. Row Level Security

-- Enable RLS on all tables
alter table tournaments enable row level security;
alter table signups enable row level security;
alter table matches enable row level security;
alter table admin_config enable row level security;

-- Everyone can READ tournaments, signups, matches
create policy "Public read tournaments" on tournaments for select using (true);
create policy "Public read signups" on signups for select using (true);
create policy "Public read matches" on matches for select using (true);

-- Anyone can sign up (insert into signups)
create policy "Public insert signups" on signups for insert with check (true);

-- Admin-only: write tournaments, delete signups, write matches
-- These use a Postgres function that checks the x-admin-key header

create or replace function is_admin()
returns boolean as $$
begin
  return (
    current_setting('request.headers', true)::json->>'x-admin-key'
    = (select admin_key from admin_config where id = 1)
  );
end;
$$ language plpgsql security definer;

create policy "Admin write tournaments" on tournaments for insert with check (is_admin());
create policy "Admin update tournaments" on tournaments for update using (is_admin());
create policy "Admin delete tournaments" on tournaments for delete using (is_admin());

create policy "Admin delete signups" on signups for delete using (is_admin());
create policy "Admin update signups" on signups for update using (is_admin());

create policy "Admin write matches" on matches for insert with check (is_admin());
create policy "Admin update matches" on matches for update using (is_admin());
create policy "Admin delete matches" on matches for delete using (is_admin());

-- No public access to admin_config
create policy "No public access admin_config" on admin_config for select using (is_admin());

-- 6. Enable Realtime for live updates
alter publication supabase_realtime add table tournaments;
alter publication supabase_realtime add table signups;
alter publication supabase_realtime add table matches;

-- 7. Auto-update updated_at on tournaments
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tournaments_updated_at
  before update on tournaments
  for each row execute function update_updated_at();
