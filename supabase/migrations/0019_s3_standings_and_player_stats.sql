-- S3 season standings columns + player_season_stats table
--
-- 1. Adds statistical columns to the standings table (W, L, GB, L10, PT DIFF, W%)
--    so S3 standings can carry full stat lines rather than just rank + status.
-- 2. Creates player_season_stats for season-level player stat imports from the
--    S3 Google Sheet (67-column format: per-game totals, game highs, game averages).

-- ── Standings columns ──────────────────────────────────────────────────────────

alter table public.standings
  add column if not exists wins integer not null default 0,
  add column if not exists losses integer not null default 0,
  add column if not exists games_back numeric(5,1) not null default 0,
  add column if not exists last10 text,
  add column if not exists pt_diff integer not null default 0,
  add column if not exists win_pct numeric(4,3) not null default 0,
  add column if not exists overall_rank integer;

comment on column public.standings.wins is 'Season wins';
comment on column public.standings.losses is 'Season losses';
comment on column public.standings.games_back is 'Games behind first place';
comment on column public.standings.last10 is 'Last 10 games record (e.g. "8-2")';
comment on column public.standings.pt_diff is 'Point differential';
comment on column public.standings.win_pct is 'Winning percentage';
comment on column public.standings.overall_rank is 'Combined/wild card rank across both conferences';

-- ── Player season stats table ──────────────────────────────────────────────────

create table if not exists public.player_season_stats (
  id uuid primary key default gen_random_uuid(),
  season text not null,
  player_name text not null,
  team_name text,
  position text,
  gp integer,
  min_total integer,
  pts_total integer,
  reb_total integer,
  ast_total integer,
  stl_total integer,
  blk_total integer,
  turnovers_total integer,
  fgm integer,
  fga integer,
  three_ptm integer,
  three_pta integer,
  ftm integer,
  fta integer,
  fg_pct numeric(4,3),
  three_pt_pct numeric(4,3),
  ft_pct numeric(4,3),
  ts_pct numeric(4,3),
  efg_pct numeric(4,3),
  score integer,
  fls integer,
  prf integer,
  dnk integer,
  dd integer,
  td integer,
  twenty_plus_pts integer,
  game_highs jsonb,
  game_averages jsonb,
  created_at timestamptz not null default now(),
  unique(season, player_name)
);

comment on table public.player_season_stats is 'Season-level aggregate player stats from Google Sheets imports';
comment on column public.player_season_stats.game_highs is 'JSON map of per-game max values (MIN, PTS, REB, AST, STL, BLK, PRF)';
comment on column public.player_season_stats.game_averages is 'JSON map of per-game average values (MIN, PTS, REB, AST, STL, BLK, SCORE)';

alter table public.player_season_stats enable row level security;

create policy "Anyone can read player_season_stats"
  on public.player_season_stats for select
  using (true);

grant select on public.player_season_stats to anon, authenticated;
