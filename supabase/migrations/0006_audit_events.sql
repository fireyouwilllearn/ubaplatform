-- Draft only. Audit rows should be written by privileged workflows/functions, not frontend-only checks.

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text check (actor_role in ('admin', 'gm', 'player')),
  action text not null,
  target_table text,
  target_id uuid,
  severity text not null default 'info' check (severity in ('info', 'review', 'locked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.record_audit_event(
  action text,
  target_table text default null,
  target_id uuid default null,
  severity text default 'info',
  metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_event_id uuid;
begin
  insert into public.audit_events (actor_user_id, actor_role, action, target_table, target_id, severity, metadata)
  values ((select auth.uid()), public.current_account_role(), action, target_table, target_id, severity, metadata)
  returning id into new_event_id;

  return new_event_id;
end;
$$;

alter table public.audit_events enable row level security;

create policy "audit events admin read"
  on public.audit_events for select
  using (public.is_admin());

-- No direct insert policy is defined. Audit writes should go through
-- record_audit_event() or later server-side workflows, not browser inserts.
