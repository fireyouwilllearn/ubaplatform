-- Add tier column to player_season_stats for UBA/NXT league distinction
alter table public.player_season_stats 
  add column if not exists tier text not null default 'UBA';

comment on column public.player_season_stats.tier is 'League tier: UBA or NXT';

-- Ensure unique constraint covers tier so a player can exist in both leagues
alter table public.player_season_stats 
  drop constraint if exists player_season_stats_season_player_name_key;

alter table public.player_season_stats 
  add constraint player_season_stats_season_tier_player_name_key 
  unique (season, tier, player_name);
