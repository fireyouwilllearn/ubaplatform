-- Seed: UBA and NXT teams plus affiliate relationships
-- Idempotent — safe to re-run

-- UBA West
WITH uba_west AS (
  INSERT INTO public.teams (slug, name, short_name, market, league, conference, primary_color)
  VALUES
    ('new-york-empire', 'New York Empire', 'NYE', 'New York', 'UBA', 'West', '#1d74d8'),
    ('las-vegas-jokers', 'Las Vegas Jokers', 'LVJ', 'Las Vegas', 'UBA', 'West', '#f2d399'),
    ('minnesota-aurora', 'Minnesota Aurora', 'MIN', 'Minnesota', 'UBA', 'West', '#58a7ff'),
    ('oakland-sea-lions', 'Oakland Sea Lions', 'OAK', 'Oakland', 'UBA', 'West', '#0b4ea2'),
    ('seattle-octopus', 'Seattle Octopus', 'SEA', 'Seattle', 'UBA', 'West', '#3fe6a5'),
    ('vancouver-kodiaks', 'Vancouver Kodiaks', 'VAN', 'Vancouver', 'UBA', 'West', '#94a3b8'),
    ('dallas-toros', 'Dallas Toros', 'DAL', 'Dallas', 'UBA', 'West', '#ff5b66')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
),
uba_east AS (
  INSERT INTO public.teams (slug, name, short_name, market, league, conference, primary_color)
  VALUES
    ('detroit-soul', 'Detroit Soul', 'DET', 'Detroit', 'UBA', 'East', '#1d74d8'),
    ('toronto-tundra', 'Toronto Tundra', 'TOR', 'Toronto', 'UBA', 'East', '#58a7ff'),
    ('tampa-bay-surge', 'Tampa Bay Surge', 'TBS', 'Tampa Bay', 'UBA', 'East', '#11c7b8'),
    ('pittsburgh-phantoms', 'Pittsburgh Phantoms', 'PIT', 'Pittsburgh', 'UBA', 'East', '#2d4658'),
    ('virginia-beach-neptunes', 'Virginia Beach Neptunes', 'VBN', 'Virginia Beach', 'UBA', 'East', '#0b4ea2'),
    ('chicago-cyclones', 'Chicago Cyclones', 'CHI', 'Chicago', 'UBA', 'East', '#f2d399'),
    ('houston-outlaws', 'Houston Outlaws', 'HOU', 'Houston', 'UBA', 'East', '#cfa15d')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
),
nxt AS (
  INSERT INTO public.teams (slug, name, short_name, league, primary_color)
  VALUES
    ('ascension-prep', 'Ascension Prep', 'AP', 'NXT', '#1d74d8'),
    ('brooklyn-breakers', 'Brooklyn Breakers', 'BKN', 'NXT', '#58a7ff'),
    ('fast-break-society', 'Fast Break Society', 'FBS', 'NXT', '#f2d399'),
    ('flight-club-select', 'Flight Club Select', 'FCS', 'NXT', '#0b4ea2'),
    ('fresno-herd', 'Fresno Herd', 'FRE', 'NXT', '#3fe6a5'),
    ('go-getter-hoops', 'Go Getter Hoops', 'GGH', 'NXT', '#cfa15d'),
    ('jelly-connect', 'Jelly Connect', 'JLY', 'NXT', '#ff5b66'),
    ('kalamazoo-steelheads', 'Kalamazoo Steelheads', 'KAL', 'NXT', '#94a3b8'),
    ('lone-star-stampede', 'Lone Star Stampede', 'LSS', 'NXT', '#f2d399'),
    ('memphis-blues', 'Memphis Blues', 'MEM', 'NXT', '#1d74d8'),
    ('new-jersey-stallions', 'New Jersey Stallions', 'NJS', 'NXT', '#58a7ff'),
    ('no-ceilings', 'No Ceilings', 'NCL', 'NXT', '#3fe6a5'),
    ('out-the-mud', 'Out The Mud', 'OTM', 'NXT', '#2d4658'),
    ('overdrive-elite', 'Overdrive Elite', 'OVE', 'NXT', '#ff5b66'),
    ('utah-avalanche', 'Utah Avalanche', 'UTA', 'NXT', '#94a3b8'),
    ('victoria-monarchs', 'Victoria Monarchs', 'VIC', 'NXT', '#cfa15d')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
),
all_uba AS (
  SELECT id, slug FROM uba_west
  UNION ALL
  SELECT id, slug FROM uba_east
)
INSERT INTO public.team_affiliates (nxt_team_id, uba_team_id, affiliate_location)
SELECT n.id, u.id, aff.location
FROM (VALUES
  ('brooklyn-breakers', 'new-york-empire', 'New York'),
  ('brooklyn-breakers', 'toronto-tundra', 'Toronto'),
  ('fresno-herd', 'oakland-sea-lions', 'Oakland'),
  ('kalamazoo-steelheads', 'chicago-cyclones', 'Chicago'),
  ('kalamazoo-steelheads', 'detroit-soul', 'Detroit'),
  ('lone-star-stampede', 'houston-outlaws', 'Houston'),
  ('lone-star-stampede', 'dallas-toros', 'Dallas'),
  ('memphis-blues', 'tampa-bay-surge', 'Tampa Bay'),
  ('new-jersey-stallions', 'virginia-beach-neptunes', 'Virginia Beach'),
  ('new-jersey-stallions', 'pittsburgh-phantoms', 'Pittsburgh'),
  ('victoria-monarchs', 'vancouver-kodiaks', 'Vancouver'),
  ('victoria-monarchs', 'seattle-octopus', 'Seattle')
) AS aff(nxt_slug, uba_slug, location)
JOIN nxt n ON n.slug = aff.nxt_slug
JOIN all_uba u ON u.slug = aff.uba_slug
ON CONFLICT (nxt_team_id, affiliate_location) DO NOTHING;
