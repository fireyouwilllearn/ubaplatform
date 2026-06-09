-- Admin-reviewed promotion path for Google Sheets player imports.
-- The local importer writes raw snapshots and normalized rows into the 0014
-- staging tables. This RPC is the only path that moves one reviewed row into
-- canonical player/roster/hotzone tables, so a dry-run or staging write can
-- never accidentally make sheet data public.

alter table public.sheet_import_player_rows
  add column if not exists wingspan_value integer;

create or replace function public.promote_sheet_import_player_row(player_row_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  import_row public.sheet_import_player_rows%rowtype;
  target_player_id uuid;
  player_slug text;
  badge_names text[];
begin
  if not public.is_admin() then
    raise exception 'Only admins can promote sheet import rows' using errcode = '42501';
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
    raise exception 'Ignored sheet import rows cannot be promoted' using errcode = '23514';
  end if;

  if import_row.validation_errors <> '{}'::text[] then
    raise exception 'Sheet import row has validation errors: %', import_row.validation_errors using errcode = '23514';
  end if;

  if import_row.matched_team_id is null then
    raise exception 'Sheet import row is not matched to a canonical team' using errcode = '23514';
  end if;

  if import_row.primary_position is null then
    raise exception 'Sheet import row is missing a primary position' using errcode = '23514';
  end if;

  if import_row.height_inches is null then
    raise exception 'Sheet import row is missing parsed height' using errcode = '23514';
  end if;

  if import_row.roster_status not in ('active', 'two_way', 'minor', 'inactive') then
    raise exception 'Sheet import row roster status % is not promotable', import_row.roster_status using errcode = '23514';
  end if;

  if import_row.tendency_review_status in ('needs_manual', 'invalid') then
    raise exception 'Sheet import row tendencies still need review: %', import_row.tendency_review_status using errcode = '23514';
  end if;

  player_slug := trim(both '-' from regexp_replace(lower(import_row.player_name), '[^a-z0-9]+', '-', 'g'));
  if player_slug = '' then
    player_slug := 'sheet-player-' || replace(import_row.id::text, '-', '');
  end if;

  select coalesce(array_agg(key order by key), '{}'::text[])
  into badge_names
  from jsonb_each_text(import_row.badges)
  where value in ('bronze', 'silver', 'gold', 'hof', 'legend');

  if import_row.promoted_player_id is not null then
    update public.players
    set gamertag = import_row.player_name,
        slug = player_slug,
        primary_position = import_row.primary_position,
        secondary_positions = import_row.secondary_positions,
        height_inches = import_row.height_inches,
        -- Team sheets currently store a 2K wingspan scale, not inches. Keep the
        -- raw sheet value in staging and use a neutral legal value in canonical
        -- players until that mapping is explicitly defined.
        wingspan_inches = import_row.height_inches,
        status = case when import_row.roster_status = 'inactive' then 'pending review' else 'active' end,
        attributes = import_row.attributes,
        badges = badge_names,
        tendencies = import_row.tendencies,
        updated_at = now()
    where id = import_row.promoted_player_id
    returning id into target_player_id;
  else
    insert into public.players (
      gamertag,
      slug,
      primary_position,
      secondary_positions,
      height_inches,
      wingspan_inches,
      status,
      attributes,
      badges,
      tendencies
    ) values (
      import_row.player_name,
      player_slug,
      import_row.primary_position,
      import_row.secondary_positions,
      import_row.height_inches,
      import_row.height_inches,
      case when import_row.roster_status = 'inactive' then 'pending review' else 'active' end,
      import_row.attributes,
      badge_names,
      import_row.tendencies
    )
    on conflict (slug) do update
    set gamertag = excluded.gamertag,
        primary_position = excluded.primary_position,
        secondary_positions = excluded.secondary_positions,
        height_inches = excluded.height_inches,
        wingspan_inches = excluded.wingspan_inches,
        status = excluded.status,
        attributes = excluded.attributes,
        badges = excluded.badges,
        tendencies = excluded.tendencies,
        updated_at = now()
    returning id into target_player_id;
  end if;

  update public.roster_memberships
  set ends_at = now()
  where player_id = target_player_id
    and ends_at is null;

  insert into public.roster_memberships (player_id, team_id, roster_status)
  values (target_player_id, import_row.matched_team_id, import_row.roster_status);

  delete from public.player_hotzones where player_id = target_player_id;

  insert into public.player_hotzones (player_id, zone, status, updated_by)
  select target_player_id, zone_key, zone_status, auth.uid()
  from jsonb_each_text(import_row.hotzones) as hotzone(zone_key, zone_status)
  where zone_status in ('hot', 'lethal', 'neutral');

  update public.sheet_import_player_rows
  set review_status = 'promoted',
      promoted_player_id = target_player_id,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = player_row_id;

  return target_player_id;
end;
$$;

grant execute on function public.promote_sheet_import_player_row(uuid) to authenticated;
