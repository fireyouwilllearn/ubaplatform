-- Draft only. Depends on 0001_accounts_and_teams.sql.

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  account_user_id uuid references auth.users(id) on delete set null,
  gamertag text not null,
  primary_position text not null check (primary_position in ('PG', 'SG', 'SF', 'PF', 'C')),
  secondary_positions text[] not null default '{}',
  archetype text,
  height_inches integer not null check (height_inches between 67 and 87),
  wingspan_inches integer not null,
  overall integer check (overall between 0 and 99),
  status text not null check (status in ('active', 'injured', 'pending review', 'prospect', 'free_agent')),
  attributes jsonb not null default '{}'::jsonb,
  badges text[] not null default '{}',
  tendencies jsonb not null default '{}'::jsonb,
  animations text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_wingspan_bounds check (wingspan_inches between height_inches - 6 and height_inches + 10),
  constraint players_secondary_positions_check check (secondary_positions <@ array['PG','SG','SF','PF','C']::text[])
);

alter table public.account_profiles
  add constraint account_profiles_player_fk foreign key (player_id) references public.players(id);

create table if not exists public.roster_memberships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete restrict,
  roster_status text not null check (roster_status in ('active', 'two_way', 'minor', 'inactive', 'released')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint roster_memberships_date_check check (ends_at is null or ends_at > starts_at)
);

create unique index if not exists roster_memberships_one_active_team
  on public.roster_memberships (player_id)
  where ends_at is null;

create table if not exists public.player_hotzones (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  zone text not null check (zone in (
    'under_basket', 'close_left', 'close_middle', 'close_right',
    'mid_range_left', 'mid_range_left_center', 'mid_range_center', 'mid_range_right_center', 'mid_range_right',
    'three_left', 'three_left_center', 'three_center', 'three_right_center', 'three_right'
  )),
  status text not null check (status in ('hot', 'lethal', 'neutral')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (player_id, zone)
);

create table if not exists public.standings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  season text not null,
  conference text not null check (conference in ('East', 'West')),
  conference_rank integer not null check (conference_rank > 0),
  status text not null check (status in ('clinched', 'eliminated', 'in contention')),
  updated_at timestamptz not null default now(),
  unique (season, team_id),
  unique (season, conference, conference_rank)
);

alter table public.players enable row level security;
alter table public.roster_memberships enable row level security;
alter table public.player_hotzones enable row level security;
alter table public.standings enable row level security;

create policy "players public limited read"
  on public.players for select
  using (true);

create policy "players admin writes only"
  on public.players for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "rosters public read"
  on public.roster_memberships for select
  using (true);

create policy "rosters admin writes only"
  on public.roster_memberships for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "hotzones public read"
  on public.player_hotzones for select
  using (true);

create policy "hotzones admin writes only"
  on public.player_hotzones for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "standings public read"
  on public.standings for select
  using (true);

create policy "standings admin writes only"
  on public.standings for all
  using (public.is_admin())
  with check (public.is_admin());
