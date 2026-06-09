#!/usr/bin/env node
/*
 * NXT S3 Player Stats Importer
 *
 * Reads the NXT S3 Player Stats Google Sheet tab via public CSV export
 * and upserts rows into the player_season_stats table with tier='NXT'.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync-nxt-player-stats.mjs
 *
 * Dry-run mode by default. Pass --write to commit.
 */

import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const SHEET_ID = '1rkVyhgGVASxqHL3NbPZ0NOmsKxekLQCtBNb6WQaIU8Y';
const PLAYER_STATS_GID = '2106129791';
const SEASON = 'S3';
const TIER = 'NXT';

const COL = {
  POS: 1,
  NAME: 2,
  TEAM: 3,
  GP: 4,
  MIN: 5,
  PTS: 6,
  REB: 7,
  AST: 8,
  STL: 9,
  BLK: 10,
  TO: 11,
  FGM: 12,
  FGA: 13,
  THREE_PTM: 14,
  THREE_PTA: 15,
  FTM: 16,
  FTA: 17,
  FG_PCT: 18,
  THREE_PT_PCT: 19,
  FT_PCT: 20,
  TS_PCT: 21,
  EFG_PCT: 22,
  SCORE: 23,
  FLS: 24,
  PRF: 25,
  DNK: 26,
  DD: 27,
  TD: 28,
  TWENTY_PLUS_PTS: 29,
  GH_MIN: 31,
  GH_PTS: 32,
  GH_REB: 33,
  GH_AST: 34,
  GH_STL: 35,
  GH_BLK: 36,
  GH_PRF: 37,
  GA_MIN: 39,
  GA_PTS: 40,
  GA_REB: 41,
  GA_AST: 42,
  GA_STL: 43,
  GA_BLK: 44,
  GA_SCORE: 45,
};

function parsePct(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/%/g, '').trim();
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n / 100;
}

function parseIntVal(value) {
  if (!value) return null;
  const n = parseInt(String(value).replace(/,/g, ''), 10);
  return Number.isNaN(n) ? null : n;
}

function parseFloatVal(value) {
  if (!value) return null;
  const n = parseFloat(String(value));
  return Number.isNaN(n) ? null : n;
}

function normalizeTeamCode(value) {
  return String(value ?? '').split('/')[0]?.trim() ?? '';
}

function isFillerPlayer(name) {
  return String(name ?? '').trim().toLowerCase().includes('filler player');
}

async function fetchCsv() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${PLAYER_STATS_GID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  return text.split('\n').map(line => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { cells.push(current); current = ''; continue; }
      current += ch;
    }
    cells.push(current);
    return cells;
  });
}

function parseRows(rawRows) {
  const players = [];
  let headerFound = false;

  for (const row of rawRows) {
    const name = (row[COL.NAME] ?? '').trim();
    const pos = (row[COL.POS] ?? '').trim();

    if (!headerFound) {
      if (name === 'NAME') { headerFound = true; }
      continue;
    }

    if (!name || !pos || isFillerPlayer(name)) continue;
    if (/^[A-Z\s]+$/.test(pos) && name === name.toUpperCase() && pos.length > 2) continue;

    const team = normalizeTeamCode(row[COL.TEAM]);
    if (!team) continue;

    players.push({
      season: SEASON,
      tier: TIER,
      player_name: name,
      team_name: team,
      position: pos,
      gp: parseIntVal(row[COL.GP]),
      min_total: parseIntVal(row[COL.MIN]),
      pts_total: parseIntVal(row[COL.PTS]),
      reb_total: parseIntVal(row[COL.REB]),
      ast_total: parseIntVal(row[COL.AST]),
      stl_total: parseIntVal(row[COL.STL]),
      blk_total: parseIntVal(row[COL.BLK]),
      turnovers_total: parseIntVal(row[COL.TO]),
      fgm: parseIntVal(row[COL.FGM]),
      fga: parseIntVal(row[COL.FGA]),
      three_ptm: parseIntVal(row[COL.THREE_PTM]),
      three_pta: parseIntVal(row[COL.THREE_PTA]),
      ftm: parseIntVal(row[COL.FTM]),
      fta: parseIntVal(row[COL.FTA]),
      fg_pct: parsePct(row[COL.FG_PCT]),
      three_pt_pct: parsePct(row[COL.THREE_PT_PCT]),
      ft_pct: parsePct(row[COL.FT_PCT]),
      ts_pct: parsePct(row[COL.TS_PCT]),
      efg_pct: parsePct(row[COL.EFG_PCT]),
      score: parseIntVal(row[COL.SCORE]),
      fls: parseIntVal(row[COL.FLS]),
      prf: parseIntVal(row[COL.PRF]),
      dnk: parseIntVal(row[COL.DNK]),
      dd: parseIntVal(row[COL.DD]),
      td: parseIntVal(row[COL.TD]),
      twenty_plus_pts: parseIntVal(row[COL.TWENTY_PLUS_PTS]),
      game_highs: {
        min: parseIntVal(row[COL.GH_MIN]),
        pts: parseIntVal(row[COL.GH_PTS]),
        reb: parseIntVal(row[COL.GH_REB]),
        ast: parseIntVal(row[COL.GH_AST]),
        stl: parseIntVal(row[COL.GH_STL]),
        blk: parseIntVal(row[COL.GH_BLK]),
        prf: parseIntVal(row[COL.GH_PRF]),
      },
      game_averages: {
        min: parseFloatVal(row[COL.GA_MIN]),
        pts: parseFloatVal(row[COL.GA_PTS]),
        reb: parseFloatVal(row[COL.GA_REB]),
        ast: parseFloatVal(row[COL.GA_AST]),
        stl: parseFloatVal(row[COL.GA_STL]),
        blk: parseFloatVal(row[COL.GA_BLK]),
        score: parseFloatVal(row[COL.GA_SCORE]),
      },
    });
  }
  return players;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const writeMode = args.has('--write');

  console.log(`Fetching NXT S3 player stats from sheet ${SHEET_ID}...`);
  const rawRows = await fetchCsv();
  console.log(`Raw CSV rows: ${rawRows.length}`);

  const players = parseRows(rawRows);
  console.log(`Parsed players: ${players.length}`);

  if (!writeMode) {
    console.log('\n--- DRY RUN ---');
    console.log(`Pass --write to upsert into player_season_stats (season=${SEASON}, tier=${TIER})`);
    const byTeam = {};
    for (const p of players) {
      byTeam[p.team_name] = (byTeam[p.team_name] || 0) + 1;
    }
    for (const [team, count] of Object.entries(byTeam).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${team}: ${count} players`);
    }
    console.log(`Total: ${players.length} players`);
    return;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required with --write');
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const player of players) {
    const { error } = await supabase
      .from('player_season_stats')
      .upsert(player, { onConflict: 'season,tier,player_name' });

    if (error) {
      console.error(`  Error for ${player.player_name}: ${error.message}`);
      errors++;
    } else {
      if (player.gp > 0) inserted++;
      else updated++;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
