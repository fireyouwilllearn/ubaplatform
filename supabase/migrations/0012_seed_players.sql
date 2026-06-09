-- Adds stable player slugs and keeps team standings seeded.
-- Player rows are not seeded here anymore: real player identity, roster,
-- attributes, badges, tendencies, hotzones, and bank data must come from the
-- team-owned Google Sheets importer.

alter table public.players add column if not exists slug text;
alter table public.players add constraint players_slug_key unique (slug);

insert into public.standings (team_id, season, conference, conference_rank, status)
select t.id, '2026', t.conference, sr.rank, sr.status
from (values
  ('new-york-empire', 1, 'clinched'),
  ('las-vegas-jokers', 2, 'clinched'),
  ('minnesota-aurora', 3, 'clinched'),
  ('oakland-sea-lions', 4, 'clinched'),
  ('seattle-octopus', 5, 'eliminated'),
  ('vancouver-kodiaks', 6, 'eliminated'),
  ('dallas-toros', 7, 'eliminated'),
  ('detroit-soul', 1, 'clinched'),
  ('toronto-tundra', 2, 'clinched'),
  ('tampa-bay-surge', 3, 'clinched'),
  ('pittsburgh-phantoms', 4, 'in contention'),
  ('virginia-beach-neptunes', 5, 'in contention'),
  ('chicago-cyclones', 6, 'in contention'),
  ('houston-outlaws', 7, 'eliminated')
) as sr(slug, rank, status)
join public.teams t on t.slug = sr.slug
where t.conference is not null
on conflict (season, team_id) do nothing;
