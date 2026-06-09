-- Games & Schedule + Injuries

-- GAMES
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid not null references public.teams(id) on delete restrict,
  away_team_id uuid not null references public.teams(id) on delete restrict,
  scheduled_at timestamptz not null,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'final', 'postponed', 'cancelled')),
  week integer,
  season text not null,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_diff_teams check (home_team_id <> away_team_id)
);

-- INJURIES
create table if not exists public.injuries (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  injury_type text not null,
  severity text not null check (severity in ('day-to-day', 'questionable', 'out', 'season-ending')),
  body_part text not null,
  description text,
  injured_at timestamptz not null default now(),
  expected_return timestamptz,
  recovered_at timestamptz,
  status text not null default 'active' check (status in ('active', 'recovered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.games enable row level security;
alter table public.injuries enable row level security;
alter table public.games force row level security;
alter table public.injuries force row level security;

create policy "games public read"
  on public.games for select to anon, authenticated
  using (true);

create policy "games admin writes"
  on public.games for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "injuries public read"
  on public.injuries for select to anon, authenticated
  using (true);

create policy "injuries admin writes"
  on public.injuries for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Indexes
create index if not exists idx_games_season on public.games(season);
create index if not exists idx_games_team on public.games(home_team_id);
create index if not exists idx_games_away_team on public.games(away_team_id);
create index if not exists idx_games_status on public.games(status);
create index if not exists idx_injuries_player on public.injuries(player_id);
create index if not exists idx_injuries_status on public.injuries(status);
