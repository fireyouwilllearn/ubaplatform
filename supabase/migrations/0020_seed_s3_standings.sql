-- Seed S3 season standings
--
-- Conference alignments in S3 differed from current DB defaults:
--   East: CHICAGO, DETROIT, NEW YORK, TORONTO, PITTSBURGH, TAMPA BAY, VIRGINIA BEACH, DERBY CITY
--   West: LAS VEGAS, SEATTLE, DALLAS, OAKLAND, LOS ANGELES, MINNESOTA, HOUSTON, VANCOUVER
--
-- Source: UBA S3 Standings Google Sheet (West tab = combined, East tab = East conference)

insert into public.standings (team_id, season, conference, conference_rank, wins, losses, games_back, pt_diff, win_pct, status, updated_at)
values
  -- ── East Conference (8 teams) ──────────────────────────────────────────────
  ('34507ce9-ff15-4e76-9549-1c41a6fcd8d3', 'S3', 'East', 1,  9, 2, 0.0,  121, .818, 'in contention', now()),
  ('c15b4484-4337-4941-b65a-ab598fbb440f', 'S3', 'East', 2,  7, 3, 1.5,   88, .700, 'in contention', now()),
  ('3dbb8aca-c067-4040-b3f0-d44e40b1c904', 'S3', 'East', 3,  5, 3, 2.5,  169, .625, 'in contention', now()),
  ('b63fa063-22f8-4b1e-b1cf-8859669826e2', 'S3', 'East', 4,  4, 1, 3.0,   45, .800, 'in contention', now()),
  ('ee767df6-5178-43bb-a5dd-f5cb17178eb0', 'S3', 'East', 5,  4, 7, 5.0,   -7, .364, 'in contention', now()),
  ('ae2980c6-4c80-47cc-994f-8fe56c0f4506', 'S3', 'East', 6,  0, 0, 5.5,    0, .000, 'in contention', now()),
  ('97e26fc1-d4e2-40c7-841b-1e34a58bbd03', 'S3', 'East', 7,  0, 1, 5.0,   -6, .000, 'in contention', now()),
  ('af1a451f-1a4d-40dd-bff7-81b39e308127', 'S3', 'East', 8,  0, 1, 5.0,  -18, .000, 'in contention', now()),

  -- ── West Conference (8 teams) ──────────────────────────────────────────────
  ('0d0fee8a-07d8-4c40-89f0-26e152604d12', 'S3', 'West', 1,  8, 1, 0.0,  108, .889, 'in contention', now()),
  ('387c087a-0dfe-4bae-8066-c213679bd974', 'S3', 'West', 2,  5, 2, 2.0,   59, .714, 'in contention', now()),
  ('0e0ee68d-ec89-4387-aa65-a89767a04f9e', 'S3', 'West', 3,  3, 1, 3.5,   69, .750, 'in contention', now()),
  ('8452c808-e0f3-4529-94b4-0783b9320bfc', 'S3', 'West', 4,  3, 8, 6.0, -138, .273, 'in contention', now()),
  ('4212a03e-4edd-4e87-bc17-3990096ab864', 'S3', 'West', 5,  2, 1, 4.0,   11, .667, 'in contention', now()),
  ('48e3a73c-ad46-4b77-8166-6c0db70f4dcb', 'S3', 'West', 6,  1, 3, 4.5,  -57, .250, 'in contention', now()),
  ('f57b23c8-003e-4102-89e7-9bf5d89ec34e', 'S3', 'West', 7,  1, 3, 4.5,  -61, .250, 'in contention', now()),
  ('d77a0108-3f27-47a1-843c-ab220017567e', 'S3', 'West', 8,  0, 2, 4.5,  -25, .000, 'in contention', now())
on conflict (season, team_id) do update set
  conference    = excluded.conference,
  conference_rank = excluded.conference_rank,
  wins          = excluded.wins,
  losses        = excluded.losses,
  games_back    = excluded.games_back,
  pt_diff       = excluded.pt_diff,
  win_pct       = excluded.win_pct,
  status        = excluded.status,
  updated_at    = excluded.updated_at;
