# UBA Platform

**Status:** Pre-launch. No CI/CD. No tests. Manual verification via dev server only.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Vite dev server on `http://127.0.0.1:5173` |
| `npm run build` | Runs `tsc -b` then `vite build` |
| `npm run sheets:sync` | Dry-run Google Sheets importer (reads `.env.local`) |
| `npm run sheets:sync:write` | Write-mode sheets import (`--write`) |
| `npx supabase ...` | Supabase CLI v2.102.0 (pinned) |

No lint, test, format, typecheck-only, or codegen commands exist.

## Stack

- React 19, TypeScript 6.x, Vite 8, Tailwind CSS v4
- Tailwind v4 uses `@tailwindcss/vite` plugin in `vite.config.ts`, not PostCSS. Custom theme in CSS `@theme` block in `src/styles.css`.
- React Router v7 (`react-router`, not `react-router-dom`)
- Supabase JS client v2 for auth + data (hosted: `ubaplatform-oceania`), Supabase CLI for local dev
- `ws` package is a runtime dep for Node-based Supabase client in scripts (browser uses native WebSocket)

## Env vars

- `VITE_*` vars (in `.env.example`) are public, shipped to browser via `import.meta.env`
- Non-`VITE_*` vars go in `.env.local` (gitignored) and are server-only — never prefix secrets with `VITE_`
- `src/lib/env.ts` reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, exports `isSupabaseConfigured` and `ensureSupabaseEnv()`

## Architecture

- **Entrypoint:** `src/main.tsx` → `<StrictMode>` → `<ErrorBoundary>` → `<NotificationProvider>` → `<BrowserRouter>` → lazy `<App>`
- **Data layer** (`src/lib/db.ts`): tri-state pattern — return module-scoped cache → static fallback if Supabase unconfigured → query Supabase → fallback on failure
- **Module-scoped caching** in `db.ts` — not React state. Call `clearTeamCache()` to invalidate
- **Static fallback data** lives in `src/data/` — all modules return typed arrays; player records return `[]` not fake data
- **Route pages:** 21 lazy-loaded pages in `src/pages/` using named exports, wrapped per-route in `<Suspense>`
- **Supabase types** are generated and committed at `src/lib/database.types.ts`
- **Migrations** live in `supabase/migrations/` numbered sequentially (0001-0022)
- **Bank→UC ledger pipeline:** migration 0018 adds bank promotion columns and `promote_bank_to_uc_ledger` RPC

## Conventions

- **ESM** (`"type": "module"` in package.json)
- **No path aliases** — all imports are relative
- **CSS:** `Bebas Neue` (display), `Inter` (body). Dark theme default, light via `html.theme-light` class. Design tokens use `--navy` through `--c-amber`, Shadcn-style tokens, and `--app-*` aliases. Custom utility classes: `.premium-card`, `.premium-glass`, `.nav-glass`, `.page-title`, `.status-pill`, `.animate-soft-rise`, etc.
- **Typography:** Bebas Neue for display/headings (20px card titles, 36px hero, 22px logo), Inter for body. Letter-spacing 1.5px on card titles, 3px on hero.
- **Light mode:** Applied via `html.theme-light` class on `<html>`. Toggle persisted to `localStorage` key `uba-theme`.
- **Inline CSS custom properties:** Use `cssProps()` from `src/lib/cssProps.ts` instead of `as React.CSSProperties` casts.
- **Icons:** Tabler Icons via CDN (`<i class="ti ti-*">`). No unicode/emoji in production code.
- **Shadow tokens:** Use `--shadow-menu`, `--shadow-nav`, `--shadow-dropdown`, `--shadow-jersey` CSS variables for theme-aware shadows.
- **Git:** conventional commits (`feat:`, `fix:`, `docs:`, optionally scoped)
- **Build verification:** CSS bundle ~71 kB. Build runs in ~150ms. No TypeScript errors.
- **Domain types:** `Team.id` = DB `slug` (set by `mapTeam`); `Player.id` = DB `slug ?? p.id` (set by `buildPlayer`). Use `.id` for all URL slugs.

## Sheets importer

- `scripts/sync-team-sheets.mjs` — reads `docs/local/team_sheet_sources.json`, authenticates Google OAuth, fetches sheets, stages in Supabase
- Staging → promotion via `/import-review` page UI and `promote_sheet_import_player_row` RPC
- Tendencies set via `set_sheet_import_player_tendencies` RPC
- Bank→UC promotion via `promote_bank_to_uc_ledger` RPC on ImportReviewPage

## Gotchas

- **No tests exist.** Any code change is verified manually.
- **TypeScript 6.x** is bleeding-edge; verify compatibility before adding tooling.
- **Supabase RLS mode:** `auto_expose_new_tables = false` in config (opt-in to new stricter mode).
- **Static data modules validate on import** (`src/data/league.ts` runs validation at module load).
- **`.env.local` is gitignored** — only `.env.example` is tracked.
- **Site URL** in Supabase config: `http://127.0.0.1:5173`.
