-- Free Agency + Salary Cap

-- FREE AGENCY LISTINGS
create table if not exists public.free_agency_listings (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'bidding', 'signed', 'withdrawn')),
  asking_uc_balance integer,
  current_bid_uc integer not null default 0,
  current_bid_team_id uuid references public.teams(id) on delete set null,
  listed_at timestamptz not null default now(),
  expires_at timestamptz,
  signed_at timestamptz,
  signed_team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SALARY CAP CONFIG (league-wide per season)
create table if not exists public.salary_cap_config (
  id uuid primary key default gen_random_uuid(),
  season text not null unique,
  cap_amount integer not null,
  luxury_tax_threshold integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add cap/roster columns to teams
alter table public.teams add column if not exists cap_space integer not null default 0;
alter table public.teams add column if not exists roster_spots integer not null default 0;
-- JSONB for per-player contract values: { "player_id": uc_amount, ... }
alter table public.teams add column if not exists salary_contracts jsonb not null default '{}'::jsonb;

-- RLS
alter table public.free_agency_listings enable row level security;
alter table public.salary_cap_config enable row level security;
alter table public.free_agency_listings force row level security;
alter table public.salary_cap_config force row level security;

create policy "free agency public read"
  on public.free_agency_listings for select to anon, authenticated
  using (true);

create policy "free agency gm bid"
  on public.free_agency_listings for update to authenticated
  using (
    exists (
      select 1 from public.account_profiles ap
      where ap.user_id = (select auth.uid())
        and ap.role = 'gm'
        and ap.gm_team_id = free_agency_listings.current_bid_team_id
    )
    or (select public.is_admin())
  )
  with check (
    exists (
      select 1 from public.account_profiles ap
      where ap.user_id = (select auth.uid())
        and ap.role = 'gm'
        and ap.gm_team_id = free_agency_listings.current_bid_team_id
    )
    or (select public.is_admin())
  );

create policy "free agency admin writes"
  on public.free_agency_listings for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "salary cap config public read"
  on public.salary_cap_config for select to anon, authenticated
  using (true);

create policy "salary cap config admin writes"
  on public.salary_cap_config for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Indexes
create index if not exists idx_free_agency_status on public.free_agency_listings(status);
create index if not exists idx_free_agency_player on public.free_agency_listings(player_id);
create index if not exists idx_salary_cap_season on public.salary_cap_config(season);
