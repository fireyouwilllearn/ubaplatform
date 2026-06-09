# Supabase Schema Draft

This is a planning document for the hosted schema. No hosted Supabase project, keys, remote applied migrations, or generated types have been committed. Local SQL drafts exist in `supabase/migrations/`, were applied successfully to the local Docker Supabase stack, and passed local schema linting.

## Principles

- The browser never owns league authority.
- Imports are staged and reviewed before they become player or roster records.
- UC changes are append-only ledger events, not direct balance edits.
- Admin actions create audit records.
- Row Level Security must be enabled as each table is introduced.

## Core Tables

### `account_profiles`

- `user_id uuid primary key references auth.users(id)`
- `role text not null check (role in ('admin', 'gm', 'player'))`
- `player_id uuid references players(id)`
- `gm_team_id uuid references teams(id)`
- `created_at timestamptz not null default now()`

Only three account types are in scope for now: Players, GMs, and Admins. A player account should point to one player record. A GM account should point to one current team unless multi-team access is explicitly added later. Admin is the only broad operational account role.

### `teams`

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `short_name text not null`
- `market text`
- `league_tier text not null check (league_tier in ('UBA', 'NXT'))`
- `conference text check (conference in ('East', 'West'))`
- `primary_color text`
- `logo_url text`
- `jersey_home_url text`
- `jersey_away_url text`
- `jersey_alternate_url text`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`

Team identity assets are optional at first. The frontend can render generated jersey art from `primary_color`, but official team-specific logos and jersey images should live as backend-backed asset URLs later.

### `team_affiliates`

- `id uuid primary key`
- `nxt_team_id uuid not null references teams(id)`
- `uba_team_id uuid references teams(id)`
- `affiliate_location text not null`
- `created_at timestamptz not null default now()`

Use this for NXT shared affiliate groups. `uba_team_id` can be null when the location is known but the main team is not confirmed yet.

### `players`

- `id uuid primary key`
- `display_name text not null`
- `discord_handle text`
- `discord_user_id text unique`
- `primary_position text check (primary_position in ('PG', 'SG', 'SF', 'PF', 'C'))`
- `height_inches integer`
- `weight_lbs integer`
- `status text not null default 'unverified'`
- `created_at timestamptz not null default now()`

Status should be an enum or checked text such as `unverified`, `active`, `inactive`, `injured`, `free_agent`, `prospect`.

### `roster_memberships`

- `id uuid primary key`
- `player_id uuid not null references players(id)`
- `team_id uuid not null references teams(id)`
- `membership_status text not null`
- `acquired_label text`
- `started_at timestamptz`
- `ended_at timestamptz`
- `created_at timestamptz not null default now()`

Only one active membership per player should be allowed by a partial unique index where `ended_at is null`.

### `standings`

- `id uuid primary key`
- `team_id uuid not null references teams(id)`
- `season_id uuid not null`
- `conference_rank integer`
- `status text not null`
- `wins integer`
- `losses integer`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

The current frontend only has seed/status. Wins/losses should stay nullable until confirmed.

## Import Tables

### `roster_import_batches`

- `id uuid primary key`
- `source_name text not null`
- `source_notes text`
- `imported_by uuid references auth.users(id)`
- `created_at timestamptz not null default now()`
- `review_status text not null default 'open'`

### `roster_import_rows`

- `id uuid primary key`
- `batch_id uuid not null references roster_import_batches(id)`
- `raw_team_name text not null`
- `display_team_name text not null`
- `matched_team_id uuid references teams(id)`
- `player_name text not null`
- `position text not null`
- `height_text text not null`
- `weight_lbs integer not null`
- `discord_handle text not null`
- `acquired_label text not null`
- `review_status text not null default 'needs_review'`
- `review_notes text`
- `created_player_id uuid references players(id)`
- `created_membership_id uuid references roster_memberships(id)`

Rows should be immutable after import except review fields and created record links.

The current frontend removes duplicate placeholder identity rows from the active review dataset when both player name and Discord handle match. A real import workflow should keep raw source rows in `roster_import_rows`, then mark duplicates with `review_status = 'duplicate'` or a `duplicate_of_row_id` field rather than deleting evidence.

### `player_hotzones`

- `id uuid primary key`
- `player_id uuid not null references players(id)`
- `zone text not null`
- `status text not null check (status in ('hot', 'lethal', 'neutral'))`
- `updated_by uuid references auth.users(id)`
- `updated_at timestamptz not null default now()`

The frontend has a 14-zone half-court model. `hot` displays red, `lethal` displays purple, and `neutral` displays as glass. Do not rely on color alone; labels/status text should remain available.

## Economy Tables

### `uc_ledger_events`

- `id uuid primary key`
- `player_id uuid not null references players(id)`
- `delta integer not null`
- `reason text not null`
- `source_type text not null`
- `source_id uuid`
- `created_by uuid references auth.users(id)`
- `created_at timestamptz not null default now()`

Balances should be derived from ledger events or maintained by a database-controlled projection.

## Audit Tables

### `audit_events`

- `id uuid primary key`
- `actor_user_id uuid references auth.users(id)`
- `action text not null`
- `target_table text not null`
- `target_id uuid`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

## Initial RLS Sketch

- Public visitors can read published teams, standings, and announcements.
- Authenticated players can read their own player and roster records.
- Admins can read roster import batches and rows.
- Only admin roles can approve import rows into real players or roster memberships.
- UC ledger writes must go through controlled functions, not direct browser inserts.
- Audit events are append-only and admin-readable.

## Import Promotion Workflow

1. Create a `sheet_import_runs` row for a configured `team_sheet_sources` record.
2. Insert raw `sheet_import_snapshots` and normalized `sheet_import_player_rows`.
3. Admin reviews unmatched teams, duplicate names, duplicate Discord handles, impossible measurements, and manual tendency placeholders.
4. Admin enters reviewed manual tendencies with `set_sheet_import_player_tendencies(row_id, tendencies)` when a row contains a link/placeholder.
5. Admin promotes a row with `promote_sheet_import_player_row(row_id)` after validation is clean.
6. The promotion RPC creates or updates `players`, closes/replaces current `roster_memberships`, and refreshes `player_hotzones`.
7. Bank/UC values remain staged until a separate ledger-event promotion path exists.

## Next Drafting Tasks

- Review the locally validated SQL drafts in `supabase/migrations/` against the hosted project settings before remote application.
- Use `docs/supabase_preflight.md` as the ordered setup checklist before connecting the frontend.
- Keep `Los Angeles Royals` and `Derby City Stingers` aligned in static data, hosted team seeds, and the private sheet manifest.
- Decide whether `Undrafted Free Agents` and `Prospect Pool` are import-only pools, roster statuses, or separate workflow queues.
- Add seed data only after league/team status is confirmed.
- Add a UC ledger promotion path for reviewed Bank tab values.
