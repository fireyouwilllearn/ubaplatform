# Google Sheets Importer

The production import path is designed to keep team-owned Google Sheets as migration input, not as the permanent league database.

## Current Flow

1. Keep the private sheet registry in ignored `docs/local/team_sheet_sources.json`.
2. Run `npm run sheets:sync -- --source <team_slug>` to dry-run one source.
3. Add `--details` for row-level review output, or `--report /tmp/sheets-review-report.json` for a machine-readable checklist.


4. Run `npm run sheets:sync:write -- --source <team_slug>` only when server-only Supabase credentials are set.
5. Review staged rows in `/import-review` or Supabase before promoting anything into canonical player tables.
6. For manual tendency rows, paste the reviewed 99-value tendency set in `/import-review`; the page calls `set_sheet_import_player_tendencies(row_id, tendencies)` and reloads the queue.
7. Promote one approved row at a time from `/import-review`; the page calls `promote_sheet_import_player_row(row_id)` and then reloads the queue.

The sync script writes only to the staging tables added in migration `0014_team_sheet_imports.sql`:

- `team_sheet_sources`
- `sheet_import_runs`
- `sheet_import_snapshots`
- `sheet_import_player_rows`
- `sheet_import_conflicts`

Migration `0015_promote_sheet_import_players.sql` adds the guarded admin RPC. It refuses to promote rows with validation errors, unmatched canonical teams, missing position/height, non-promotable roster status, or manual/invalid tendencies.

Migration `0016_sheet_import_team_readiness.sql` seeds `Los Angeles Royals` and `Derby City Stingers` as canonical UBA teams and adds the guarded manual tendency review RPC.

Migration `0017_harden_manual_tendency_validation.sql` keeps the same RPC contract but rejects decimal JSON numbers cleanly before promotion.

The `/import-review` page uses normal Supabase client access, so staging rows stay protected by admin-only RLS. Non-admin users see an empty/auth-blocked state instead of private staged player data.

## Latest Write-Mode Import

All 16 pro team sheets have been imported to Supabase staging. A full `--write` pass through the authenticated OAuth token succeeded across all sheets. `dotenv` + `ws` packages provide the server-side Supabase client and Node 20 WebSocket polyfill.

- **200 player rows total** staged across `team_sheet_sources`, `sheet_import_runs`, `sheet_import_snapshots`, and `sheet_import_player_rows`.
- **17 rows with manual tendency placeholders/links** across 8 teams (Oakland 2, Vancouver 3, LA 4, Las Vegas 2, Houston 1, Tampa Bay 1, Detroit 1, Seattle 1, NY Empire 1, Derby City 1).
- **35 total review rows** after promotion guardrail checks; 17 are genuine manual-tendency, the remainder are validation issues (position/height/roster-status edge cases).
- 165 rows are clean and ready for promotion from `/import-review` once manual tendencies are filled.

### Bug Fix: `findHeaderRow` Suffix Matching

The `findHeaderRow` function used `endsWith` for column matching, which caused `normalizeHeader("Discord name")` → `"discordname"` to match the `"name"` header via `"discordname".endsWith("name")`. This overwrote the correct column-0 `"name"` mapping with column 4, causing all staged player names to be Discord handles instead of real names. The fix uses a two-pass approach: exact matches first, then `endsWith` fallback only for unmatched headers.

## Manifest Shape

Create `docs/local/team_sheet_sources.json` using this shape. That path is gitignored because the sheet registry contains private league operational links.

```json
{
  "sources": [
    {
      "team_slug": "oakland-sea-lions",
      "team_name": "Oakland Sea Lions",
      "spreadsheet_id": "google-spreadsheet-id",
      "active": true,
      "tabs": {
        "players": "Players",
        "bank": "Bank",
        "attributes": "Attributes",
        "badges": "Badges",
        "tendencies": "Tendencies",
        "misc": "Misc."
      },
      "notes": "Optional admin note"
    }
  ]
}
```

## Credentials

The script uses OAuth credential and token files for Google Sheets access:

- OAuth client: `~/.config/google-sheets/oauth.json`
- OAuth token: `~/.config/google-sheets/token.json`

Override those paths with `GOOGLE_SHEETS_OAUTH_CLIENT_PATH` and `GOOGLE_SHEETS_OAUTH_TOKEN_PATH` if needed.

For writes, set server-only Supabase values. Never prefix the service-role key with `VITE_`, and never use it in browser code.

```bash
SUPABASE_URL="https://project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
```

## Parsing Rules

- `Players` is the identity source for player rows.
- `2 way/UBAnxt` is preserved and normalized to `active`, `two_way`, `minor`, or `needs_review`.
- `Attributes` maps the 34-column UBA attribute export.
- `Badges` maps the 40-column UBA badge export.
- `Misc.` maps 14 hotzones plus raw sheet wingspan value and secondary position.
- `Bank` values are staged for audit only and should become reviewed UC ledger events, not direct balance overwrites.
- `Tendencies` must contain exactly 99 numeric values to be considered complete.
- Tendency links/placeholders like `Hogans Tends` are marked `needs_manual`; they are never converted to zeroes.
- The parser accepts exact 99-value positional tendency rows when header matching is imperfect, which covers rows without shifting values.
- **`findHeaderRow` uses two-pass column matching**: exact matches first, then `endsWith` fallback for unmatched headers. This prevents `Discord name` from stealing the `Name` column.
- Height parsing accepts common sheet shorthand such as `7'`, `7"`, and `7"0` as 7 feet even when the inch value is omitted or the quote character is wrong.

## Promotion Notes

- Promotion writes player identity, position, height, attributes, badge names, tendencies, roster membership, and hotzones.
- Hotzones are staged with database-safe keys like `under_basket`, not display labels.
- The sheet `Wingspan` value is staged as `wingspan_value`, but canonical `players.wingspan_inches` currently uses a neutral height-matched value because the sheets appear to store a 2K wingspan scale, not inches.
- Bank values stay staged for review and do not become UC ledger events yet.
- Manual tendency rows stay blocked until a dedicated admin entry flow writes the 99 reviewed tendency values back to staging.
- The manual tendency RPC validates exactly 99 integer values from 0 to 100 and clears only tendency-related validation errors; any unrelated row problem remains blocked.
- Bulk promotion script (`scripts/bulk-promote-players.mjs`) uses the service-role key to replay the same promotion logic for all clean staged rows at once. `--dry-run` (default) shows what would be promoted; `--limit=N` restricts to N rows; `--write` executes the promotions. Handles slug generation, badge extraction, roster membership management, hotzone replacement, and staging audit updates.
- Player heights are clamped to `max(87)` to satisfy the `players_height_inches_check` constraint (`between 67 and 87`).
