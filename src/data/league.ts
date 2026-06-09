import type { Announcement, AuditEvent, LeagueRule, PermissionRow, Player, PrimaryPosition, Standing, StandingWithTeam, Team } from '../types/domain';
import { legalHeightRanges, primaryPositions } from '../types/domain';

export const mainLeagueTeams: Team[] = [
  {
    id: 'new-york-empire',
    name: 'New York Empire',
    shortName: 'NYE',
    market: 'New York',
    league: 'UBA',
    conference: 'West',
    primaryColor: '#1d74d8',
  },
  {
    id: 'las-vegas-jokers',
    name: 'Las Vegas Jokers',
    shortName: 'LVJ',
    market: 'Las Vegas',
    league: 'UBA',
    conference: 'West',
    primaryColor: '#f2d399',
  },
  {
    id: 'minnesota-aurora',
    name: 'Minnesota Aurora',
    shortName: 'MIN',
    market: 'Minnesota',
    league: 'UBA',
    conference: 'West',
    primaryColor: '#58a7ff',
  },
  {
    id: 'oakland-sea-lions',
    name: 'Oakland Sea Lions',
    shortName: 'OAK',
    market: 'Oakland',
    league: 'UBA',
    conference: 'West',
    primaryColor: '#0b4ea2',
  },
  {
    id: 'seattle-octopus',
    name: 'Seattle Octopus',
    shortName: 'SEA',
    market: 'Seattle',
    league: 'UBA',
    conference: 'West',
    primaryColor: '#3fe6a5',
  },
  {
    id: 'vancouver-kodiaks',
    name: 'Vancouver Kodiaks',
    shortName: 'VAN',
    market: 'Vancouver',
    league: 'UBA',
    conference: 'West',
    primaryColor: '#94a3b8',
  },
  {
    id: 'dallas-toros',
    name: 'Dallas Toros',
    shortName: 'DAL',
    market: 'Dallas',
    league: 'UBA',
    conference: 'West',
    primaryColor: '#ff5b66',
  },
  {
    id: 'los-angeles-royals',
    name: 'Los Angeles Royals',
    shortName: 'LAR',
    market: 'Los Angeles',
    league: 'UBA',
    conference: 'West',
    primaryColor: '#7c3aed',
  },
  {
    id: 'detroit-soul',
    name: 'Detroit Soul',
    shortName: 'DET',
    market: 'Detroit',
    league: 'UBA',
    conference: 'East',
    primaryColor: '#1d74d8',
  },
  {
    id: 'toronto-tundra',
    name: 'Toronto Tundra',
    shortName: 'TOR',
    market: 'Toronto',
    league: 'UBA',
    conference: 'East',
    primaryColor: '#58a7ff',
  },
  {
    id: 'tampa-bay-surge',
    name: 'Tampa Bay Surge',
    shortName: 'TBS',
    market: 'Tampa Bay',
    league: 'UBA',
    conference: 'East',
    primaryColor: '#11c7b8',
  },
  {
    id: 'pittsburgh-phantoms',
    name: 'Pittsburgh Phantoms',
    shortName: 'PIT',
    market: 'Pittsburgh',
    league: 'UBA',
    conference: 'East',
    primaryColor: '#2d4658',
  },
  {
    id: 'virginia-beach-neptunes',
    name: 'Virginia Beach Neptunes',
    shortName: 'VBN',
    market: 'Virginia Beach',
    league: 'UBA',
    conference: 'East',
    primaryColor: '#0b4ea2',
  },
  {
    id: 'chicago-cyclones',
    name: 'Chicago Cyclones',
    shortName: 'CHI',
    market: 'Chicago',
    league: 'UBA',
    conference: 'East',
    primaryColor: '#f2d399',
  },
  {
    id: 'houston-outlaws',
    name: 'Houston Outlaws',
    shortName: 'HOU',
    market: 'Houston',
    league: 'UBA',
    conference: 'East',
    primaryColor: '#cfa15d',
  },
  {
    id: 'derby-city-stingers',
    name: 'Derby City Stingers',
    shortName: 'DCS',
    market: 'Derby City',
    league: 'UBA',
    conference: 'East',
    primaryColor: '#f59e0b',
  },
];

export const nxtLeagueTeams: Team[] = [
  { id: 'ascension-prep', name: 'Ascension Prep', shortName: 'AP', league: 'NXT', primaryColor: '#1d74d8' },
  {
    id: 'brooklyn-breakers',
    name: 'Brooklyn Breakers',
    shortName: 'BKN',
    league: 'NXT',
    primaryColor: '#58a7ff',
    affiliateTeamIds: ['new-york-empire', 'toronto-tundra'],
    affiliateLocations: ['New York', 'Toronto'],
  },
  { id: 'fast-break-society', name: 'Fast Break Society', shortName: 'FBS', league: 'NXT', primaryColor: '#f2d399' },
  { id: 'flight-club-select', name: 'Flight Club Select', shortName: 'FCS', league: 'NXT', primaryColor: '#0b4ea2' },
  {
    id: 'fresno-herd',
    name: 'Fresno Herd',
    shortName: 'FRE',
    league: 'NXT',
    primaryColor: '#3fe6a5',
    affiliateTeamIds: ['oakland-sea-lions', 'los-angeles-royals'],
    affiliateLocations: ['Oakland', 'Los Angeles'],
  },
  { id: 'go-getter-hoops', name: 'Go Getter Hoops', shortName: 'GGH', league: 'NXT', primaryColor: '#cfa15d' },
  { id: 'jelly-connect', name: 'Jelly Connect', shortName: 'JLY', league: 'NXT', primaryColor: '#ff5b66' },
  {
    id: 'kalamazoo-steelheads',
    name: 'Kalamazoo Steelheads',
    shortName: 'KAL',
    league: 'NXT',
    primaryColor: '#94a3b8',
    affiliateTeamIds: ['chicago-cyclones', 'detroit-soul'],
    affiliateLocations: ['Chicago', 'Detroit'],
  },
  {
    id: 'lone-star-stampede',
    name: 'Lone Star Stampede',
    shortName: 'LSS',
    league: 'NXT',
    primaryColor: '#f2d399',
    affiliateTeamIds: ['houston-outlaws', 'dallas-toros'],
    affiliateLocations: ['Houston', 'Dallas'],
  },
  {
    id: 'memphis-blues',
    name: 'Memphis Blues',
    shortName: 'MEM',
    league: 'NXT',
    primaryColor: '#1d74d8',
    affiliateTeamIds: ['derby-city-stingers', 'tampa-bay-surge'],
    affiliateLocations: ['Derby City', 'Tampa Bay'],
  },
  {
    id: 'new-jersey-stallions',
    name: 'New Jersey Stallions',
    shortName: 'NJS',
    league: 'NXT',
    primaryColor: '#58a7ff',
    affiliateTeamIds: ['virginia-beach-neptunes', 'pittsburgh-phantoms'],
    affiliateLocations: ['Virginia Beach', 'Pittsburgh'],
  },
  { id: 'no-ceilings', name: 'No Ceilings', shortName: 'NCL', league: 'NXT', primaryColor: '#3fe6a5' },
  { id: 'out-the-mud', name: 'Out The Mud', shortName: 'OTM', league: 'NXT', primaryColor: '#2d4658' },
  { id: 'overdrive-elite', name: 'Overdrive Elite', shortName: 'OVE', league: 'NXT', primaryColor: '#ff5b66' },
  { id: 'utah-avalanche', name: 'Utah Avalanche', shortName: 'UTA', league: 'NXT', primaryColor: '#94a3b8' },
  {
    id: 'victoria-monarchs',
    name: 'Victoria Monarchs',
    shortName: 'VIC',
    league: 'NXT',
    primaryColor: '#cfa15d',
    affiliateTeamIds: ['vancouver-kodiaks', 'seattle-octopus'],
    affiliateLocations: ['Vancouver', 'Seattle'],
  },
];

export const teams: Team[] = [...mainLeagueTeams, ...nxtLeagueTeams];
export const affiliatedNxtTeams = nxtLeagueTeams.filter((team) => (team.affiliateLocations?.length ?? 0) > 0);
export const unassignedNxtTeams = nxtLeagueTeams.filter((team) => (team.affiliateLocations?.length ?? 0) === 0);

/*
 * Player records intentionally stay empty until the Google Sheets importer writes
 * real data. The old demo players were useful for layout exploration, but they
 * looked too much like authoritative league records once Supabase went live.
 */
export const players: Player[] = [];

export const standings: Standing[] = [
  { teamId: 'new-york-empire', conference: 'West', conferenceRank: 1, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'clinched', season: '2026' },
  { teamId: 'las-vegas-jokers', conference: 'West', conferenceRank: 2, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'clinched', season: '2026' },
  { teamId: 'minnesota-aurora', conference: 'West', conferenceRank: 3, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'clinched', season: '2026' },
  { teamId: 'oakland-sea-lions', conference: 'West', conferenceRank: 4, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'clinched', season: '2026' },
  { teamId: 'seattle-octopus', conference: 'West', conferenceRank: 5, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'eliminated', season: '2026' },
  { teamId: 'vancouver-kodiaks', conference: 'West', conferenceRank: 6, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'eliminated', season: '2026' },
  { teamId: 'dallas-toros', conference: 'West', conferenceRank: 7, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'eliminated', season: '2026' },
  { teamId: 'detroit-soul', conference: 'East', conferenceRank: 1, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'clinched', season: '2026' },
  { teamId: 'toronto-tundra', conference: 'East', conferenceRank: 2, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'clinched', season: '2026' },
  { teamId: 'tampa-bay-surge', conference: 'East', conferenceRank: 3, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'clinched', season: '2026' },
  { teamId: 'pittsburgh-phantoms', conference: 'East', conferenceRank: 4, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'in contention', season: '2026' },
  { teamId: 'virginia-beach-neptunes', conference: 'East', conferenceRank: 5, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'in contention', season: '2026' },
  { teamId: 'chicago-cyclones', conference: 'East', conferenceRank: 6, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'in contention', season: '2026' },
  { teamId: 'houston-outlaws', conference: 'East', conferenceRank: 7, wins: 0, losses: 0, gamesBack: 0, last10: null, ptDiff: 0, winPct: 0, status: 'eliminated', season: '2026' },
];

export const announcements: Announcement[] = [
  {
    id: 'a-001',
    title: 'Week 6 lock deadline is Friday night',
    kicker: 'Roster lock',
    category: 'Roster',
    date: 'May 27, 2026',
    body: 'Captains should verify rosters, open disputes, and availability windows before the weekly lock. Late changes need admin approval once the backend workflow exists.',
    pinned: true,
  },
  {
    id: 'a-002',
    title: 'Daily reward flow requires transaction logging',
    kicker: 'Economy design',
    category: 'Rewards',
    date: 'May 26, 2026',
    body: 'UC grants, upgrade purchases, and manual adjustments will be append-only ledger events. The browser will only request changes; it will not decide balances.',
    pinned: true,
  },
  {
    id: 'a-003',
    title: 'Platform shell now mirrors the UBA product family',
    kicker: 'Release note',
    category: 'Release',
    date: 'May 25, 2026',
    body: 'The app shell, routes, static data model, and dark glass court visual system are in place before backend work begins.',
    pinned: false,
  },
];

export const auditEvents: AuditEvent[] = [
  { id: 'e-001', date: 'Pending', actor: 'Admin role', action: 'Approve UC adjustment', target: 'Player balance ledger', severity: 'locked' },
  { id: 'e-002', date: 'Pending', actor: 'GM role', action: 'Submit roster transfer', target: 'Team membership', severity: 'review' },
  { id: 'e-003', date: 'Pending', actor: 'Player', action: 'Request attribute upgrade', target: 'Build progression', severity: 'info' },
];

export const leagueRules: LeagueRule[] = [
  {
    title: 'Backend authority for progression',
    body: 'UC balances, attribute purchases, badges, tendencies, and admin edits must resolve through database-backed workflows with audit trails.',
  },
  {
    title: 'Frontend routes are not security',
    body: 'Admin pages can hide unavailable tools, but permissions must be enforced by row-level security and privileged functions when Supabase is added.',
  },
  {
    title: 'Calculator remains detached',
    body: 'The build calculator should be integrated only after player records, transaction logging, and upgrade rules are represented in the backend model.',
  },
];

export const permissionMatrix: PermissionRow[] = [
  { area: 'Own player profile', player: 'Read own data', gm: 'Read own team players', admin: 'Read all' },
  { area: 'UC balance', player: 'Read own + check-in submit', gm: 'Team UC totals', admin: 'Approve through ledger' },
  { area: 'Roster membership', player: 'Read public roster', gm: 'Read own full roster', admin: 'Approve transfer' },
  { area: 'Team roster (own)', player: 'N/A', gm: 'Read full + playbooks + images', admin: 'Read all team-private data' },
  { area: 'Team roster (opponent)', player: 'Names, pos, ht, wt, attrs, badges, hotzones, tendencies only', gm: 'Names, pos, ht, wt, attrs, badges, hotzones, tendencies only', admin: 'Full access' },
  { area: 'Playbooks & images', player: 'Read own team only', gm: 'Read own team', admin: 'Read all' },
  { area: 'Weekly check-in', player: 'Submit for UC', gm: 'View team check-in status', admin: 'Approve or override' },
  { area: 'Leaderboards & stats', player: 'Read all', gm: 'Read all', admin: 'Read all' },
  { area: 'Announcements', player: 'Read published', gm: 'Read published', admin: 'Publish' },
  { area: 'Calculator / upgrades', player: 'Use + submit', gm: 'View team builds', admin: 'Review and approve' },
];

const foundationTasks = [
  'React Router nested layout is ready for authenticated route groups.',
  'Domain types separate league concepts from UI components.',
  'Static seed data provides useful screens without browser persistence.',
  'Supabase connection is represented as an environment contract only.',
];

export const calculatorReadiness = [
  'Player records exist in the database.',
  'UC balance changes write immutable ledger rows.',
  'Upgrade costs and badge rules are versioned.',
  'Admin override paths require backend permission checks.',
];

function requireTeam(teamId: string): Team {
  const team = teams.find((candidate) => candidate.id === teamId);

  if (!team) {
    throw new Error(`Static league data references missing team: ${teamId}`);
  }

  return team;
}

function assertUniqueIds(collection: { id: string }[], label: string) {
  const seen = new Set<string>();

  for (const item of collection) {
    if (seen.has(item.id)) {
      throw new Error(`Static league data contains duplicate ${label} id: ${item.id}`);
    }

    seen.add(item.id);
  }
}

function validateStaticLeagueData() {
  assertUniqueIds(teams, 'team');
  assertUniqueIds(players, 'player');
  assertUniqueIds(announcements, 'announcement');
  assertUniqueIds(auditEvents, 'audit event');

  for (const player of players) {
    requireTeam(player.teamId);

    const primaryRange = legalHeightRanges[player.position];
    if (player.heightInches < primaryRange.min || player.heightInches > primaryRange.max) {
      throw new Error(`Player height is outside legal ${player.position} range: ${player.id}`);
    }

    if (player.wingspan < player.heightInches - 6 || player.wingspan > player.heightInches + 10) {
      throw new Error(`Player wingspan is outside expected bounds: ${player.id}`);
    }

    const seenHotZones = new Set<string>();
    for (const hotZone of player.hotZones ?? []) {
      if (seenHotZones.has(hotZone.zone)) {
        throw new Error(`Player has duplicate hotzone entry: ${player.id} -> ${hotZone.zone}`);
      }

      seenHotZones.add(hotZone.zone);
    }

    for (const [tendency, value] of Object.entries(player.tendencies ?? {})) {
      if (typeof value !== 'number' || value < 0 || value > 100) {
        throw new Error(`Player tendency is outside 0-100: ${player.id} -> ${tendency}`);
      }
    }
  }

  const rankKeys = new Set<string>();

  for (const standing of standings) {
    const team = requireTeam(standing.teamId);

    if (team.league !== 'UBA' || !team.conference) {
      throw new Error(`Standing references non-UBA team: ${standing.teamId}`);
    }

    const rankKey = `${team.conference}:${standing.conferenceRank}`;
    if (rankKeys.has(rankKey)) {
      throw new Error(`Duplicate ${team.conference} conference seed: ${standing.conferenceRank}`);
    }

    rankKeys.add(rankKey);
  }

  for (const team of nxtLeagueTeams) {
    for (const affiliateTeamId of team.affiliateTeamIds ?? []) {
      const affiliate = requireTeam(affiliateTeamId);

      if (affiliate.league !== 'UBA') {
        throw new Error(`NXT affiliate does not reference a UBA team: ${team.id} -> ${affiliateTeamId}`);
      }
    }
  }
}

validateStaticLeagueData();

export const standingsWithTeams: StandingWithTeam[] = standings
  .map((standing) => ({
    ...standing,
    team: requireTeam(standing.teamId),
  }))
  .sort((a, b) => {
    const conferenceOrder = { West: 0, East: 1 };
    const aConference = a.team.conference ?? 'East';
    const bConference = b.team.conference ?? 'East';

    return conferenceOrder[aConference] - conferenceOrder[bConference] || a.conferenceRank - b.conferenceRank;
  });

function teamForPlayer(player: Player): Team {
  return requireTeam(player.teamId);
}

export function playersForTeam(teamId: string): Player[] {
  return players.filter((player) => player.teamId === teamId);
}

function eligiblePositionsForHeight(heightInches: number): { position: PrimaryPosition; label: string; legal: boolean }[] {
  return primaryPositions.map((pos) => {
    const range = legalHeightRanges[pos];
    return {
      position: pos,
      label: range.label,
      legal: heightInches >= range.min && heightInches <= range.max,
    };
  });
}
