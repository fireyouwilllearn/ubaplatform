-- Bank-to-UC-Ledger promotion for Google Sheets import.
--
-- The importer writes raw bank data into sheet_import_player_rows.bank
-- as JSONB. This migration adds promotion columns and an RPC that
-- translates each non-derived bank field into a uc_ledger_events row,
-- so that staged financial data lands in the append-only ledger.
--
-- Derived fields (Total UC, Total Spent) are skipped — they are
-- computed totals that would double-count real entries.

alter table public.sheet_import_player_rows
  add column if not exists bank_promoted_at timestamptz,
  add column if not exists bank_promoted_by uuid references auth.users;

create or replace function public.promote_bank_to_uc_ledger(p_player_row_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  import_row public.sheet_import_player_rows%rowtype;
  bank_data jsonb;
  field_name text;
  field_value bigint;
  event_type text;
  event_reason text;
  target_player_id uuid;
  results jsonb[];
  created_count int := 0;
  skipped_count int := 0;
begin
  if not public.is_admin() then
    raise exception 'Only admins can promote bank data to UC ledger' using errcode = '42501';
  end if;

  select *
  into import_row
  from public.sheet_import_player_rows
  where id = p_player_row_id
  for update;

  if not found then
    raise exception 'Sheet import player row % was not found', p_player_row_id using errcode = 'P0002';
  end if;

  if import_row.promoted_player_id is null then
    raise exception 'Player must be promoted before bank data can be committed to the ledger' using errcode = '23514';
  end if;

  if import_row.bank_promoted_at is not null then
    raise exception 'Bank data for this row was already promoted at %', import_row.bank_promoted_at using errcode = '23514';
  end if;

  bank_data := import_row.bank;
  target_player_id := import_row.promoted_player_id;

  if bank_data is null or bank_data = '{}'::jsonb then
    raise exception 'No bank data found in sheet import row %', p_player_row_id using errcode = 'P0002';
  end if;

  for field_name, field_value in
    select key, (value#>>'{}')::bigint
    from jsonb_each(bank_data)
    where jsonb_typeof(value) = 'number'
      and key not in ('Total UC', 'Total Spent')
  loop

    if field_value = 0 then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    event_type := case
      when field_name in ('Weekly check in', 'Stream Check in', 'Point Tasks', 'Pro Contract', 'Signing Bonus', 'Pro Incentives', 'UC carried over') then 'grant'
      when field_name in ('Fines', 'Upgrade Purchases') then 'spend'
      else 'grant'
    end;

    event_reason := 'Bank sheet: ' || field_name;

    insert into public.uc_ledger_events (
      player_id,
      event_type,
      amount,
      reason,
      requested_by,
      approved_by,
      source_ref
    ) values (
      target_player_id,
      event_type,
      case when event_type = 'spend' then -abs(field_value) else abs(field_value) end,
      event_reason,
      auth.uid(),
      auth.uid(),
      'sheet-import-row:' || p_player_row_id
    );

    created_count := created_count + 1;
  end loop;

  update public.sheet_import_player_rows
  set bank_promoted_at = now(),
      bank_promoted_by = auth.uid()
  where id = p_player_row_id;

  return jsonb_build_object(
    'created', created_count,
    'skipped', skipped_count,
    'player_id', target_player_id
  );
end;
$$;

grant execute on function public.promote_bank_to_uc_ledger(uuid) to authenticated;
