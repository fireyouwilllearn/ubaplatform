-- Draft only. Bucket creation and policies assume storage extension is available in Supabase.

insert into storage.buckets (id, name, public)
values
  ('team-identity', 'team-identity', true),
  ('team-private', 'team-private', false),
  ('player-media', 'player-media', false),
  ('import-files', 'import-files', false)
on conflict (id) do nothing;

create policy "team identity assets are public"
  on storage.objects for select
  using (bucket_id = 'team-identity');

create policy "team identity admin uploads"
  on storage.objects for insert
  with check (bucket_id = 'team-identity' and public.is_admin());

create policy "team identity admin updates"
  on storage.objects for update
  using (bucket_id = 'team-identity' and public.is_admin())
  with check (bucket_id = 'team-identity' and public.is_admin());

create policy "team private admin or gm read"
  on storage.objects for select
  using (
    bucket_id = 'team-private'
    and (
      public.is_admin()
      or exists (
        select 1 from public.account_profiles ap
        where ap.user_id = (select auth.uid())
          and ap.role = 'gm'
          and name like ap.gm_team_id::text || '/%'
      )
    )
  );

create policy "player media own or admin read"
  on storage.objects for select
  using (
    bucket_id = 'player-media'
    and (
      public.is_admin()
      or exists (
        select 1 from public.account_profiles ap
        where ap.user_id = (select auth.uid())
          and ap.role = 'player'
          and name like ap.player_id::text || '/%'
      )
    )
  );

create policy "import files admin only"
  on storage.objects for all
  using (bucket_id = 'import-files' and public.is_admin())
  with check (bucket_id = 'import-files' and public.is_admin());
