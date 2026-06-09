-- Draft only. Import rows are staging material, not signed-player truth.

create table if not exists public.roster_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_label text not null,
  source_notes text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  promoted_at timestamptz
);

create table if not exists public.roster_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.roster_import_batches(id) on delete cascade,
  source_row_number integer not null,
  raw_team_name text not null,
  display_team_name text not null,
  matched_team_id uuid references public.teams(id) on delete set null,
  player_name text not null,
  position text not null,
  height_text text not null,
  weight integer,
  discord_handle text not null,
  acquired_label text not null,
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'mapped', 'duplicate', 'promoted', 'ignored')),
  duplicate_of_row_id uuid references public.roster_import_rows(id),
  promoted_player_id uuid references public.players(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (batch_id, source_row_number)
);

create or replace function public.promote_roster_import_row(
  import_row_id uuid,
  target_team_id uuid,
  target_status text,
  target_height_inches integer,
  target_wingspan_inches integer,
  target_archetype text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  imported public.roster_import_rows;
  new_player_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can promote roster import rows';
  end if;

  select * into imported
  from public.roster_import_rows
  where id = import_row_id
  for update;

  if not found then
    raise exception 'Roster import row not found';
  end if;

  if imported.review_status in ('duplicate', 'promoted', 'ignored') then
    raise exception 'Roster import row cannot be promoted from status %', imported.review_status;
  end if;

  if target_status not in ('active', 'two_way', 'minor', 'inactive') then
    raise exception 'Invalid roster status %', target_status;
  end if;

  if target_height_inches < 67 or target_height_inches > 87 then
    raise exception 'Height must be reviewed and converted to legal inches before promotion';
  end if;

  if target_wingspan_inches < target_height_inches - 6 or target_wingspan_inches > target_height_inches + 10 then
    raise exception 'Wingspan must be reviewed before promotion';
  end if;

  insert into public.players (gamertag, primary_position, archetype, height_inches, wingspan_inches, status)
  values (imported.player_name, imported.position, target_archetype, target_height_inches, target_wingspan_inches, 'pending review')
  returning id into new_player_id;

  insert into public.roster_memberships (player_id, team_id, roster_status)
  values (new_player_id, target_team_id, target_status);

  update public.roster_import_rows
  set review_status = 'promoted', promoted_player_id = new_player_id, reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = import_row_id;

  return new_player_id;
end;
$$;

alter table public.roster_import_batches enable row level security;
alter table public.roster_import_rows enable row level security;

create policy "roster import batches admin read"
  on public.roster_import_batches for select
  using (public.is_admin());

create policy "roster import batches admin writes"
  on public.roster_import_batches for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "roster import rows admin read"
  on public.roster_import_rows for select
  using (public.is_admin());

create policy "roster import rows admin writes"
  on public.roster_import_rows for all
  using (public.is_admin())
  with check (public.is_admin());
