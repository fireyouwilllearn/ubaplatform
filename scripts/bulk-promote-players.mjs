#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { readFileSync } from 'fs';
import process from 'node:process';

globalThis.WebSocket = WebSocket;

const args = process.argv.slice(2);
const writeMode = args.includes('--write');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

const envRaw = readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1')];
    })
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function makeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `player-${Date.now()}`;
}

function extractBadgeNames(badges) {
  if (!badges || typeof badges !== 'object') return [];
  return Object.entries(badges)
    .filter(([, v]) => ['bronze', 'silver', 'gold', 'hof', 'legend'].includes(v))
    .map(([k]) => k);
}

function extractHotzones(hotzones) {
  if (!hotzones || typeof hotzones !== 'object') return [];
  return Object.entries(hotzones)
    .filter(([, v]) => ['hot', 'lethal', 'neutral'].includes(v))
    .map(([zone, status]) => ({ zone, status }));
}

// Get latest run per source
const { data: runs, error: runsErr } = await supabase
  .from('sheet_import_runs')
  .select('id, source_id, started_at')
  .order('started_at', { ascending: false });

if (runsErr) { console.error('Failed to fetch runs:', runsErr); process.exit(1); }

const latestPerSource = new Map();
for (const r of runs) {
  if (!latestPerSource.has(r.source_id)) latestPerSource.set(r.source_id, r);
}
const runIds = [...latestPerSource.values()].map((r) => r.id);

// Get promotable rows
const query = supabase
  .from('sheet_import_player_rows')
  .select('id, player_name, matched_team_id, primary_position, secondary_positions, height_inches, roster_status, tendency_review_status, attributes, badges, tendencies, hotzones')
  .in('run_id', runIds)
  .not('matched_team_id', 'is', null)
  .not('primary_position', 'is', null)
  .not('height_inches', 'is', null)
  .in('roster_status', ['active', 'two_way', 'minor', 'inactive'])
  .not('tendency_review_status', 'in', '("needs_manual","invalid")');

if (limit) query.limit(limit);

const { data: rows, error: rowsErr } = await query;

if (rowsErr) { console.error('Failed to fetch rows:', rowsErr); process.exit(1); }

console.log(JSON.stringify({
  mode: writeMode ? 'write' : 'dry-run',
  promotable: rows.length,
  limit: limit || 'all',
}, null, 2));

let promoted = 0;
let errors = [];

const teamMap = new Map();

for (const row of rows) {
  try {
    const slug = makeSlug(row.player_name);
    const badgeNames = extractBadgeNames(row.badges);
    const hotzones = extractHotzones(row.hotzones);
    const status = row.roster_status === 'inactive' ? 'pending review' : 'active';

    if (!writeMode) {
      console.log(`  [dry-run] ${row.player_name} → slug="${slug}", team=${row.matched_team_id}, pos=${row.primary_position}, badges=${badgeNames.length}, hotzones=${hotzones.length}, tendencies=${row.tendency_review_status}`);
      promoted++;
      continue;
    }

    // Step 1: Upsert player
    const { data: player, error: playerErr } = await supabase
      .from('players')
      .upsert({
        gamertag: row.player_name,
        slug,
        primary_position: row.primary_position,
        secondary_positions: row.secondary_positions,
        height_inches: row.height_inches,
        wingspan_inches: row.height_inches,
        status,
        attributes: row.attributes,
        badges: badgeNames,
        tendencies: row.tendencies,
      }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (playerErr) throw new Error(`players upsert: ${playerErr.message}`);
    const playerId = player.id;

    // Step 2: Close old roster membership, insert new one
    await supabase
      .from('roster_memberships')
      .update({ ends_at: new Date().toISOString() })
      .eq('player_id', playerId)
      .is('ends_at', null);

    const { error: membershipErr } = await supabase
      .from('roster_memberships')
      .insert({ player_id: playerId, team_id: row.matched_team_id, roster_status: row.roster_status });

    if (membershipErr) throw new Error(`roster_memberships insert: ${membershipErr.message}`);

    // Step 3: Replace hotzones
    await supabase.from('player_hotzones').delete().eq('player_id', playerId);

    if (hotzones.length) {
      const { error: hotzoneErr } = await supabase
        .from('player_hotzones')
        .insert(hotzones.map((h) => ({ player_id: playerId, zone: h.zone, status: h.status })));

      if (hotzoneErr) throw new Error(`player_hotzones insert: ${hotzoneErr.message}`);
    }

    // Step 4: Mark staging row as promoted
    const { error: updateErr } = await supabase
      .from('sheet_import_player_rows')
      .update({
        review_status: 'promoted',
        promoted_player_id: playerId,
        reviewed_by: null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updateErr) throw new Error(`staging update: ${updateErr.message}`);

    console.log(`  [OK] ${row.player_name} → ${slug} (player_id=${playerId})`);
    promoted++;
  } catch (err) {
    console.error(`  [FAIL] ${row.player_name}: ${err.message}`);
    errors.push({ player: row.player_name, error: err.message });
  }
}

console.log(JSON.stringify({
  status: errors.length ? 'completed_with_errors' : 'completed',
  mode: writeMode ? 'write' : 'dry-run',
  promoted,
  errors: errors.length,
}, null, 2));

if (errors.length) {
  for (const e of errors) {
    console.error(`  ERROR: ${e.player} — ${e.error}`);
  }
}
