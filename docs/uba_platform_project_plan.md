# UBA Platform Project Plan

## Decision

The UBA platform should be developed as a separate sibling project from the current calculator:

```txt
Projects/
  UBACalc/
  UBAPlatform/
```

The current `UBACalc` project should remain detached for now. It is a working standalone calculator and should not be expanded directly into the full platform before the platform has proper authentication, database-backed player records, admin workflows, and transaction logging.

The new `UBAPlatform` project should use the calculator as the visual and functional reference, but not as the initial codebase for the platform.

## Critical Reasoning

The calculator and the platform are different products.

The calculator is currently a focused client-side tool with:

- React + TypeScript + Vite
- Tailwind CSS
- Zustand state
- Local storage persistence
- Shareable build URLs
- Flat JSON configuration data
- No backend

The future platform will need backend authority for:

- User accounts
- Discord login or account linking
- Player ownership
- Team rosters
- UC balances
- Attribute upgrades
- Badge and tendency management
- Daily rewards
- Admin permissions
- Transaction logs
- Audit history
- League standings and announcements

Forcing the full platform into the calculator repo too early would risk making the existing tool harder to maintain before the larger platform has proven its structure.

## Visual Direction

The platform should share the same overall look and feel as the calculator:

- UBA blue/gold color palette
- Premium dark UI
- Glass/card surfaces
- Basketball-themed background treatment
- Current UBA logo usage
- Dark/light theme direction
- Similar typography, spacing, and polished dashboard feel

The calculator should act as the design reference. The platform should feel like the larger home for the same product family.

## Recommended Initial Tech Stack

- Frontend: React + TypeScript + Vite
- Routing: React Router
- Styling: Tailwind CSS
- Hosting: Cloudflare Pages
- Backend: Supabase
- Database: Supabase Postgres
- Auth: Supabase Auth with Discord OAuth
- File storage: Supabase Storage
- Privileged backend logic: Supabase Edge Functions
- Database safety: Row Level Security policies from the beginning
- Type safety: Generated Supabase TypeScript database types

This stack keeps the platform close to the calculator's current frontend approach while adding the backend authority needed for real league operations.

## Why Not Start With Next.js

Next.js is not the recommended starting point unless a specific need appears later.

The platform is expected to be mostly an authenticated dashboard app, not an SEO-heavy public content site. React + Vite + React Router fits Cloudflare Pages cleanly, matches the current calculator stack, and avoids extra runtime complexity.

Next.js may be reconsidered later only if the platform develops strong requirements for server-rendered public pages, advanced server routing, or framework-specific features that outweigh the added deployment complexity.

## Cloudflare Pages Direction

Cloudflare Pages is a good fit for the platform frontend.

Recommended use:

- Host the React/Vite app on Cloudflare Pages.
- Use Git-based deployments once the project is ready.
- Keep public frontend environment variables limited to safe Supabase values such as the project URL and anon key.
- Do not expose service-role keys or privileged secrets to the browser.
- Use Supabase Edge Functions for privileged operations rather than putting secrets into the frontend.

The current calculator can remain separately deployed while the platform is built.

## Supabase Direction

Supabase should become the source of truth for league data.

Supabase should own:

- Users and Discord-linked identities
- Player profiles
- Teams
- Rosters
- Attributes
- Badges
- Tendencies
- UC balances
- Upgrade history
- Daily rewards
- Admin actions
- League settings
- Announcements
- Standings and rankings

Anything involving UC balances, rewards, upgrades, or admin edits must be database-backed and auditable. The browser should never be the authority for league data.

## Auth Direction

Discord login or Discord account linking should be handled through Supabase Auth.

The platform should eventually support:

- Discord OAuth sign-in
- Linked Discord IDs on user/player profiles
- Player access to their own profile/build data
- Admin roles for league management
- Role-based route protection
- Row Level Security policies enforcing access at the database layer

Admin-only operations should not rely only on frontend checks. Database policies and/or server-side functions must enforce permissions.

Future security note: evaluate whether Discord OAuth plus Supabase Auth gives admins enough account protection for league operations. If Discord login does not provide the right assurance for high-risk actions, add MFA/2FA or a step-up verification flow for admin-only workflows such as roster promotion, UC ledger changes, permissions, and destructive edits.

## Database Safety

Row Level Security should be enabled from the beginning.

The platform should avoid the mistake of building all screens first and trying to add security later. Tables should be created with clear access rules as they are introduced.

Core principles:

- Players can read their own relevant data.
- Admins can manage league data according to role.
- Public pages can read only approved public data.
- UC changes and upgrades should be written through controlled workflows.
- Transaction/audit records should be append-oriented wherever possible.

## Google Sheets Migration

The current Google Sheets workflow should be treated as a migration source, not the long-term backend.

Early platform development can include import tooling to map current sheet data into Supabase tables. Once the platform is stable, Google Sheets should be phased out in favor of admin dashboards and database-backed workflows.

Recommended migration approach:

- Identify current sheets and columns used by league admins.
- Map those columns to Supabase tables.
- Build one-time or repeatable import scripts/tools.
- Validate imported player, team, attribute, badge, and UC data.
- Keep Google Sheets as a temporary fallback during early testing.
- Move admin workflows into the platform once admin screens are reliable.

## Calculator Integration Plan

The calculator should remain standalone during early platform development.

Later integration should happen by extracting reusable calculator pieces:

- Attribute calculation logic
- Badge detection logic
- Cap calculation logic
- Cost calculation logic
- Static config data
- Calculator UI module
- Import/export helpers where still useful

The platform version of the calculator should eventually read and write player state through Supabase instead of localStorage.

UC spending and upgrades should create transaction records rather than only updating client state.

Standalone calculator behavior can remain available until the platform version fully replaces its league workflow.

## Suggested Project Structure

Initial sibling-folder setup:

```txt
Projects/
  UBACalc/
  UBAPlatform/
```

Possible later monorepo structure, only if shared packages become worth the overhead:

```txt
uba/
  apps/
    calc/
    platform/
  packages/
    ui/
    calculator-core/
    config-data/
```

Do not start with the monorepo unless there is a concrete need. The lower-risk path is to build the platform separately first, then extract shared packages later when duplication becomes painful or calculator integration becomes active work.

## Initial Platform Pages

The first platform scaffold should include placeholder routes for:

- Dashboard
- Player Profile
- My Player
- Teams
- League
- Standings
- Announcements
- Calculator
- Admin
- Settings

These can start with mock/static data. The goal of the first scaffold is to establish navigation, layout, theme, and visual direction before wiring up the backend.

## Phased Build Plan

### Phase 0: Foundation

- Create separate `UBAPlatform` project.
- Scaffold React + TypeScript + Vite.
- Add Tailwind CSS.
- Add React Router.
- Recreate the UBA visual shell using the calculator as reference.
- Add placeholder pages for Dashboard, Player, Teams, League, Admin, and Calculator.
- Keep the existing calculator detached.

### Phase 1: Data Model and Auth

- Create Supabase project.
- Add database migrations.
- Generate TypeScript database types.
- Configure Discord OAuth through Supabase Auth.
- Add user profile table.
- Add role/permission model.
- Enable Row Level Security from the beginning.

### Phase 2: Core League Data

- Add players table.
- Add teams table.
- Add roster relationships.
- Add attributes tables.
- Add badges tables.
- Add tendencies tables.
- Add UC balance model.
- Add transaction log for all UC changes and upgrades.
- Add initial Google Sheets import path.
- Add roster import review tooling that separates unverified source rows from confirmed signed-player records.

### Phase 3: Player Dashboard

- Build authenticated player dashboard.
- Show player profile, build, ratings, badges, UC balance, team, and history.
- Allow eligible player-driven upgrade requests if league rules allow it.
- Keep authoritative changes backend-backed.

### Phase 4: Admin Dashboard

- Add admin tools for managing players.
- Add admin tools for managing teams and rosters.
- Add admin tools for UC adjustments.
- Add admin tools for upgrades, rewards, and league settings.
- Require all admin changes to create audit/transaction records.

### Phase 5: Calculator Integration

- Integrate calculator into the platform as a module.
- Connect calculator state to Supabase player records.
- Replace localStorage authority with database-backed state for platform usage.
- Keep standalone calculator available until the platform version fully replaces its league workflow.

### Phase 6: Advanced Features

- Daily rewards and progression systems.
- Rankings and standings.
- Announcements.
- Player images and team logos.
- Public-facing league pages.
- Session/history views.
- Additional analytics and admin reporting.

## First Work Session In `UBAPlatform`

When starting in the new `UBAPlatform` folder, the first work session should focus only on foundation:

- Scaffold the app.
- Add routing.
- Add Tailwind.
- Recreate the UBA visual style.
- Create the app shell and placeholder pages.
- Do not connect Supabase yet unless the visual/routing foundation is stable.

The backend should come after the app shell has a clear structure.

## Non-Negotiables

- Keep `UBACalc` detached for now.
- Do not make browser/localStorage state authoritative for league data.
- Do not expose Supabase service-role keys or privileged secrets to the frontend.
- Do not implement admin-only operations as frontend-only checks.
- Do not permanently depend on Google Sheets.
- Do not integrate the calculator into the platform until auth, player records, and UC transaction design are clear.

## Current Implementation Status

- Phase 0 (Foundation) and Phase 1 (Data Model) are complete.
- 21 lazy-loaded, route-level code-split pages with Suspense + skeleton fallback.
- UBA Arena OS shell: categorized dropdown nav (League/Teams/Transactions/Tools/Admin) with sliding gold active indicator, ripple click effects, bell shake micro-interaction, scroll-compact header, animated theme toggle.
- Typed static league data in `src/data/league.ts` validated at module load.
- 7 new feature pages with static data: Schedule & Games, Trades, Free Agency, Salary Cap, Roster Management, Injuries, Notifications.
- 16 UBA main-league teams + 16 NXT teams with affiliate groups.
- Full domain model: AccountRole, PlayerStatus (including prospect/free_agent), PrimaryPosition with legal height ranges, 14-zone HotZone type, 99 TendencyNames, Player with heightInches/wingspan/secondaryPositions/hotZones/tendencies/animations.
- `eligiblePositionsForHeight` helper, half-court SVG hotzone graphic, tendency frequency bars.
- Permission matrix with GM and Player rows for roster access, UC check-in, opponent scoping, calculator/upgrades.
- Legacy pasted roster import data has been scrubbed from `src/data/playerImport.ts`; the module now stays as an empty adapter until the Google Sheets importer provides real staged rows.
- ErrorBoundary wrapping entire app, `useDocumentTitle` on every page, TypeScript strict mode (`noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`).
- Fully reactive notification system: `NotificationContext` with polling (6-item incoming pool injected ~35s apart), dropdown with click-outside close, bell badge, mark-as-read/mark-all, `NotificationDropdown` component.
- **17 migrations** (0001–0017) exist locally and are applied to the hosted database: 0012 keeps player slug support and standings seed data, 0013 deletes the temporary sample players, 0014 adds full Google Sheets import staging, 0015 adds guarded sheet-row promotion, 0016 adds LA/Derby canonical team coverage plus manual tendency review, and 0017 hardens manual tendency validation.
- RLS enabled on all tables with anon-read and admin/gm-write policies.
- 32 teams and 14 standings rows are seeded. Player rows intentionally remain empty until the team Google Sheets importer writes authoritative data.
- Supabase TypeScript types generated and committed in `src/lib/database.types.ts`; regenerated again after the manual-tendency schema.
- Supabase CLI linked and authenticated via personal access token.
- Typed DB query layer in `src/lib/db.ts` with module-level caching and static-data fallback for league structure. Player queries deliberately return `[]` instead of fake fallback rows.
- StandingsPage and TeamsPage query live Supabase data with automatic static fallback.
- Google Sheets OAuth has been configured and the credential/token files are stored outside the repo under `~/.config/google-sheets/`.
- Team-sheet importer foundation now exists: `team_sheet_sources`, `sheet_import_runs`, `sheet_import_snapshots`, `sheet_import_player_rows`, and `sheet_import_conflicts`, all protected by admin-only RLS.
- `src/lib/teamSheetTemplate.ts` defines the shared pro-sheet contract: required tabs, player headers, 34 attributes, 40 badges, bank audit fields, hotzone labels, two-way/UBAnxt normalization, and manual tendency detection.
- `scripts/sync-team-sheets.mjs` now reuses the authenticated Google OAuth files, reads the ignored sheet manifest, dry-runs by default, prints row-level review details with `--details`, emits JSON review reports with `--report`, and writes to the 0014 staging tables only when `--write` plus server-only Supabase credentials are provided.
- `promote_sheet_import_player_row(row_id)` is the guarded admin-only database path from staging to canonical players/rosters/hotzones; it blocks rows with validation errors, unmatched teams, or manual/invalid tendencies.
- `set_sheet_import_player_tendencies(row_id, tendencies)` is the guarded admin-only database path for replacing manual tendency placeholders with exactly 99 reviewed values.
- ImportReviewPage now reads `sheet_import_player_rows` through Supabase RLS, shows promotion readiness/blocked reasons, accepts manual tendency paste entry, and calls the guarded promotion RPC for clean rows.
- Private sheet registry/import notes live in ignored `docs/local/` with 16 pro team sheet links, a JSON manifest, template tabs, two-way/UBAnxt notes, and tendency/manual-review rules.
- **All 16 pro team sheets imported to Supabase staging**: 200 player rows, 165 clean, 17 manual tendency, 18 other review rows across 8 teams.
- **Bug fix**: `findHeaderRow` `endsWith` matching caused `"discordname".endsWith("name")` to overwrite the correct column-0 `Name` mapping with the `Discord name` column. Fixed with two-pass matching: exact first, `endsWith` only for unmatched headers.
- **Mobile responsiveness**: 5 high-severity metric-card grid collapses fixed (`grid-cols-N` → `grid-cols-2 sm:grid-cols-N` on Injuries, Trades, FA, Salary, Notifications); TeamIdentity jersey overflow wrapped in `overflow-x-auto`; Teams/Announcements text overflow guarded with truncate/break-words. Build passes clean.
- **Dead asset cleanup**: 10 unreferenced `public/` files removed (7 unlinked favicons, `logo-alt.png`, `wall.jpeg`, `walllight.png`, `welcome.opus`), freeing ~3.7 MB from the build.
- Cloudflare MCP servers authenticated but no Pages project created — waiting for UBA account confirmation.
- Discord OAuth not yet configured. No admin account bootstrapped.

## End-Of-Night Resume Notes

- **All 200 players staged in Supabase**. `SUPABASE_SERVICE_ROLE_KEY` added to `.env.local`, `dotenv` + `ws` packages installed for server-side Supabase + Node 20 WebSocket. NPM scripts updated to load `.env.local`. Full write-mode sync succeeded across all 16 teams.
- **Bug fix**: `findHeaderRow` `endsWith` matching caused `"discordname".endsWith("name")` to overwrite column-0 `Name` with column-4 `Discord name`. Fixed with two-pass matching (exact then endsWith fallback). Re-ran all 16 imports — player names are now real names, not Discord handles.
- **165 players bulk-promoted to canonical tables** via `scripts/bulk-promote-players.mjs`. The script replays the same RPC promotion logic (slug generation, badge extraction, roster membership management, hotzone replacement) but bypasses the `is_admin()` check using the service-role key.
- **Height clamp**: Jay Wilson (88" = 7'4") clamped to 87" to satisfy `players_height_inches_check` constraint (67-87).
- **35 rows still staged** needing admin review: 17 `needs_manual` (URL tendency placeholders) and 18 `invalid` (non-numeric, non-URL tendency text).
- **Mobile responsiveness**: 5 metric-card grid collapses fixed (Injuries/Trades/FA/Salary/Notifications), TeamIdentity jersey overflow, Teams/Announcements text overflow. Layout already had bottom nav, viewport meta, 44-48px touch targets.
- **Dead asset cleanup**: 10 unreferenced `public/` files removed (~3.7 MB freed).
- Last completed code checkpoint: 165 players promoted to canonical tables, `findHeaderRow` bug fixed, mobile polish done, dead assets cleaned.
- To continue: log in via Discord so admin role can be set, then review manual/invalid tendency rows in `/import-review`, paste 99-value tendency sets for the 17 manual rows, promote the remaining 35 rows. Add Bank-to-UC ledger promotion. Configure Cloudflare Pages deployment.
