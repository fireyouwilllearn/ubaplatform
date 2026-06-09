-- Draft only. UC is append-only; balances are derived from ledger rows.

create table if not exists public.uc_ledger_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  event_type text not null check (event_type in ('grant', 'spend', 'refund', 'admin_adjustment', 'weekly_check_in')),
  amount integer not null,
  reason text not null,
  requested_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  source_ref text,
  created_at timestamptz not null default now(),
  constraint uc_ledger_amount_check check (
    amount <> 0
    or (event_type = 'weekly_check_in' and amount = 0 and approved_by is null)
  )
);

create or replace view public.player_uc_balances as
select player_id, coalesce(sum(amount), 0)::integer as balance
from public.uc_ledger_events
group by player_id;

create or replace function public.request_weekly_check_in(target_player_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_event_id uuid;
begin
  if not exists (
    select 1 from public.account_profiles
    where user_id = (select auth.uid())
      and role = 'player'
      and player_id = target_player_id
  ) then
    raise exception 'Players can only request check-in for their own player';
  end if;

  insert into public.uc_ledger_events (player_id, event_type, amount, reason, requested_by)
  values (target_player_id, 'weekly_check_in', 0, 'Weekly check-in pending admin approval', (select auth.uid()))
  returning id into new_event_id;

  return new_event_id;
end;
$$;

alter table public.uc_ledger_events enable row level security;

create policy "uc ledger read own gm team or admin"
  on public.uc_ledger_events for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.account_profiles ap
      where ap.user_id = (select auth.uid())
        and ap.role = 'player'
        and ap.player_id = uc_ledger_events.player_id
    )
    or exists (
      select 1
      from public.account_profiles ap
      join public.roster_memberships rm on rm.team_id = ap.gm_team_id and rm.ends_at is null
      where ap.user_id = (select auth.uid())
        and ap.role = 'gm'
        and rm.player_id = uc_ledger_events.player_id
    )
  );

create policy "uc ledger admin insert only"
  on public.uc_ledger_events for insert
  with check (public.is_admin());

create policy "players request own weekly check in"
  on public.uc_ledger_events for insert
  with check (
    event_type = 'weekly_check_in'
    and amount = 0
    and requested_by = (select auth.uid())
    and approved_by is null
    and exists (
      select 1 from public.account_profiles ap
      where ap.user_id = (select auth.uid())
        and ap.role = 'player'
        and ap.player_id = uc_ledger_events.player_id
    )
  );
