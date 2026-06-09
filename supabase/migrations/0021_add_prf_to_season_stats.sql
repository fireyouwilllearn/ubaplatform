-- Add missing prf column to player_season_stats
alter table public.player_season_stats add column if not exists prf integer;
