# UBA Platform

Arena Glass — the UBA league platform built with React, TypeScript, Vite, Tailwind CSS v4, and Supabase.

## Stack

- React 19 + TypeScript 6 + Vite 8
- React Router 7
- Tailwind CSS v4 through `@tailwindcss/vite`
- Supabase (hosted, 17 migrations applied)
- Supabase CLI is pinned as a dev dependency at `2.102.0`

## Current Shape

- 21 lazy-loaded route-level code-split pages with Suspense + skeleton fallback.
- UBA Arena OS shell with categorized dropdown navigation, mobile bottom nav, real UBA logo/assets, dark/light themes, and notification dropdown.
- Typed static league data in `src/data/league.ts` with validation at module load.
- Fake/static player data has been scrubbed. Real player data is expected to arrive through the Google Sheets importer staging flow.
- 16 UBA main-league teams split by conference; 14 currently have standings seed rows.
- 16 NXT League teams tracked as a flat development tier.
- ErrorBoundary wrapping the entire app.
- `useDocumentTitle` hook on every page.
- 7 new feature pages: Schedule & Games, Trades, Free Agency, Salary Cap, Roster Management, Injuries, Notifications.
- Notification badge/dropdown in header with read/unread state.
- Domain contracts in `src/types/domain.ts`.
- Reusable shell/components in `src/components` and `src/layouts`.

- Player-facing pages now query Supabase for promoted players: `TeamDetailPage` shows live roster, `PlayerProfilePage` loads by slug, `fetchPlayers()`, `fetchPlayersForTeam()`, `fetchPlayerBySlug()`. Attribute mapper converts the 34-key sheet shape to aggregate buckets; hotzones are hydrated from `player_hotzones`.

## Supabase Status

- Hosted Supabase project `ubaplatform-oceania` active at `xxtunagxgsznhijrodfa` (ap-southeast-2).
- All 17 migrations (0001–0017) applied, including team/player schema, UC ledger, games/injuries, notifications/trades/free agency, sample-player scrub, Google Sheets import staging, guarded player promotion, canonical LA/Derby team coverage, and hardened manual tendency review.
- Import staging tables: team_sheet_sources, sheet_import_runs, sheet_import_snapshots, sheet_import_player_rows, sheet_import_conflicts.
- Promotion RPC: `promote_sheet_import_player_row(row_id)` moves one reviewed staging row into canonical players/rosters/hotzones and blocks rows with validation errors, unmatched teams, or manual/invalid tendencies.
- Manual tendency RPC: `set_sheet_import_player_tendencies(row_id, tendencies)` lets admins replace tendency placeholders with exactly 99 reviewed values.
- Import Review now reads staged sheet rows through Supabase RLS and exposes per-row admin promotion controls.
- RLS enabled on all tables with anon-read and admin/gm-write policies.
- `.env.local` contains the hosted Supabase URL and publishable anon key (gitignored).
- No Discord OAuth configured in Supabase Auth yet.
- No admin account bootstrapped yet.
- Supabase CLI is linked to the hosted project and migration list is aligned through 0017.

## Routes

All 21 routes are lazy-loaded:

1. **Dashboard** `/` — League command center with player card, standings, announcements.
2. **Schedule** `/schedule` — Games & results with week filtering.
3. **Standings** `/standings` — Conference standings with seed/status.
4. **My Player** `/my-player` — Player build hub.
5. **Player Profile** `/player-profile` — Public player card with hotzones, tendencies.
6. **Teams** `/teams` — All UBA + NXT teams.
7. **Team Detail** `/teams/:teamId` — Individual team page.
8. **Team Identity** `/team-identity` — Brand info and jersey visualization.
9. **Trades** `/trades` — Trade proposals with pending/history views.
10. **Free Agency** `/free-agency` — Player market with signed/available filters.
11. **Salary Cap** `/salary-cap` — Cap tracker with UBA/NXT toggle.
12. **Roster Management** `/roster-management` — Admin roster CRUD shell.
13. **Injuries** `/injuries` — Injury report with active/recovered views.
14. **Import Review** `/import-review` — Google Sheets staging review and guarded player promotion.
15. **Announcements** `/announcements` — League news wire.
16. **League** `/league` — Rules and permissions matrix.
17. **Notifications** `/notifications` — Activity feed with read/unread filter.
18. **Calculator** `/calculator` — Detached build calculator.
19. **Admin** `/admin` — Operations dashboard.
20. **Settings** `/settings` — Environment and Supabase health check.
21. **404** — Fallback not-found page.

## Scripts

- `npm run dev` — Start the dev server.
- `npm run build` — Type-check and create production build.
- `npm run preview` — Preview the production build.
- `npm run sheets:sync` — Dry-run the Google Sheets importer against the ignored local manifest; add `--details` or `--report <path>` for row-level review output.
- `npm run sheets:sync:write` — Write imported sheet snapshots/rows to Supabase staging tables with server-only credentials; promotion remains an explicit reviewed admin step.

## League Data Notes

- Main UBA teams are the user-provided Western and Eastern Conference lists.
- Standings currently store seed and status only; records and point totals are not invented.
- NXT teams do not have conferences yet.
- Confirmed NXT affiliate groups are stored with location labels plus matched UBA team IDs.
- `Derby City Stingers` and `Los Angeles Royals` are now seeded as canonical UBA teams because they are part of the provided pro sheet registry.
- Legacy pasted roster rows are scrubbed from app code. The ignored local sheet manifest currently tracks 16 pro sheets and dry-runs to 200 player rows with 2 remaining manual-tendency review rows.

## Pre-Supabase Boundary

Core UI work is done using static team/standings data plus Supabase reads where wired. The following remain blocked until Discord auth and importer promotion are configured:

- Player ownership checks.
- UC grants, spends, refunds, or manual adjustments.
- Attribute, badge, or tendency writes.
- Admin-only operations beyond the UI shell.
- Calculator integration that reads or writes platform player state.
- Interactive trade proposals, free agency bidding, and roster management.
- Cloudflare Pages deployment (pending account confirmation).

## Next Steps

1. Configure Discord OAuth in Supabase Auth dashboard.
2. Bootstrap first admin account.
3. Add `SUPABASE_SERVICE_ROLE_KEY` locally as a server-only value and run one-team sheet import write mode.
4. Use `/import-review` to fill the two manual tendency rows, then promote clean rows.
5. Add reviewed Bank-to-UC-ledger promotion.
6. Deploy to Cloudflare Pages.

See `docs/` for historical planning documents.
