-- RLS hardening: performance, role targeting, and defense-in-depth
-- Applies best practices from Supabase docs (2026):
--   • FORCE ROW LEVEL SECURITY (table owner bypasses RLS by default)
--   • TO authenticated/anon on all policies
--   • (SELECT ...) wrapper on function calls in policies for initPlan caching
--   • Indexes on RLS join columns
--   • security_invoker on views

-- 1. FORCE ROW LEVEL SECURITY — table owner (postgres) no longer bypasses RLS
alter table public.account_profiles force row level security;
alter table public.teams force row level security;
alter table public.team_affiliates force row level security;
alter table public.players force row level security;
alter table public.roster_memberships force row level security;
alter table public.player_hotzones force row level security;
alter table public.standings force row level security;
alter table public.roster_import_batches force row level security;
alter table public.roster_import_rows force row level security;
alter table public.uc_ledger_events force row level security;
alter table public.audit_events force row level security;

-- 2. Fix player_uc_balances view — security_invoker makes it respect
--    the calling user's RLS policies on uc_ledger_events
drop view if exists public.player_uc_balances;
create view public.player_uc_balances
with (security_invoker = true) as
select player_id, coalesce(sum(amount), 0)::integer as balance
from public.uc_ledger_events
group by player_id;

-- 3. Indexes on columns used in RLS policy joins/subqueries
create index if not exists idx_roster_memberships_team_id
  on public.roster_memberships(team_id);
create index if not exists idx_roster_memberships_player_id
  on public.roster_memberships(player_id);
create index if not exists idx_uc_ledger_events_player_id
  on public.uc_ledger_events(player_id);
create index if not exists idx_account_profiles_gm_team_id
  on public.account_profiles(gm_team_id);
create index if not exists idx_player_hotzones_player_id
  on public.player_hotzones(player_id);
create index if not exists idx_standings_team_id
  on public.standings(team_id);
create index if not exists idx_roster_import_rows_batch_id
  on public.roster_import_rows(batch_id);

-- 4. Recreate all policies with:
--    • TO anon/authenticated for explicit role targeting
--    • (SELECT ...) wrapper around function calls for initPlan caching

-- 0001: account_profiles
drop policy if exists "account profiles read own or admin" on public.account_profiles;
create policy "account profiles read own or admin"
  on public.account_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "account profiles admin writes only" on public.account_profiles;
create policy "account profiles admin writes only"
  on public.account_profiles for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 0001: teams
drop policy if exists "teams are publicly readable" on public.teams;
create policy "teams are publicly readable"
  on public.teams for select to anon, authenticated
  using (true);

drop policy if exists "teams admin writes only" on public.teams;
create policy "teams admin writes only"
  on public.teams for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 0001: team_affiliates
drop policy if exists "team affiliates are publicly readable" on public.team_affiliates;
create policy "team affiliates are publicly readable"
  on public.team_affiliates for select to anon, authenticated
  using (true);

drop policy if exists "team affiliates admin writes only" on public.team_affiliates;
create policy "team affiliates admin writes only"
  on public.team_affiliates for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 0002: players
drop policy if exists "players public limited read" on public.players;
create policy "players public limited read"
  on public.players for select to anon, authenticated
  using (true);

drop policy if exists "players admin writes only" on public.players;
create policy "players admin writes only"
  on public.players for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 0002: roster_memberships
drop policy if exists "rosters public read" on public.roster_memberships;
create policy "rosters public read"
  on public.roster_memberships for select to anon, authenticated
  using (true);

drop policy if exists "rosters admin writes only" on public.roster_memberships;
create policy "rosters admin writes only"
  on public.roster_memberships for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 0002: player_hotzones
drop policy if exists "hotzones public read" on public.player_hotzones;
create policy "hotzones public read"
  on public.player_hotzones for select to anon, authenticated
  using (true);

drop policy if exists "hotzones admin writes only" on public.player_hotzones;
create policy "hotzones admin writes only"
  on public.player_hotzones for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 0002: standings
drop policy if exists "standings public read" on public.standings;
create policy "standings public read"
  on public.standings for select to anon, authenticated
  using (true);

drop policy if exists "standings admin writes only" on public.standings;
create policy "standings admin writes only"
  on public.standings for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 0003: roster_import_batches
drop policy if exists "roster import batches admin read" on public.roster_import_batches;
create policy "roster import batches admin read"
  on public.roster_import_batches for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "roster import batches admin writes" on public.roster_import_batches;
create policy "roster import batches admin writes"
  on public.roster_import_batches for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 0003: roster_import_rows
drop policy if exists "roster import rows admin read" on public.roster_import_rows;
create policy "roster import rows admin read"
  on public.roster_import_rows for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "roster import rows admin writes" on public.roster_import_rows;
create policy "roster import rows admin writes"
  on public.roster_import_rows for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 0004: uc_ledger_events
drop policy if exists "uc ledger read own gm team or admin" on public.uc_ledger_events;
create policy "uc ledger read own gm team or admin"
  on public.uc_ledger_events for select to authenticated
  using (
    (select public.is_admin())
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

drop policy if exists "uc ledger admin insert only" on public.uc_ledger_events;
create policy "uc ledger admin insert only"
  on public.uc_ledger_events for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "players request own weekly check in" on public.uc_ledger_events;
create policy "players request own weekly check in"
  on public.uc_ledger_events for insert to authenticated
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

-- 0006: audit_events
drop policy if exists "audit events admin read" on public.audit_events;
create policy "audit events admin read"
  on public.audit_events for select to authenticated
  using ((select public.is_admin()));

-- 0005: storage policies
drop policy if exists "team identity assets are public" on storage.objects;
create policy "team identity assets are public"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'team-identity');

drop policy if exists "team identity admin uploads" on storage.objects;
create policy "team identity admin uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'team-identity' and (select public.is_admin()));

drop policy if exists "team identity admin updates" on storage.objects;
create policy "team identity admin updates"
  on storage.objects for update to authenticated
  using (bucket_id = 'team-identity' and (select public.is_admin()))
  with check (bucket_id = 'team-identity' and (select public.is_admin()));

drop policy if exists "team private admin or gm read" on storage.objects;
create policy "team private admin or gm read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'team-private'
    and (
      (select public.is_admin())
      or exists (
        select 1 from public.account_profiles ap
        where ap.user_id = (select auth.uid())
          and ap.role = 'gm'
          and name like ap.gm_team_id::text || '/%'
      )
    )
  );

drop policy if exists "player media own or admin read" on storage.objects;
create policy "player media own or admin read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'player-media'
    and (
      (select public.is_admin())
      or exists (
        select 1 from public.account_profiles ap
        where ap.user_id = (select auth.uid())
          and ap.role = 'player'
          and name like ap.player_id::text || '/%'
      )
    )
  );

drop policy if exists "import files admin only" on storage.objects;
create policy "import files admin only"
  on storage.objects for all to authenticated
  using (bucket_id = 'import-files' and (select public.is_admin()))
  with check (bucket_id = 'import-files' and (select public.is_admin()));
