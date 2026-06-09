-- Draft only. Do not apply until Supabase project settings, Discord Auth, and RLS review are confirmed.

create table if not exists public.account_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'gm', 'player')),
  player_id uuid,
  gm_team_id uuid,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_profiles_role_link_check check (
    (role = 'player' and player_id is not null and gm_team_id is null)
    or (role = 'gm' and player_id is null and gm_team_id is not null)
    or (role = 'admin' and player_id is null)
  )
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text not null,
  market text,
  league text not null check (league in ('UBA', 'NXT')),
  conference text check (conference in ('East', 'West')),
  primary_color text not null,
  logo_url text,
  jersey_home_url text,
  jersey_away_url text,
  jersey_alternate_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_uba_conference_check check (
    (league = 'UBA' and conference is not null)
    or (league = 'NXT' and conference is null)
  )
);

alter table public.account_profiles
  add constraint account_profiles_gm_team_fk foreign key (gm_team_id) references public.teams(id);

create table if not exists public.team_affiliates (
  id uuid primary key default gen_random_uuid(),
  nxt_team_id uuid not null references public.teams(id) on delete cascade,
  uba_team_id uuid references public.teams(id) on delete restrict,
  affiliate_location text not null,
  created_at timestamptz not null default now(),
  unique (nxt_team_id, affiliate_location)
);

create or replace function public.current_account_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.account_profiles where user_id = (select auth.uid())
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_account_role() = 'admin', false)
$$;

create or replace function public.is_team_gm(team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.account_profiles
    where user_id = (select auth.uid())
      and role = 'gm'
      and gm_team_id = team_id
  )
$$;

alter table public.account_profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_affiliates enable row level security;

create policy "account profiles read own or admin"
  on public.account_profiles for select
  using (user_id = (select auth.uid()) or public.is_admin());

-- Profile role/team/player links are authority fields. User-editable display names
-- should go through a narrow function later so clients cannot rewrite account scope.
create policy "account profiles admin writes only"
  on public.account_profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "teams are publicly readable"
  on public.teams for select
  using (true);

create policy "teams admin writes only"
  on public.teams for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "team affiliates are publicly readable"
  on public.team_affiliates for select
  using (true);

create policy "team affiliates admin writes only"
  on public.team_affiliates for all
  using (public.is_admin())
  with check (public.is_admin());
