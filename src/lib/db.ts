/*
 * Supabase-backed data access layer with module-level caching and static fallback.
 *
 * Architecture:
 *   Every fetch* function follows the same tri-state pattern:
 *     1. Return cached result if available (avoids redundant network calls within a session).
 *     2. If Supabase is unconfigured or the anon key is missing (`isSupabaseReady`),
 *        populate the cache from static-data modules and return that for league
 *        structure. Player records are the exception: they return [] until the
 *        Google Sheets importer writes real rows, because stale fake identities are
 *        worse than an empty state.
 *     3. Fire a Supabase query. On success → map rows into domain types and cache.
 *        On failure (network error, empty response) → fall back to static data.
 *
 *   Caching is at module scope, not React state — so multiple components calling
 *   fetchTeams() in the same session share one request. Call `clearTeamCache()` if
 *   data must be refreshed (e.g. after an admin mutation).
 *
 *   The standings query uses Supabase's `select(..., teams!inner(...))` join syntax
 *   to pull the related team row in a single network round-trip. The `!inner` ensures
 *   orphan standings (no matching team) are excluded. We cast the result because the
 *   auto-generated types don't model joined shapes.
 *
 *   Player queries also eagerly join roster_memberships to hydrate the current team
 *   assignment without a second async step from the consumer.
 */

import { supabase, isSupabaseReady } from './supabase';
import type { Database, Json } from './database.types';
import {
  teams as staticTeams,
  standings as staticStandings,
  nxtLeagueTeams as staticNxtTeams,
} from '../data/league';
import type { AppNotification, AuditEvent, BankReviewRow, FreeAgencyListing, Game, HotZone, HotZoneName, HotZoneStatus, Injury, LeaderboardEntry, Player, PlayerSeasonStat, Standing, StandingWithTeam, Team, TradeProposal } from '../types/domain';

type DbTeam = Database['public']['Tables']['teams']['Row'];
type DbStanding = Database['public']['Tables']['standings']['Row'];

type DbPlayer = Database['public']['Tables']['players']['Row'];
type DbPlayerHotzone = Database['public']['Tables']['player_hotzones']['Row'];
type DbSheetImportPlayerRow = Database['public']['Tables']['sheet_import_player_rows']['Row'];
type DbInjury = Database['public']['Tables']['injuries']['Row'];

const PUBLIC_PLAYER_COLUMNS = 'id, slug, gamertag, primary_position, secondary_positions, archetype, overall, height_inches, wingspan_inches, status, animations';
const PRIVATE_PLAYER_COLUMNS = `${PUBLIC_PLAYER_COLUMNS}, attributes, badges, tendencies`;

function normalizePlayerStatName(name: string | null | undefined): string {
  return String(name ?? '').trim().replace(/\s+\([^)]+\)$/u, '').toLowerCase();
}

function isFillerPlayerName(name: string | null | undefined): boolean {
  return normalizePlayerStatName(name).includes('filler player');
}

/*
 * Maps the 34 detailed spreadsheet attribute names to our 5 aggregate buckets.
 * Each bucket is the average of its member attribute values.
 */
const ATTRIBUTE_TO_BUCKET: Record<string, keyof Player['attributes']> = {
  'Driving Layup': 'finishing', 'Post Fade': 'finishing', 'Post Hook': 'finishing',
  'Post Control': 'finishing', 'Draw Foul': 'finishing', 'Close Shot': 'finishing',
  'Standing Dunk': 'finishing', 'Driving Dunk': 'finishing', 'Offensive Rebound': 'finishing',
  'Mid Range': 'shooting', '3PT': 'shooting', 'Free Throw': 'shooting',
  'Shot IQ': 'shooting', 'Offensive Consistency': 'shooting',
  'Ball Handle': 'playmaking', 'Pass IQ': 'playmaking', 'Pass Accuracy': 'playmaking',
  'Pass Vision': 'playmaking', 'Hands': 'playmaking',
  'Defensive Rebound': 'defense', 'Interior Defense': 'defense', 'Perimeter Defense': 'defense',
  'Block': 'defense', 'Steal': 'defense', 'Pass Perception': 'defense',
  'Defensive Consistency': 'defense', 'Help Defense IQ': 'defense',
  'Speed': 'physicals', 'Speed With Ball': 'physicals', 'Vertical': 'physicals',
  'Strength': 'physicals', 'Stamina': 'physicals', 'Hustle': 'physicals', 'Agility': 'physicals',
};

function computeAggregateAttributes(raw: Record<string, number>): Player['attributes'] {
  const buckets: Record<keyof Player['attributes'], number[]> = {
    finishing: [],
    shooting: [],
    playmaking: [],
    defense: [],
    physicals: [],
  };

  for (const [name, val] of Object.entries(raw)) {
    const bucket = ATTRIBUTE_TO_BUCKET[name];
    if (bucket) buckets[bucket].push(val);
  }

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return {
    finishing: avg(buckets.finishing),
    shooting: avg(buckets.shooting),
    playmaking: avg(buckets.playmaking),
    defense: avg(buckets.defense),
    physicals: avg(buckets.physicals),
  };
}

/*
 * Internal cache for hydrated player records so multiple components share one
 * fetch cycle. Cleared implicitly when promoteSheetImportPlayerRow succeeds
 * (the page should trigger a stale-data refresh itself).
 */
let cachedPlayers: Player[] | null = null;

export type SheetImportReviewRow = {
  id: string;
  playerName: string;
  discordHandle: string | null;
  primaryPosition: string | null;
  heightText: string | null;
  heightInches: number | null;
  rosterStatus: string;
  twoWayUbanxtLabel: string | null;
  tendencyReviewStatus: string;
  tendencySourceLabel: string | null;
  validationErrors: string[];
  reviewStatus: string;
  promotedPlayerId: string | null;
  sourceRowNumbers: Json;
  matchedTeamName: string | null;
  matchedTeamSlug: string | null;
  sourceName: string | null;
  runStatus: string | null;
  canPromote: boolean;
};

/*
 * Maps a Supabase `teams` row to the domain `Team` type.
 * The hosted DB stores the human-readable slug as the primary identifier;
 * numeric surrogate keys exist as `id` but are never exposed to the UI.
 */
function mapTeam(t: DbTeam): Team {
  return {
    id: t.slug,
    name: t.name,
    shortName: t.short_name,
    market: t.market ?? t.name,
    league: t.league as 'UBA' | 'NXT',
    conference: t.conference as 'East' | 'West' | undefined,
    primaryColor: t.primary_color,
  };
}

/*
 * Module-scoped caches. One cache per query shape means N components each calling
 * fetchTeams() on mount issue exactly one Supabase request total. The cache is
 * populated eagerly from static data when Supabase is unavailable, so the UI never
 * waits for a network round-trip on first render.
 */
let cachedTeams: Team[] | null = null;
let cachedUbaTeams: Team[] | null = null;
let cachedNxtTeams: Team[] | null = null;

/*
 * Fetch all teams (UBA + NXT) ordered by slug.
 * Used by LeaguePage, and as a dependency of fetchStandingsWithTeams fallback.
 */
async function fetchTeams(): Promise<Team[]> {
  if (cachedTeams) return cachedTeams;
  if (!isSupabaseReady) { cachedTeams = staticTeams; return cachedTeams; }

  const { data, error } = await supabase!
    .from('teams')
    .select('*')
    .order('slug');

  if (error || !data) { cachedTeams = staticTeams; return cachedTeams; }

  cachedTeams = data.map(mapTeam);
  return cachedTeams;
}

/*
 * Fetch only UBA main-league teams.
 * Used by TeamsPage to render the "UBA teams" section separately from NXT.
 */
export async function fetchUbaTeams(): Promise<Team[]> {
  if (cachedUbaTeams) return cachedUbaTeams;
  if (!isSupabaseReady) { cachedUbaTeams = staticTeams; return cachedUbaTeams; }

  const { data, error } = await supabase!
    .from('teams')
    .select('*')
    .eq('league', 'UBA')
    .order('slug');

  if (error || !data) { cachedUbaTeams = staticTeams; return cachedUbaTeams; }

  cachedUbaTeams = data.map(mapTeam);
  return cachedUbaTeams;
}

/*
 * Fetch only NXT development-league teams.
 * Used by TeamsPage to render the "NXT League" section separately from UBA.
 */
export async function fetchNxtTeams(): Promise<Team[]> {
  if (cachedNxtTeams) return cachedNxtTeams;
  if (!isSupabaseReady) { cachedNxtTeams = staticNxtTeams; return cachedNxtTeams; }

  const { data, error } = await supabase!
    .from('teams')
    .select('*')
    .eq('league', 'NXT')
    .order('slug');

  if (error || !data) { cachedNxtTeams = staticNxtTeams; return cachedNxtTeams; }

  cachedNxtTeams = data.map(mapTeam);
  return cachedNxtTeams;
}

/*
 * Fetch a single team by slug (e.g. "uba-boston-bullets").
 * Does NOT cache — single-team lookups are typically one-off (TeamDetailPage).
 * Falls back to static data if Supabase is unreachable.
 */
export async function fetchTeamBySlug(slug: string): Promise<Team | null> {
  if (!isSupabaseReady) return staticTeams.find(t => t.id === slug) ?? null;

  const { data, error } = await supabase!
    .from('teams')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return staticTeams.find(t => t.id === slug) ?? null;
  return mapTeam(data);
}

/*
 * Fetch standings joined with their team rows in a single query.
 * Uses Supabase's `!inner` join syntax: `teams!inner(...)` ensures only standings
 * that have a matching team row are returned. The auto-generated types from
 * database.types.ts don't model joined shapes, so we cast to an intermediate type.
 *
 * Falls back to joining staticStandings with whatever fetchTeams() returns.
 * The season parameter defaults to 'S3'. Pass '2026' for the current season.
 * If conference is provided, filters to that conference only; otherwise returns
 * all rows for the season (used for the combined/wild card view).
 */
export async function fetchStandingsWithTeams(season = 'S3', conference?: 'East' | 'West'): Promise<StandingWithTeam[]> {
  if (!isSupabaseReady) {
    let filtered = staticStandings
      .map(s => ({ ...s, team: staticTeams.find(t => t.id === s.teamId)! }))
      .filter((s): s is StandingWithTeam & { team: Team } => !!s.team);
    if (conference) filtered = filtered.filter(s => s.conference === conference);
    return filtered;
  }

  let query = supabase!
    .from('standings')
    .select('conference, conference_rank, wins, losses, games_back, last10, pt_diff, win_pct, status, season, teams!inner(slug, name, short_name, market, league, conference, primary_color)')
    .eq('season', season)
    .order('conference_rank');

  if (conference) {
    query = query.eq('conference', conference);
  }

  const { data: rows, error } = await query;

  if (error || !rows || rows.length === 0) {
    const teams = await fetchTeams();
    let filtered = staticStandings
      .map(s => ({ ...s, team: teams.find(t => t.id === s.teamId)! }))
      .filter((s): s is StandingWithTeam & { team: Team } => !!s.team);
    if (conference) filtered = filtered.filter(s => s.conference === conference);
    return filtered;
  }

  return (rows as unknown as Array<{
    conference: string;
    conference_rank: number;
    wins: number;
    losses: number;
    games_back: number;
    last10: string | null;
    pt_diff: number;
    win_pct: number;
    status: string;
    season: string;
    teams: {
      slug: string;
      name: string;
      short_name: string;
      market: string;
      league: string;
      conference: string;
      primary_color: string;
    };
  }>).map(r => ({
    teamId: r.teams.slug,
    conference: r.conference as 'East' | 'West',
    conferenceRank: r.conference_rank,
    wins: r.wins,
    losses: r.losses,
    gamesBack: r.games_back,
    last10: r.last10 ?? null,
    ptDiff: r.pt_diff,
    winPct: r.win_pct,
    status: r.status as Standing['status'],
    season: r.season,
    team: {
      id: r.teams.slug,
      name: r.teams.name,
      shortName: r.teams.short_name,
      market: r.teams.market,
      league: r.teams.league as 'UBA' | 'NXT',
      conference: r.teams.conference as 'East' | 'West',
      primaryColor: r.teams.primary_color,
    },
  }));
}

/*
 * Fetch all promoted players with current team assignments and hotzones.
 *
 * Query flow:
 *   1. Fetch all canonical `players` rows.
 *   2. Fetch all non-expired `roster_memberships`.
 *   3. Resolve team numeric IDs to slugs.
 *   4. Fetch all `player_hotzones` and group by player ID.
 *   5. Map DB rows to domain `Player` — if `attributes` contains the 34-key
 *      sheet shape it is bucketed into aggregates; if already aggregate it is
 *      used directly.
 *
 * Results are cached at module scope. Call `clearTeamCache()` if a promotion
 * RPC has been executed and the caller needs fresh data.
 */
async function fetchPlayers(): Promise<Player[]> {
  if (cachedPlayers) return cachedPlayers;
  if (!isSupabaseReady) return [];

  const { data: players, error } = await supabase!
    .from('players')
    .select(PUBLIC_PLAYER_COLUMNS);

  if (error || !players || players.length === 0) return [];

  const { data: rosters } = await supabase!
    .from('roster_memberships')
    .select('player_id, team_id, roster_status, ends_at');

  const rosterMap = new Map<string, { teamId: string; teamDbId: string; status: string }>();
  if (rosters) {
    const { data: allTeams } = await supabase!.from('teams').select('id, slug');
    const teamSlugMap = new Map(allTeams?.map(t => [t.id, t.slug]) ?? []);
    for (const r of rosters) {
      if (r.ends_at === null && teamSlugMap.has(r.team_id)) {
        rosterMap.set(r.player_id, { teamId: teamSlugMap.get(r.team_id)!, teamDbId: r.team_id, status: r.roster_status });
      }
    }
  }

  const playerIds = players.map(p => p.id);
  const { data: hotzoneRows } = await supabase!
    .from('player_hotzones')
    .select('player_id, zone, status')
    .in('player_id', playerIds);

  const hotzoneMap = new Map<string, HotZone[]>();
  if (hotzoneRows) {
    for (const hz of hotzoneRows) {
      const list = hotzoneMap.get(hz.player_id) ?? [];
      list.push({ zone: hz.zone as HotZoneName, status: hz.status as HotZoneStatus });
      hotzoneMap.set(hz.player_id, list);
    }
  }

  cachedPlayers = (players as unknown as DbPlayer[]).map(p => {
    const rawAttrs = (p as unknown as { attributes?: Record<string, number> | null }).attributes ?? null;
    const isAggregate = rawAttrs && 'finishing' in rawAttrs;

    return {
      id: (p as unknown as { slug: string | null }).slug ?? p.id,
      dbId: p.id,
      gamertag: p.gamertag,
      position: p.primary_position as Player['position'],
      secondaryPositions: p.secondary_positions as Player['secondaryPositions'],
      archetype: p.archetype ?? '',
      teamId: rosterMap.get(p.id)?.teamId ?? '',
      teamDbId: rosterMap.get(p.id)?.teamDbId,
      overall: p.overall ?? 0,
      heightInches: p.height_inches,
      wingspan: p.wingspan_inches,
      ucBalance: 0,
      badges: (p as unknown as { badges?: string[] }).badges ?? [],
      status: p.status as Player['status'],
      trend: 'flat',
      attributes: isAggregate
        ? (rawAttrs as Player['attributes'])
        : computeAggregateAttributes(rawAttrs ?? {}),
      rawAttributes: undefined,
      hotZones: hotzoneMap.get(p.id) ?? [],
      tendencies: undefined,
      animations: p.animations,
    };
  });

  return cachedPlayers;
}

/*
 * Fetch all promoted players whose active roster membership belongs to a
 * specific team slug. Convenience wrapper around fetchPlayers().
 */
export async function fetchPlayersForTeam(teamSlug: string): Promise<Player[]> {
  const all = await fetchPlayers();
  return all.filter(p => p.teamId === teamSlug);
}

interface PlayerRow {
  roster_memberships: { team_id: string; roster_status: string; ends_at: string | null }[];
  player_hotzones: { zone: string; status: string }[];
}

async function buildPlayer(row: Record<string, unknown>, dbId: string, includePrivate = false): Promise<Player> {
  const p = row as unknown as DbPlayer & PlayerRow;

  const slug = (p as unknown as { slug: string | null }).slug;
  const activeMember = p.roster_memberships?.find(m => !m.ends_at);

  let teamId = '';
  if (activeMember?.team_id && supabase) {
    const { data } = await supabase!
      .from('teams')
      .select('slug')
      .eq('id', activeMember.team_id)
      .single();
    teamId = (data as unknown as { slug: string } | null)?.slug ?? '';
  }

  const rawAttrs = row['attributes'] as Record<string, number> | null;
  const isAggregate = rawAttrs && 'finishing' in rawAttrs;

  return {
    id: slug ?? p.id,
    dbId,
    gamertag: p.gamertag,
    position: p.primary_position as Player['position'],
    secondaryPositions: p.secondary_positions as Player['secondaryPositions'],
    archetype: p.archetype ?? '',
    teamId,
    teamDbId: activeMember?.team_id ?? undefined,
    overall: p.overall ?? 0,
    heightInches: p.height_inches,
    wingspan: p.wingspan_inches,
    ucBalance: 0,
      badges: p.badges ?? [],
    status: p.status as Player['status'],
    trend: 'flat',
    attributes: isAggregate
      ? (rawAttrs as Player['attributes'])
      : computeAggregateAttributes(rawAttrs ?? {}),
    rawAttributes: includePrivate ? (rawAttrs ?? {}) : undefined,
    hotZones: (p.player_hotzones ?? []).map(hz => ({
      zone: hz.zone as HotZoneName,
      status: hz.status as HotZoneStatus,
    })),
    tendencies: includePrivate ? p.tendencies as Record<string, number> | undefined : undefined,
    animations: p.animations,
  };
}

/*
 * Fetch a single promoted player by their slug (the canonical public
 * identifier used in URLs and displayed as the player badge).
 */
export async function fetchPlayerBySlug(slug: string, includePrivate = false): Promise<Player | null> {
  if (!isSupabaseReady) return null;

  if (cachedPlayers && !includePrivate) return cachedPlayers.find(p => p.id === slug) ?? null;

  const { data: player, error } = await (supabase! as any)
    .from('players')
    .select(`${includePrivate ? PRIVATE_PLAYER_COLUMNS : PUBLIC_PLAYER_COLUMNS}, roster_memberships!inner(team_id, roster_status, ends_at), player_hotzones(zone, status)`)
    .eq('slug', slug)
    .single();

  if (error || !player) return null;

  return buildPlayer(player as unknown as Record<string, unknown>, player.id as string, includePrivate);
}

/*
 * Fetch a single promoted player by their database UUID.
 */
export async function fetchPlayerById(id: string, includePrivate = false): Promise<Player | null> {
  if (!isSupabaseReady) return null;

  const { data: player, error } = await (supabase! as any)
    .from('players')
    .select(`${includePrivate ? PRIVATE_PLAYER_COLUMNS : PUBLIC_PLAYER_COLUMNS}, roster_memberships(team_id, roster_status, ends_at), player_hotzones(zone, status)`)
    .eq('id', id)
    .single();

  if (error || !player) return null;

  return buildPlayer(player as unknown as Record<string, unknown>, player.id as string, includePrivate);
}

function canPromoteSheetRow(row: Pick<SheetImportReviewRow, 'validationErrors' | 'matchedTeamSlug' | 'primaryPosition' | 'heightInches' | 'rosterStatus' | 'tendencyReviewStatus' | 'reviewStatus'>): boolean {
  return row.reviewStatus !== 'ignored'
    && row.reviewStatus !== 'promoted'
    && row.validationErrors.length === 0
    && !!row.matchedTeamSlug
    && !!row.primaryPosition
    && row.heightInches !== null
    && ['active', 'two_way', 'minor', 'inactive'].includes(row.rosterStatus)
    && !['needs_manual', 'invalid'].includes(row.tendencyReviewStatus);
}

/*
 * Fetch recent Google Sheets staging rows for the Import Review page.
 * This intentionally reads from the admin-only staging tables using the regular
 * Supabase client/session. If the viewer is not authenticated as an admin, RLS
 * returns no rows or an authorization error and the page shows an honest empty
 * state. That keeps the frontend simple while preserving the database as the
 * real security boundary.
 */
export async function fetchSheetImportReviewRows(limit = 200): Promise<SheetImportReviewRow[]> {
  if (!isSupabaseReady) return [];

  const { data, error } = await supabase!
    .from('sheet_import_player_rows')
    .select(`
      id,
      player_name,
      discord_handle,
      primary_position,
      height_text,
      height_inches,
      roster_status,
      two_way_ubanxt_label,
      tendency_review_status,
      tendency_source_label,
      validation_errors,
      review_status,
      promoted_player_id,
      source_row_numbers,
      teams(slug, name),
      team_sheet_sources(spreadsheet_title),
      sheet_import_runs(run_status)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as unknown as Array<DbSheetImportPlayerRow & {
    teams: { slug: string; name: string } | null;
    team_sheet_sources: { spreadsheet_title: string | null } | null;
    sheet_import_runs: { run_status: string } | null;
  }>).map((row) => {
    const mapped: SheetImportReviewRow = {
      id: row.id,
      playerName: row.player_name,
      discordHandle: row.discord_handle,
      primaryPosition: row.primary_position,
      heightText: row.height_text,
      heightInches: row.height_inches,
      rosterStatus: row.roster_status,
      twoWayUbanxtLabel: row.two_way_ubanxt_label,
      tendencyReviewStatus: row.tendency_review_status,
      tendencySourceLabel: row.tendency_source_label,
      validationErrors: row.validation_errors,
      reviewStatus: row.review_status,
      promotedPlayerId: row.promoted_player_id,
      sourceRowNumbers: row.source_row_numbers,
      matchedTeamName: row.teams?.name ?? null,
      matchedTeamSlug: row.teams?.slug ?? null,
      sourceName: row.team_sheet_sources?.spreadsheet_title ?? null,
      runStatus: row.sheet_import_runs?.run_status ?? null,
      canPromote: false,
    };

    return { ...mapped, canPromote: canPromoteSheetRow(mapped) };
  });
}

export async function promoteSheetImportPlayerRow(rowId: string): Promise<string> {
  if (!isSupabaseReady) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase!.rpc('promote_sheet_import_player_row', { player_row_id: rowId });
  if (error) throw new Error(error.message);
  return data;
}

export async function setSheetImportPlayerTendencies(rowId: string, tendencies: Record<string, number>): Promise<string> {
  if (!isSupabaseReady) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase!.rpc('set_sheet_import_player_tendencies', {
    player_row_id: rowId,
    reviewed_tendencies: tendencies,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchAuditEvents(): Promise<AuditEvent[]> {
  if (!isSupabaseReady) return [];
  const { data, error } = await supabase!
    .from('audit_events')
    .select('action, actor_role, actor_user_id, created_at, id, severity, target_id, target_table')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.warn('Audit fetch failed:', error.message); return []; }
  return ((data ?? []) as any[]).map(r => ({
    id: r.id,
    date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    actor: r.actor_role ?? r.actor_user_id ?? 'system',
    action: r.action,
    target: [r.target_table, r.target_id].filter(Boolean).join('/'),
    severity: r.severity as 'info' | 'review' | 'locked',
  }));
}

export async function fetchBankReviewRows(): Promise<BankReviewRow[]> {
  if (!isSupabaseReady) return [];
  const { data, error } = await supabase!
    .from('sheet_import_player_rows')
    .select('id, player_name, bank, bank_promoted_at, promoted_player_id, teams!inner(name, slug)')
    .not('bank', 'is', 'null')
    .order('player_name', { ascending: true });
  const rawRows = (data ?? []) as any[];
  const result: BankReviewRow[] = [];
  for (const r of rawRows) {
    if (!r.bank || typeof r.bank !== 'object' || Object.keys(r.bank).length === 0) continue;
    result.push({
      id: r.id,
      player_name: r.player_name,
      team_name: (r.teams as any)?.name ?? null,
      team_slug: (r.teams as any)?.slug ?? null,
      bank: r.bank as Record<string, number>,
      bank_promoted_at: r.bank_promoted_at ?? null,
      promoted_player_id: r.promoted_player_id ?? null,
    });
  }
  return result;
}

export async function promoteBankToUcLedger(rowId: string): Promise<{ created: number; skipped: number; player_id: string } | null> {
  if (!isSupabaseReady) return null;
  const { data, error } = await supabase!.rpc('promote_bank_to_uc_ledger' as any, { p_player_row_id: rowId });
  if (error) { console.warn('Bank promotion failed:', error.message); return null; }
  return data as unknown as { created: number; skipped: number; player_id: string };
}

/*
 * Clear all module-scoped caches so the next fetch* call re-queries Supabase.
 * Call this after any admin mutation that creates, updates, deletes, or promotes
 * any record.
 */
let cachedLeaderboard: LeaderboardEntry[] | null = null;

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (cachedLeaderboard) return cachedLeaderboard;
  if (!isSupabaseReady) { cachedLeaderboard = []; return []; }
  const { data, error } = await supabase!.rpc('get_uba_leaderboard' as any);
  if (error) { console.warn('Leaderboard fetch failed:', error.message); return []; }
  cachedLeaderboard = (data as unknown as LeaderboardEntry[]) ?? [];
  return cachedLeaderboard;
}

export async function fetchInjuries(): Promise<Injury[]> {
  if (!isSupabaseReady) return [];

  const { data, error } = await supabase!
    .from('injuries')
    .select('*, players!inner(id, gamertag, slug)')
    .order('injured_at', { ascending: false });

  if (error || !data) return [];

  return (data as unknown as Array<DbInjury & {
    players: { id: string; gamertag: string; slug: string | null };
  }>).map(row => ({
    id: row.id,
    playerId: row.player_id,
    injuryType: row.injury_type,
    severity: row.severity as Injury['severity'],
    bodyPart: row.body_part,
    description: row.description,
    injuredAt: row.injured_at,
    expectedReturn: row.expected_return,
    recoveredAt: row.recovered_at,
    status: row.status as Injury['status'],
    player: {
      id: row.players.slug ?? row.players.id,
      gamertag: row.players.gamertag,
      slug: row.players.slug ?? row.players.id,
    } as unknown as Player,
  }));
}

export async function fetchFreeAgentListings(): Promise<FreeAgencyListing[]> {
  if (!isSupabaseReady) return [];

  const { data, error } = await supabase!
    .from('free_agency_listings')
    .select('*')
    .order('listed_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    id: row.id,
    playerId: row.player_id,
    status: row.status as FreeAgencyListing['status'],
    askingUcBalance: row.asking_uc_balance,
    currentBidUc: row.current_bid_uc,
    currentBidTeamId: row.current_bid_team_id,
    listedAt: row.listed_at,
    expiresAt: row.expires_at,
    signedAt: row.signed_at,
    signedTeamId: row.signed_team_id,
  }));
}

export async function fetchTradeProposals(): Promise<TradeProposal[]> {
  if (!isSupabaseReady) return [];

  const { data, error } = await supabase!
    .from('trade_proposals')
    .select('*')
    .order('proposed_at', { ascending: false });

  if (error || !data) return [];

  const { data: allTeams } = await supabase!.from('teams').select('id, slug');
  const teamSlugMap = new Map(allTeams?.map(t => [t.id, t.slug]) ?? []);

  return data.map(row => ({
    id: row.id,
    proposerTeamId: teamSlugMap.get(row.proposer_team_id) ?? row.proposer_team_id,
    receiverTeamId: teamSlugMap.get(row.receiver_team_id) ?? row.receiver_team_id,
    proposerSendsPlayerIds: row.proposer_sends_player_ids,
    proposerSendsUcAmount: row.proposer_sends_uc_amount,
    receiverSendsPlayerIds: row.receiver_sends_player_ids,
    receiverSendsUcAmount: row.receiver_sends_uc_amount,
    status: row.status as TradeProposal['status'],
    proposedAt: row.proposed_at,
    proposedBy: row.proposed_by,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    adminNotes: row.admin_notes,
    expiresAt: row.expires_at,
  }));
}

export async function fetchGames(season = '2026'): Promise<Game[]> {
  if (!isSupabaseReady) return (await import('../data/schedule')).games;

  const { data, error } = await supabase!
    .from('games')
    .select('*')
    .eq('season', season)
    .order('scheduled_at', { ascending: true });

  if (error || !data || data.length === 0) return (await import('../data/schedule')).games;

  return (data as unknown as Array<Record<string, unknown>>).map((row: any) => ({
    id: row.id,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    scheduledAt: row.scheduled_at,
    homeScore: row.home_score ?? null,
    awayScore: row.away_score ?? null,
    status: row.status as Game['status'],
    week: row.week ?? null,
    season: row.season,
    location: row.location ?? null,
  }));
}

export type TeamSalarySummary = {
  team: Team;
  totalContracts: number;
  capSpace: number;
  rosterSpots: number;
  contractCount: number;
  salaryContracts: Record<string, number>;
};

export async function fetchTeamSalarySummaries(tier: 'UBA' | 'NXT' = 'UBA'): Promise<TeamSalarySummary[]> {
  if (!isSupabaseReady) {
    const { teamSalarySummaries: staticSummaries } = await import('../data/salaryCap');
    const teams = tier === 'UBA' ? (await import('../data/league')).mainLeagueTeams : (await import('../data/league')).nxtLeagueTeams;
    return staticSummaries(teams);
  }

  const { data, error } = await supabase!
    .from('teams')
    .select('slug, name, short_name, market, league, conference, primary_color, cap_space, roster_spots, salary_contracts')
    .eq('league', tier)
    .order('name');

  if (error || !data) {
    const { teamSalarySummaries: staticSummaries } = await import('../data/salaryCap');
    const teams = tier === 'UBA' ? (await import('../data/league')).mainLeagueTeams : (await import('../data/league')).nxtLeagueTeams;
    return staticSummaries(teams);
  }

  return data.map((row: any) => {
    const team: Team = {
      id: row.slug,
      name: row.name,
      shortName: row.short_name,
      market: row.market ?? row.name,
      league: row.league as 'UBA' | 'NXT',
      conference: row.conference as 'East' | 'West' | undefined,
      primaryColor: row.primary_color,
    };
    const contracts = (row.salary_contracts ?? {}) as Record<string, number>;
    const totalContracts = Object.values(contracts).reduce((sum: number, v: number) => sum + v, 0);
    return {
      team,
      totalContracts,
      capSpace: row.cap_space ?? 0,
      rosterSpots: row.roster_spots ?? 0,
      contractCount: Object.keys(contracts).length,
      salaryContracts: contracts,
    };
  });
}

export async function fetchSalaryCapConfig(season = '2026'): Promise<{ season: string; capAmount: number; luxuryTaxThreshold: number | null } | null> {
  if (!isSupabaseReady) {
    const { capConfigForSeason } = await import('../data/salaryCap');
    return capConfigForSeason(season) ?? null;
  }

  const { data, error } = await supabase!
    .from('salary_cap_config')
    .select('season, cap_amount, luxury_tax_threshold')
    .eq('season', season)
    .single();

  if (error || !data) {
    const { capConfigForSeason } = await import('../data/salaryCap');
    return capConfigForSeason(season) ?? null;
  }

  return {
    season: data.season,
    capAmount: data.cap_amount,
    luxuryTaxThreshold: data.luxury_tax_threshold ?? null,
  };
}

export type DashboardStats = {
  sheetsLinked: number;
  playerCount: number;
  nxtTeamCount: number;
  pendingImportCount: number;
  activeRosterCount: number;
  pendingTrades: number;
};

let cachedDashboardStats: DashboardStats | null = null;

export async function fetchNotifications(userId?: string): Promise<AppNotification[]> {
  if (!isSupabaseReady || !userId) return [];

  const { data, error } = await supabase!
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return (data as unknown as Array<Record<string, unknown>>).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as AppNotification['type'],
    title: row.title,
    body: row.body ?? '',
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    read: row.read ?? false,
    createdAt: row.created_at,
  }));
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  if (cachedDashboardStats) return cachedDashboardStats;
  if (!isSupabaseReady) {
    const nxtCount = (await import('../data/league')).nxtLeagueTeams.length;
    cachedDashboardStats = { sheetsLinked: 16, playerCount: 0, nxtTeamCount: nxtCount, pendingImportCount: 0, activeRosterCount: 0, pendingTrades: 0 };
    return cachedDashboardStats;
  }

  const [sheetsRes, playersRes, nxtRes, importsRes, rosterRes, tradesRes] = await Promise.all([
    supabase!.from('team_sheet_sources').select('id', { count: 'exact', head: true }).eq('source_status', 'active'),
    supabase!.from('players').select('id', { count: 'exact', head: true }),
    supabase!.from('teams').select('id', { count: 'exact', head: true }).eq('league', 'NXT'),
    supabase!.from('sheet_import_player_rows').select('id', { count: 'exact', head: true }).eq('review_status', 'needs_review'),
    supabase!.from('roster_memberships').select('id', { count: 'exact', head: true }).is('ends_at', null),
    supabase!.from('trade_proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  cachedDashboardStats = {
    sheetsLinked: sheetsRes.count ?? 0,
    playerCount: playersRes.count ?? 0,
    nxtTeamCount: nxtRes.count ?? 0,
    pendingImportCount: importsRes.count ?? 0,
    activeRosterCount: rosterRes.count ?? 0,
    pendingTrades: tradesRes.count ?? 0,
  };
  return cachedDashboardStats;
}

export async function fetchPlayerSeasonStats(season = 'S3', tier?: 'UBA' | 'NXT'): Promise<PlayerSeasonStat[]> {
  if (!isSupabaseReady) return [];

  let query = (supabase! as any)
    .from('player_season_stats')
    .select('*')
    .eq('season', season);

  if (tier) query = query.eq('tier', tier);

  const { data, error } = await query.order('pts_total', { ascending: false });

  if (error || !data) return [];

  const { data: rosterRows } = await (supabase! as any)
    .from('players')
    .select('gamertag, roster_memberships(roster_status, ends_at, teams(slug))');

  const rosterStatusByNameTeam = new Map<string, string>();
  const rosterStatusByName = new Map<string, string>();
  for (const row of (rosterRows ?? []) as Array<Record<string, any>>) {
    const name = normalizePlayerStatName(row['gamertag']);
    if (!name) continue;
    for (const membership of row['roster_memberships'] ?? []) {
      if (membership.ends_at !== null) continue;
      const status = String(membership.roster_status ?? '');
      const teamSlug = String(membership.teams?.slug ?? '').trim();
      rosterStatusByName.set(name, status);
      if (teamSlug) rosterStatusByNameTeam.set(`${name}|${teamSlug}`, status);
    }
  }

  return (data as Array<Record<string, unknown>>)
    .filter((row: any) => !isFillerPlayerName(row.player_name))
    .map((row: any) => {
      const normalizedName = normalizePlayerStatName(row.player_name);
      const teamName = row.team_name ?? '';
      const rosterStatus = rosterStatusByNameTeam.get(`${normalizedName}|${teamName}`) ?? rosterStatusByName.get(normalizedName);

      return ({
    id: row.id,
    season: row.season,
    tier: row.tier ?? 'UBA',
    playerName: row.player_name,
    teamName: row.team_name,
    position: row.position,
    rosterStatus,
    gp: row.gp,
    minTotal: row.min_total,
    ptsTotal: row.pts_total,
    rebTotal: row.reb_total,
    astTotal: row.ast_total,
    stlTotal: row.stl_total,
    blkTotal: row.blk_total,
    turnoversTotal: row.turnovers_total,
    fgm: row.fgm,
    fga: row.fga,
    threePtm: row.three_ptm,
    threePta: row.three_pta,
    ftm: row.ftm,
    fta: row.fta,
    fgPct: row.fg_pct,
    threePtPct: row.three_pt_pct,
    ftPct: row.ft_pct,
    tsPct: row.ts_pct,
    efgPct: row.efg_pct,
    score: row.score,
    fls: row.fls,
    prf: row.prf,
    dnk: row.dnk,
    dd: row.dd,
    td: row.td,
    twentyPlusPts: row.twenty_plus_pts,
    gameHighs: (row.game_highs ?? {}) as Record<string, number | null>,
    gameAverages: (row.game_averages ?? {}) as Record<string, number | null>,
  });
    });
}

export async function clearTeamCache(): Promise<void> {
  cachedTeams = null;
  cachedUbaTeams = null;
  cachedNxtTeams = null;
  cachedPlayers = null;
  cachedLeaderboard = null;
  cachedDashboardStats = null;
}
