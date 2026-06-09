-- Notifications + Trade Proposals

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'trade_proposal', 'trade_approved', 'trade_declined',
    'roster_change', 'injury_update', 'free_agency',
    'check_in_approved', 'check_in_pending', 'system',
    'free_agency_bid', 'free_agency_signed'
  )),
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- TRADE PROPOSALS
create table if not exists public.trade_proposals (
  id uuid primary key default gen_random_uuid(),
  proposer_team_id uuid not null references public.teams(id) on delete restrict,
  receiver_team_id uuid not null references public.teams(id) on delete restrict,
  proposer_sends_player_ids uuid[] not null default '{}',
  proposer_sends_uc_amount integer not null default 0,
  receiver_sends_player_ids uuid[] not null default '{}',
  receiver_sends_uc_amount integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'withdrawn')),
  proposed_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  admin_notes text,
  proposed_at timestamptz not null default now(),
  reviewed_at timestamptz,
  expires_at timestamptz,
  constraint trade_proposals_diff_teams check (proposer_team_id <> receiver_team_id)
);

-- RLS
alter table public.notifications enable row level security;
alter table public.trade_proposals enable row level security;
alter table public.notifications force row level security;
alter table public.trade_proposals force row level security;

create policy "notifications read own"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications insert for self or admin"
  on public.notifications for insert to authenticated
  with check (
    user_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "notifications update own"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications admin delete"
  on public.notifications for delete to authenticated
  using ((select public.is_admin()));

-- Trade proposals: GM can read their own team's proposals, admin can read all
create policy "trade proposals read own team or admin"
  on public.trade_proposals for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.account_profiles ap
      where ap.user_id = (select auth.uid())
        and ap.role = 'gm'
        and (ap.gm_team_id = trade_proposals.proposer_team_id or ap.gm_team_id = trade_proposals.receiver_team_id)
    )
  );

create policy "trade proposals gm insert"
  on public.trade_proposals for insert to authenticated
  with check (
    exists (
      select 1 from public.account_profiles ap
      where ap.user_id = (select auth.uid())
        and ap.role = 'gm'
        and ap.gm_team_id = proposer_team_id
    )
  );

create policy "trade proposals gm or admin update own"
  on public.trade_proposals for update to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.account_profiles ap
      where ap.user_id = (select auth.uid())
        and ap.role = 'gm'
        and (ap.gm_team_id = proposer_team_id or ap.gm_team_id = receiver_team_id)
    )
  )
  with check (
    (select public.is_admin())
    or exists (
      select 1 from public.account_profiles ap
      where ap.user_id = (select auth.uid())
        and ap.role = 'gm'
        and (ap.gm_team_id = proposer_team_id or ap.gm_team_id = receiver_team_id)
    )
  );

-- Indexes
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);
create index if not exists idx_trade_proposals_proposer on public.trade_proposals(proposer_team_id);
create index if not exists idx_trade_proposals_receiver on public.trade_proposals(receiver_team_id);
create index if not exists idx_trade_proposals_status on public.trade_proposals(status);
