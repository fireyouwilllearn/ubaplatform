#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const defaultManifestPath = path.join(repoRoot, 'docs/local/team_sheet_sources.json');
const defaultOAuthClientPath = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_PATH ?? path.join(os.homedir(), '.config/google-sheets/oauth.json');
const defaultOAuthTokenPath = process.env.GOOGLE_SHEETS_OAUTH_TOKEN_PATH ?? path.join(os.homedir(), '.config/google-sheets/token.json');

const args = new Set(process.argv.slice(2));
const argList = process.argv.slice(2);

if (args.has('--help') || args.has('-h')) {
  printHelp();
  process.exit(0);
}

const writeMode = args.has('--write');
const showDetails = args.has('--details');
const selectedSource = readArgValue('--source');
const reportPath = readArgValue('--report');
const manifestPath = readArgValue('--manifest') ?? process.env.TEAM_SHEET_MANIFEST_PATH ?? defaultManifestPath;

const template = await loadTemplateConstants();
const manifest = await readJson(manifestPath);
const sources = normalizeManifest(manifest).filter((source) => {
  if (source.active === false) return false;
  if (!selectedSource) return true;
  return source.team_slug === selectedSource || source.spreadsheet_id === selectedSource || source.team_name === selectedSource;
});

if (sources.length === 0) {
  throw new Error(selectedSource ? `No active source matched ${selectedSource}` : 'No active sheet sources found in manifest');
}

const accessToken = await getGoogleAccessToken();
const supabase = writeMode ? createSupabaseAdminClient() : null;
const results = [];

for (const source of sources) {
  const result = await syncSource(source, accessToken, supabase);
  results.push(result);
  printSourceSummary(result);
}

const totalPlayers = results.reduce((sum, result) => sum + result.playerRows.length, 0);
const totalManualTendencies = results.reduce((sum, result) => sum + result.playerRows.filter((row) => row.tendency_review_status === 'needs_manual').length, 0);
const reviewDetails = buildReviewDetails(results);

console.log(JSON.stringify({
  mode: writeMode ? 'write' : 'dry-run',
  sources: results.length,
  players: totalPlayers,
  needs_manual_tendencies: totalManualTendencies,
  review_rows: reviewDetails.length,
}, null, 2));

if (showDetails) {
  printReviewDetails(reviewDetails);
}

if (reportPath) {
  await writeFile(reportPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    mode: writeMode ? 'write' : 'dry-run',
    sources: results.map((result) => ({
      team_slug: result.source.team_slug,
      team_name: result.source.team_name,
      spreadsheet_id: result.source.spreadsheet_id,
      spreadsheet_title: result.spreadsheetTitle,
      player_rows: result.playerRows.length,
    })),
    totals: {
      sources: results.length,
      players: totalPlayers,
      needs_manual_tendencies: totalManualTendencies,
      review_rows: reviewDetails.length,
    },
    review_rows: reviewDetails,
  }, null, 2));
  console.log(`Wrote review report to ${reportPath}`);
}

function printHelp() {
  console.log(`Usage: npm run sheets:sync -- [options]

Reads team-owned Google Sheets and stages raw snapshots plus normalized player rows.
The command is dry-run by default. Use --write only when SUPABASE_SERVICE_ROLE_KEY
is set and you are ready to write into the 0014 staging tables.

Options:
  --write                 Insert snapshots/player rows into Supabase staging tables.
  --source <slug|id|name> Only sync one manifest source.
  --manifest <path>       Manifest JSON path. Defaults to docs/local/team_sheet_sources.json.
  --details               Print row-level review details after the summary.
  --report <path>         Write row-level review details to a JSON file.
  --help                  Show this help.

Environment:
  GOOGLE_SHEETS_OAUTH_CLIENT_PATH  Defaults to ${defaultOAuthClientPath}
  GOOGLE_SHEETS_OAUTH_TOKEN_PATH   Defaults to ${defaultOAuthTokenPath}
  TEAM_SHEET_MANIFEST_PATH         Optional manifest path override
  SUPABASE_URL                     Required with --write
  SUPABASE_SERVICE_ROLE_KEY        Required with --write; never expose to frontend
`);
}

function readArgValue(name) {
  const index = argList.indexOf(name);
  return index >= 0 ? argList[index + 1] : undefined;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function normalizeManifest(manifest) {
  const rawSources = Array.isArray(manifest) ? manifest : manifest.sources;

  if (!Array.isArray(rawSources)) {
    throw new Error('Manifest must be an array or an object with a sources array');
  }

  return rawSources.map((source) => ({
    active: true,
    tabs: {},
    ...source,
  }));
}

async function loadTemplateConstants() {
  const templateSource = await readFile(path.join(repoRoot, 'src/lib/teamSheetTemplate.ts'), 'utf8');
  const domainSource = await readFile(path.join(repoRoot, 'src/types/domain.ts'), 'utf8');

  return {
    teamSheetTabs: extractStringArray(templateSource, 'teamSheetTabs'),
    playerSheetHeaders: extractStringArray(templateSource, 'playerSheetHeaders'),
    attributeSheetHeaders: extractStringArray(templateSource, 'attributeSheetHeaders'),
    badgeSheetHeaders: extractStringArray(templateSource, 'badgeSheetHeaders'),
    bankSheetHeaders: extractStringArray(templateSource, 'bankSheetHeaders'),
    allTendencyNames: extractStringArray(domainSource, 'allTendencyNames'),
    hotzoneHeaders: [
      'Under Basket',
      'Close Left',
      'Close Middle',
      'Close Right',
      'Mid-Range Left',
      'Mid-Range Left Center',
      'Mid-Range Center',
      'Mid-Range Right Center',
      'Mid-Range Right',
      '3pt Left',
      '3pt Left Center',
      '3pt Center',
      '3pt Right Center',
      '3pt Right',
    ],
  };
}

function extractStringArray(source, constName) {
  const match = source.match(new RegExp(`export const ${constName} = \\[([\\s\\S]*?)\\] as const;`));

  if (!match?.[1]) {
    throw new Error(`Could not extract ${constName}`);
  }

  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

async function getGoogleAccessToken() {
  const clientPath = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_PATH ?? defaultOAuthClientPath;
  const tokenPath = process.env.GOOGLE_SHEETS_OAUTH_TOKEN_PATH ?? defaultOAuthTokenPath;
  const clientConfig = await readJson(clientPath);
  const token = await readJson(tokenPath);
  const oauthClient = clientConfig.installed ?? clientConfig.web ?? clientConfig;

  if (token.access_token && token.expiry_date && Number(token.expiry_date) > Date.now() + 60_000) {
    return token.access_token;
  }

  if (!token.refresh_token) {
    throw new Error(`OAuth token at ${tokenPath} does not include a refresh_token. Re-run the MCP OAuth flow.`);
  }

  const body = new URLSearchParams({
    client_id: oauthClient.client_id,
    client_secret: oauthClient.client_secret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const refreshed = await response.json();

  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${JSON.stringify(refreshed)}`);
  }

  const nextToken = {
    ...token,
    ...refreshed,
    expiry_date: Date.now() + Number(refreshed.expires_in ?? 3600) * 1000,
  };
  await writeFile(tokenPath, JSON.stringify(nextToken, null, 2));
  return nextToken.access_token;
}

function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required with --write');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket },
  });
}

async function syncSource(source, accessToken, supabase) {
  assertSource(source);

  const tabs = resolveTabs(source.tabs ?? {}, []);
  const ranges = Object.entries(tabs).map(([key, tabName]) => ({ key, tabName, range: quoteRange(tabName) }));
  const values = await batchGetValues(source.spreadsheet_id, ranges.map((range) => range.range), accessToken);
  const snapshots = ranges.map((range, index) => ({
    tab_key: range.key,
    tab_name: range.tabName,
    range_a1: range.range,
    row_count: values[index]?.length ?? 0,
    raw_values: values[index] ?? [],
  }));
  const sheetMap = Object.fromEntries(snapshots.map((snapshot) => [snapshot.tab_key, snapshot.raw_values]));
  const playerRows = normalizePlayerRows(source, sheetMap);

  const result = {
    source,
    spreadsheetTitle: source.spreadsheet_title ?? source.team_name,
    snapshots,
    playerRows,
  };

  if (supabase) {
    await writeStagingRows(result, supabase);
  }

  return result;
}

function assertSource(source) {
  for (const key of ['team_slug', 'team_name', 'spreadsheet_id']) {
    if (!source[key]) {
      throw new Error(`Manifest source is missing ${key}: ${JSON.stringify(source)}`);
    }
  }
}

function resolveTabs(configuredTabs, availableTitles) {
  const fallback = {
    players: 'Players',
    bank: 'Bank',
    attributes: 'Attributes',
    badges: 'Badges',
    tendencies: 'Tendencies',
    misc: 'Misc.',
  };
  const resolved = { ...fallback, ...configuredTabs };
  const normalizedAvailable = new Map(availableTitles.map((title) => [normalizeHeader(title), title]));

  return Object.fromEntries(Object.entries(resolved).map(([key, tabName]) => {
    const normalized = normalizeHeader(tabName);
    const actual = normalizedAvailable.get(normalized) ?? normalizedAvailable.get(normalized.replace(/\.$/, '')) ?? tabName;
    return [key, actual];
  }));
}

function quoteRange(tabName) {
  return `'${tabName.replace(/'/g, "''")}'!A:ZZ`;
}

async function batchGetValues(spreadsheetId, ranges, accessToken) {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet`);
  url.searchParams.set('majorDimension', 'ROWS');
  url.searchParams.set('valueRenderOption', 'FORMATTED_VALUE');
  for (const range of ranges) {
    url.searchParams.append('ranges', range);
  }
  let lastPayload = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const payload = await response.json();

    if (response.ok) {
      return payload.valueRanges?.map((range) => range.values ?? []) ?? [];
    }

    lastPayload = payload;
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 3) break;
    await sleep((attempt + 1) * 5_000);
  }

  throw new Error(`Failed to fetch sheet values for ${spreadsheetId}: ${JSON.stringify(lastPayload)}`);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizePlayerRows(source, sheets) {
  const players = readNamedRows(sheets.players, template.playerSheetHeaders);
  const attributes = indexByName(readNamedRows(sheets.attributes, template.attributeSheetHeaders));
  const badges = indexByName(readNamedRows(sheets.badges, template.badgeSheetHeaders));
  const bank = indexByName(readNamedRows(sheets.bank, template.bankSheetHeaders));
  const misc = indexByName(readNamedRows(sheets.misc, [...template.hotzoneHeaders, 'Wingspan', 'Secondary Position']));
  const tendencies = indexByName(readNamedRows(sheets.tendencies, template.allTendencyNames));

  return players.map((player) => {
    const nameKey = normalizeName(player.name);
    const attributeRow = attributes.get(nameKey);
    const badgeRow = badges.get(nameKey);
    const bankRow = bank.get(nameKey);
    const miscRow = misc.get(nameKey);
    const tendencyRow = tendencies.get(nameKey) ?? findManualTendencyRow(sheets.tendencies, player.name);
    const tendencyReview = reviewTendencyRow(tendencyRow);

    return {
      matched_team_id: null,
      source_row_key: `${source.team_slug}:${nameKey}`,
      source_row_numbers: {
        players: player.rowNumber,
        attributes: attributeRow?.rowNumber,
        badges: badgeRow?.rowNumber,
        bank: bankRow?.rowNumber,
        misc: miscRow?.rowNumber,
        tendencies: tendencyRow?.rowNumber,
      },
      player_name: player.name,
      discord_handle: player.values['Discord name'] ?? null,
      primary_position: normalizePosition(player.values['Position'] ?? ''),
      secondary_positions: splitPositions(miscRow?.values['Secondary Position'] ?? ''),
      height_text: player.values['Height'] ?? null,
      height_inches: parseHeightInches(player.values['Height'] ?? ''),
      wingspan_value: parseInteger(miscRow?.values['Wingspan'] ?? ''),
      weight: parseInteger(player.values['Weight'] ?? ''),
      drafted_or_free_agent: player.values['Drafted/Free Agent'] ?? null,
      season_joined: player.values['Season Joined'] ?? null,
      two_way_ubanxt_label: player.values['2 way/UBAnxt'] ?? null,
      roster_status: normalizeRosterStatus(player.values['2 way/UBAnxt'] ?? ''),
      attributes: readNumericValues(attributeRow, template.attributeSheetHeaders),
      badges: readBadgeValues(badgeRow),
      tendencies: tendencyReview.values,
      tendency_review_status: tendencyReview.status,
      tendency_source_label: tendencyReview.manualLabel ?? null,
      hotzones: readHotzones(miscRow),
      bank: readNumericValues(bankRow, template.bankSheetHeaders),
      validation_errors: collectValidationErrors(player, tendencyReview),
      review_status: 'needs_review',
      raw_payload: {
        players: player.raw,
        attributes: attributeRow?.raw,
        badges: badgeRow?.raw,
        bank: bankRow?.raw,
        misc: miscRow?.raw,
        tendencies: tendencyRow?.raw,
      },
    };
  });
}

function readNamedRows(rows = [], expectedHeaders) {
  const headerInfo = findHeaderRow(rows, expectedHeaders);

  if (!headerInfo) {
    return [];
  }

  return rows.slice(headerInfo.index + 1).map((row, offset) => {
    const name = String(row[headerInfo.nameIndex] ?? '').trim();

    if (!name || /^blue numbers|^purple numbers|^red numbers|^green numbers/i.test(name)) {
      return null;
    }

    return {
      name,
      rowNumber: headerInfo.index + offset + 2,
      values: Object.fromEntries(expectedHeaders.map((header) => [header, String(row[headerInfo.columns.get(normalizeHeader(header))] ?? '').trim()])),
      raw: row,
    };
  }).filter(Boolean);
}

function findHeaderRow(rows, expectedHeaders) {
  for (let index = 0; index < Math.min(rows.length, 8); index += 1) {
    const row = rows[index] ?? [];

    // First pass: exact matches only
    const columns = new Map();
    row.forEach((cell, columnIndex) => {
      const normalizedCell = normalizeHeader(String(cell ?? ''));
      if (!normalizedCell) return;

      for (const header of ['Name', ...expectedHeaders]) {
        const normalizedHeader = normalizeHeader(header);
        if (normalizedCell === normalizedHeader) {
          columns.set(normalizedHeader, columnIndex);
        }
      }
    });

    // Second pass: endsWith fallback for unmatched headers
    row.forEach((cell, columnIndex) => {
      const normalizedCell = normalizeHeader(String(cell ?? ''));
      if (!normalizedCell) return;

      for (const header of ['Name', ...expectedHeaders]) {
        const normalizedHeader = normalizeHeader(header);
        if (!columns.has(normalizedHeader) && normalizedCell.endsWith(normalizedHeader)) {
          columns.set(normalizedHeader, columnIndex);
        }
      }
    });

    const nameIndex = columns.get('name');
    if (nameIndex !== undefined) {
      return { index, nameIndex, columns };
    }
  }

  return null;
}

function indexByName(rows) {
  return new Map(rows.map((row) => [normalizeName(row.name), row]));
}

function normalizeHeader(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeName(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parseInteger(value) {
  const normalized = String(value).replace(/,/g, '').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseHeightInches(value) {
  const normalized = String(value).trim();
  const match = /^(?<feet>[5-7])\s*["']\s*(?<inches>\d{0,2})\s*"?$/.exec(normalized);
  if (!match?.groups) return null;
  const inches = match.groups.inches ? Number(match.groups.inches) : 0;
  return inches <= 11 ? Number(match.groups.feet) * 12 + inches : null;
}

function normalizePosition(value) {
  const normalized = String(value).trim().toUpperCase();
  return ['PG', 'SG', 'SF', 'PF', 'C'].includes(normalized) ? normalized : null;
}

function splitPositions(value) {
  return String(value).split(/[,&/ ]+/).map(normalizePosition).filter(Boolean);
}

function normalizeRosterStatus(value) {
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return 'active';
  if (normalized.includes('2 way') || normalized.includes('two way') || normalized.includes('twoway')) return 'two_way';
  if (normalized.includes('ubanxt') || normalized.includes('nxt')) return 'minor';
  return 'needs_review';
}

function readNumericValues(row, headers) {
  if (!row) return {};
  return Object.fromEntries(headers.map((header) => [header, parseInteger(row.values[header] ?? '')]).filter(([, value]) => value !== null));
}

function readBadgeValues(row) {
  if (!row) return {};
  return Object.fromEntries(template.badgeSheetHeaders.map((header) => {
    const normalized = String(row.values[header] ?? '').trim().toLowerCase();
    const tier = normalized === 'hall of fame' ? 'hof' : normalized;
    return [header, ['bronze', 'silver', 'gold', 'hof', 'legend'].includes(tier) ? tier : null];
  }).filter(([, tier]) => tier));
}

function readHotzones(row) {
  if (!row) return {};
  return Object.fromEntries(template.hotzoneHeaders.map((header) => {
    const value = String(row.values[header] ?? '').trim().toLowerCase();
    const zoneKey = hotzoneKey(header);
    if (!value) return [zoneKey, null];
    if (value.includes('lethal')) return [zoneKey, 'lethal'];
    if (value.includes('hot')) return [zoneKey, 'hot'];
    return [zoneKey, 'neutral'];
  }).filter(([, value]) => value));
}

function hotzoneKey(label) {
  const keyByLabel = {
    'Under Basket': 'under_basket',
    'Close Left': 'close_left',
    'Close Middle': 'close_middle',
    'Close Right': 'close_right',
    'Mid-Range Left': 'mid_range_left',
    'Mid-Range Left Center': 'mid_range_left_center',
    'Mid-Range Center': 'mid_range_center',
    'Mid-Range Right Center': 'mid_range_right_center',
    'Mid-Range Right': 'mid_range_right',
    '3pt Left': 'three_left',
    '3pt Left Center': 'three_left_center',
    '3pt Center': 'three_center',
    '3pt Right Center': 'three_right_center',
    '3pt Right': 'three_right',
  };
  return keyByLabel[label] ?? normalizeHeader(label);
}

function findManualTendencyRow(rows = [], playerName) {
  const key = normalizeName(playerName);
  const found = rows.find((row) => normalizeName(row.join(' ')).includes(key) && /https?:\/\/|tends?|tendenc/i.test(row.join(' ')));
  return found ? { name: playerName, rowNumber: rows.indexOf(found) + 1, values: {}, raw: found } : null;
}

function reviewTendencyRow(row) {
  if (!row) return { status: 'empty', values: {} };
  const cells = template.allTendencyNames.map((header) => row.values?.[header] ?? '').map(String);
  const numbers = cells.map(parseInteger);
  const complete = numbers.length === template.allTendencyNames.length && numbers.every((value) => value !== null && value >= 0 && value <= 100);

  if (complete) {
    return {
      status: 'complete',
      values: Object.fromEntries(template.allTendencyNames.map((name, index) => [name, numbers[index]])),
    };
  }

  const positionalCells = (row.raw ?? []).slice(1).map(String).filter((cell) => cell.trim());
  const positionalNumbers = positionalCells.map(parseInteger);
  const positionalComplete = positionalNumbers.length === template.allTendencyNames.length
    && positionalNumbers.every((value) => value !== null && value >= 0 && value <= 100);

  if (positionalComplete) {
    return {
      status: 'complete',
      values: Object.fromEntries(template.allTendencyNames.map((name, index) => [name, positionalNumbers[index]])),
    };
  }

  const rawText = row.raw?.join(' | ') ?? '';
  if (!rawText.trim()) return { status: 'empty', values: {} };
  return {
    status: /https?:\/\/|tends?|tendenc/i.test(rawText) ? 'needs_manual' : 'invalid',
    values: {},
    manualLabel: rawText,
  };
}

function collectValidationErrors(player, tendencyReview) {
  const errors = [];
  if (!normalizePosition(player.values['Position'] ?? '')) errors.push('invalid_position');
  if (!parseHeightInches(player.values['Height'] ?? '')) errors.push('invalid_height');
  if (tendencyReview.status === 'invalid') errors.push('invalid_tendencies');
  if (tendencyReview.status === 'needs_manual') errors.push('manual_tendencies_required');
  return errors;
}

async function writeStagingRows(result, supabase) {
  const { source, spreadsheetTitle, snapshots, playerRows } = result;
  const teamId = await findTeamId(source.team_slug, supabase);
  const sourceRecord = await upsertSource(source, spreadsheetTitle, teamId, supabase);
  const runRecord = await insertRun(sourceRecord.id, supabase);
  const stampedSnapshots = snapshots.map((snapshot) => ({ ...snapshot, run_id: runRecord.id }));

  const { error: snapshotError } = await supabase.from('sheet_import_snapshots').insert(stampedSnapshots);
  if (snapshotError) throw snapshotError;

  const stampedRows = playerRows.map((row) => ({
    ...row,
    run_id: runRecord.id,
    source_id: sourceRecord.id,
    matched_team_id: teamId,
  }));
  if (stampedRows.length) {
    const { error: rowError } = await supabase.from('sheet_import_player_rows').insert(stampedRows);
    if (rowError) throw rowError;
  }

  const summary = {
    spreadsheet_title: spreadsheetTitle,
    snapshot_tabs: snapshots.length,
    player_rows: playerRows.length,
    needs_manual_tendencies: playerRows.filter((row) => row.tendency_review_status === 'needs_manual').length,
    invalid_rows: playerRows.filter((row) => row.validation_errors.length > 0).length,
  };
  const { error: runError } = await supabase.from('sheet_import_runs').update({
    run_status: summary.invalid_rows > 0 || summary.needs_manual_tendencies > 0 ? 'needs_review' : 'succeeded',
    finished_at: new Date().toISOString(),
    summary,
  }).eq('id', runRecord.id);
  if (runError) throw runError;

  const { error: sourceError } = await supabase.from('team_sheet_sources').update({ last_import_run_id: runRecord.id }).eq('id', sourceRecord.id);
  if (sourceError) throw sourceError;
}

async function findTeamId(teamSlug, supabase) {
  const { data, error } = await supabase.from('teams').select('id').eq('slug', teamSlug).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function upsertSource(source, spreadsheetTitle, teamId, supabase) {
  const { data, error } = await supabase.from('team_sheet_sources').upsert({
    team_id: teamId,
    spreadsheet_id: source.spreadsheet_id,
    spreadsheet_title: source.spreadsheet_title ?? spreadsheetTitle,
    source_status: source.source_status ?? 'active',
    tabs: source.tabs ?? {},
    notes: source.notes ?? null,
  }, { onConflict: 'spreadsheet_id' }).select('*').single();
  if (error) throw error;
  return data;
}

async function insertRun(sourceId, supabase) {
  const { data, error } = await supabase.from('sheet_import_runs').insert({
    source_id: sourceId,
    run_status: 'running',
    trigger_source: 'manual',
  }).select('*').single();
  if (error) throw error;
  return data;
}

function printSourceSummary(result) {
  const manualTendencies = result.playerRows.filter((row) => row.tendency_review_status === 'needs_manual').length;
  const invalidRows = result.playerRows.filter((row) => row.validation_errors.length > 0).length;
  console.log(`${result.source.team_name}: ${result.playerRows.length} players, ${manualTendencies} manual tendencies, ${invalidRows} rows needing review`);
}

function buildReviewDetails(results) {
  return results.flatMap((result) => result.playerRows.filter((row) => (
    row.validation_errors.length > 0
    || row.tendency_review_status === 'needs_manual'
    || row.tendency_review_status === 'invalid'
    || row.roster_status === 'needs_review'
  )).map((row) => ({
    team_slug: result.source.team_slug,
    team_name: result.source.team_name,
    player_name: row.player_name,
    discord_handle: row.discord_handle,
    source_row_numbers: row.source_row_numbers,
    sheet_presence: Object.fromEntries(Object.entries(row.source_row_numbers).map(([key, value]) => [key, Boolean(value)])),
    primary_position: row.primary_position,
    height_text: row.height_text,
    height_inches: row.height_inches,
    roster_status: row.roster_status,
    two_way_ubanxt_label: row.two_way_ubanxt_label,
    tendency_review_status: row.tendency_review_status,
    tendency_source_label: row.tendency_source_label,
    validation_errors: row.validation_errors,
  })));
}

function printReviewDetails(reviewDetails) {
  if (reviewDetails.length === 0) {
    console.log('No rows need manual review.');
    return;
  }

  console.log('\nRows needing review:');
  for (const row of reviewDetails) {
    const rowNumber = row.source_row_numbers.players ? `Players row ${row.source_row_numbers.players}` : 'unknown row';
    const reasons = row.validation_errors.length ? row.validation_errors.join(', ') : row.tendency_review_status;
    console.log(`- ${row.team_name} / ${row.player_name} (${rowNumber}): ${reasons}`);
    if (row.validation_errors.includes('invalid_height')) {
      console.log(`  height: ${row.height_text || '<blank>'}`);
    }
    if (row.tendency_source_label) {
      console.log(`  tendency source: ${row.tendency_source_label}`);
    }
    if (row.two_way_ubanxt_label) {
      console.log(`  2 way/UBAnxt: ${row.two_way_ubanxt_label}`);
    }
  }
}
