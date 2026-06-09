-- Full team-sheet importer staging.
-- These tables are deliberately separate from canonical player tables. The
-- Google Sheets importer should always land raw snapshots and normalized rows
-- here first, then an admin review workflow can promote approved records into
-- players, roster_memberships, player_hotzones, uc_ledger_events, and related
-- canonical tables.

create table if not exists public.team_sheet_sources (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete set null,
  spreadsheet_id text not null unique,
  spreadsheet_title text not null,
  source_status text not null default 'active' check (source_status in ('active', 'paused', 'nxt_deferred', 'archived')),
  tabs jsonb not null default '{"players":"Players","bank":"Bank","attributes":"Attributes","badges":"Badges","tendencies":"Tendencies","misc":"Misc."}'::jsonb,
  notes text,
  last_import_run_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sheet_import_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.team_sheet_sources(id) on delete cascade,
  run_status text not null default 'queued' check (run_status in ('queued', 'running', 'succeeded', 'failed', 'needs_review', 'applied')),
  trigger_source text not null default 'manual' check (trigger_source in ('manual', 'scheduled', 'mcp_probe', 'backfill')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  error_message text,
  imported_by uuid references auth.users(id)
);

alter table public.team_sheet_sources
  add constraint team_sheet_sources_last_run_fk
  foreign key (last_import_run_id) references public.sheet_import_runs(id) on delete set null;

create table if not exists public.sheet_import_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.sheet_import_runs(id) on delete cascade,
  tab_key text not null check (tab_key in ('players', 'bank', 'attributes', 'badges', 'tendencies', 'misc')),
  tab_name text not null,
  range_a1 text,
  row_count integer not null default 0 check (row_count >= 0),
  raw_values jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, tab_key)
);

create table if not exists public.sheet_import_player_rows (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.sheet_import_runs(id) on delete cascade,
  source_id uuid not null references public.team_sheet_sources(id) on delete cascade,
  matched_team_id uuid references public.teams(id) on delete set null,
  source_row_key text not null,
  source_row_numbers jsonb not null default '{}'::jsonb,
  player_name text not null,
  discord_handle text,
  primary_position text,
  secondary_positions text[] not null default '{}',
  height_text text,
  height_inches integer,
  weight integer,
  drafted_or_free_agent text,
  season_joined text,
  two_way_ubanxt_label text,
  roster_status text not null default 'needs_review' check (roster_status in ('needs_review', 'active', 'two_way', 'minor', 'inactive')),
  attributes jsonb not null default '{}'::jsonb,
  badges jsonb not null default '{}'::jsonb,
  tendencies jsonb not null default '{}'::jsonb,
  tendency_review_status text not null default 'empty' check (tendency_review_status in ('complete', 'empty', 'needs_manual', 'invalid')),
  tendency_source_label text,
  hotzones jsonb not null default '{}'::jsonb,
  bank jsonb not null default '{}'::jsonb,
  validation_errors text[] not null default '{}',
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'valid', 'conflict', 'ignored', 'promoted')),
  promoted_player_id uuid references public.players(id) on delete set null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  unique (run_id, source_row_key)
);

create table if not exists public.sheet_import_conflicts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.sheet_import_runs(id) on delete cascade,
  player_row_id uuid references public.sheet_import_player_rows(id) on delete cascade,
  conflict_type text not null check (conflict_type in ('duplicate_name', 'duplicate_discord', 'team_mismatch', 'invalid_position', 'invalid_height', 'invalid_tendencies', 'bank_mismatch', 'unknown')),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'blocking')),
  message text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  resolution_notes text,
  created_at timestamptz not null default now()
);

create index if not exists team_sheet_sources_team_id_idx on public.team_sheet_sources(team_id);
create index if not exists sheet_import_runs_source_id_started_idx on public.sheet_import_runs(source_id, started_at desc);
create index if not exists sheet_import_player_rows_run_id_idx on public.sheet_import_player_rows(run_id);
create index if not exists sheet_import_player_rows_source_id_idx on public.sheet_import_player_rows(source_id);
create index if not exists sheet_import_player_rows_review_status_idx on public.sheet_import_player_rows(review_status);
create index if not exists sheet_import_conflicts_run_id_idx on public.sheet_import_conflicts(run_id);

alter table public.team_sheet_sources enable row level security;
alter table public.sheet_import_runs enable row level security;
alter table public.sheet_import_snapshots enable row level security;
alter table public.sheet_import_player_rows enable row level security;
alter table public.sheet_import_conflicts enable row level security;

create policy "team sheet sources admin read"
  on public.team_sheet_sources for select
  using (public.is_admin());

create policy "team sheet sources admin writes"
  on public.team_sheet_sources for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "sheet import runs admin read"
  on public.sheet_import_runs for select
  using (public.is_admin());

create policy "sheet import runs admin writes"
  on public.sheet_import_runs for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "sheet import snapshots admin read"
  on public.sheet_import_snapshots for select
  using (public.is_admin());

create policy "sheet import snapshots admin writes"
  on public.sheet_import_snapshots for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "sheet import player rows admin read"
  on public.sheet_import_player_rows for select
  using (public.is_admin());

create policy "sheet import player rows admin writes"
  on public.sheet_import_player_rows for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "sheet import conflicts admin read"
  on public.sheet_import_conflicts for select
  using (public.is_admin());

create policy "sheet import conflicts admin writes"
  on public.sheet_import_conflicts for all
  using (public.is_admin())
  with check (public.is_admin());
