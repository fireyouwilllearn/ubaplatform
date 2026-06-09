-- Sheet import readiness: canonical team coverage plus manual tendency review.
--
-- The pro sheet registry includes Los Angeles Royals and Derby City Stingers.
-- They need canonical team rows before their staged players can be promoted,
-- because the promotion RPC intentionally refuses unmatched team sources.
--
-- This migration also adds the admin-only tendency review RPC used by the
-- Import Review page. Manual tendency placeholders such as "Rex's Tends" stay
-- blocked until an admin supplies exactly 99 reviewed 0-100 values.

insert into public.teams (slug, name, short_name, market, league, conference, primary_color)
values
  ('los-angeles-royals', 'Los Angeles Royals', 'LAR', 'Los Angeles', 'UBA', 'West', '#7c3aed'),
  ('derby-city-stingers', 'Derby City Stingers', 'DCS', 'Derby City', 'UBA', 'East', '#f59e0b')
on conflict (slug) do update
set name = excluded.name,
    short_name = excluded.short_name,
    market = excluded.market,
    league = excluded.league,
    conference = excluded.conference,
    primary_color = excluded.primary_color,
    updated_at = now();

insert into public.team_affiliates (nxt_team_id, uba_team_id, affiliate_location)
select nxt.id, uba.id, aff.affiliate_location
from (values
  ('fresno-herd', 'los-angeles-royals', 'Los Angeles'),
  ('memphis-blues', 'derby-city-stingers', 'Derby City')
) as aff(nxt_slug, uba_slug, affiliate_location)
join public.teams nxt on nxt.slug = aff.nxt_slug
join public.teams uba on uba.slug = aff.uba_slug
on conflict (nxt_team_id, affiliate_location) do update
set uba_team_id = excluded.uba_team_id;

create or replace function public.set_sheet_import_player_tendencies(
  player_row_id uuid,
  reviewed_tendencies jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  import_row public.sheet_import_player_rows%rowtype;
  tendency_count integer;
  invalid_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review sheet import tendencies' using errcode = '42501';
  end if;

  select *
  into import_row
  from public.sheet_import_player_rows
  where id = player_row_id
  for update;

  if not found then
    raise exception 'Sheet import player row % was not found', player_row_id using errcode = 'P0002';
  end if;

  if import_row.review_status = 'ignored' then
    raise exception 'Ignored sheet import rows cannot be updated' using errcode = '23514';
  end if;

  if import_row.review_status = 'promoted' then
    raise exception 'Promoted sheet import rows cannot be updated' using errcode = '23514';
  end if;

  if jsonb_typeof(reviewed_tendencies) <> 'object' then
    raise exception 'Reviewed tendencies must be a JSON object' using errcode = '23514';
  end if;

  select count(*)
  into tendency_count
  from jsonb_each(reviewed_tendencies);

  select count(*)
  into invalid_count
  from jsonb_each(reviewed_tendencies) as tendency(key, value)
  where case
    when jsonb_typeof(value) <> 'number' then true
    else (value #>> '{}')::numeric % 1 <> 0
      or (value #>> '{}')::integer < 0
      or (value #>> '{}')::integer > 100
  end;

  if tendency_count <> 99 then
    raise exception 'Reviewed tendencies must include exactly 99 values, received %', tendency_count using errcode = '23514';
  end if;

  if invalid_count > 0 then
    raise exception 'Reviewed tendencies must be integer values from 0 to 100' using errcode = '23514';
  end if;

  update public.sheet_import_player_rows
  set tendencies = reviewed_tendencies,
      tendency_review_status = 'complete',
      tendency_source_label = null,
      validation_errors = array_remove(array_remove(validation_errors, 'manual_tendencies_required'), 'invalid_tendencies'),
      review_status = case when review_status = 'conflict' then 'needs_review' else review_status end,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = player_row_id;

  return player_row_id;
end;
$$;

grant execute on function public.set_sheet_import_player_tendencies(uuid, jsonb) to authenticated;
