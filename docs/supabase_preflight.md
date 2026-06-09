# Supabase Preflight

This is the setup checklist for Supabase. The hosted project exists and migrations have been applied. Auth and admin bootstrapping remain.

## Non-Negotiables

- Browser code may only use the public anon key.
- Service-role keys stay out of Vite, Git, screenshots, and docs examples.
- RLS must exist before any table is treated as authoritative. ✓ (all tables have RLS)
- UC, upgrades, admin edits, and roster promotions must go through database functions or audited server workflows.
- Google Sheets can be an import source, not permanent platform authority.
- Placeholder roster rows are import-review material only; they are not signed-player truth.

## Account Scope

- `player`: linked to one player record and own player-facing data.
- `gm`: linked to one team initially; can see own private team roster, playbooks, and images.
- `admin`: operational role for approvals, imports, ledger events, audit review, and platform-wide maintenance.

No separate commissioner or staff role exists for now.

## Completed

- [x] Supabase project created: `ubaplatform-oceania` (ref `xxtunagxgsznhijrodfa`, ap-southeast-2)
- [x] Public env values (URL + anon key) in `.env.local`
- [x] All 11 migrations (0001–0011) reviewed and applied to hosted project
- [x] RLS policies on all tables
- [x] Supabase TypeScript types generated and committed in `src/lib/database.types.ts`

## Remaining

- [ ] Configure Discord OAuth in Supabase Auth dashboard
- [ ] Bootstrap first admin `account_profiles` row
- [ ] Link Supabase CLI (`supabase link` with project ref)
- [ ] Verify seed data applied or manually seed teams/players
- [ ] Apply any remaining migration cleanup or refinement

## First Backend Sequence

1. ~~Create Supabase project and configure Discord auth~~ (project exists, auth pending)
2. ~~Add public env values to `.env.local`~~ (done)
3. ~~Review and apply local migration drafts~~ (done, 11 applied)
4. ~~Create account_profiles, teams, players, roster_memberships~~ (done via migrations)
5. ~~Add RLS policies~~ (done)
6. ~~Add roster import tables and promotion function~~ (done via migrations)
7. ~~Add UC ledger tables and controlled check-in function~~ (done via migrations)
8. ~~Generate Supabase TypeScript types~~ (done)
9. [ ] Configure Discord OAuth
10. [ ] Create admin account
11. [ ] Verify seed data

## Storage Buckets (planned, not created)

- `team-identity`: team logos and jersey images. Public read, admin write.
- `team-private`: GM playbooks and internal images. GM own-team read, admin read/write.
- `player-media`: player media posts. Public/published read, owner/admin write.
- `import-files`: raw import uploads or exports. Admin-only.

## RLS Questions Answered

- Can a GM ever control more than one team at once? — Not yet, schema allows one `gm_team_id` per profile.
- Can a player have more than one linked player profile over time? — Schema allows re-linking via `player_id` FK.
- Are NXT affiliate GMs shared with main UBA teams or separate? — Separate unless explicitly linked.
- Should free agents be public, GM-visible, or admin-review-only? — Public read, admin/gm write.
- Are prospects public draft-board records or private admin import rows? — Admin import rows until drafted.
- Which Google Sheets stats are public? — All future stats public; Sheets is migration source only.

## Migration Draft Files (all applied remotely)

- `0001_accounts_and_teams.sql`
- `0002_players_and_rosters.sql`
- `0003_roster_imports.sql`
- `0004_uc_ledger.sql`
- `0005_storage_policies.sql`
- `0006_audit_events.sql`
- `0007_rls_hardening.sql`
- `0008_seed_teams.sql`
- `0009_games_injuries.sql`
- `0010_notifications_trades.sql`
- `0011_free_agency_salary_cap.sql`

## Local Validation Status

- Supabase CLI is pinned as a project dev dependency at `2.102.0`.
- `supabase/config.toml` is initialized with `project_id = "ubaplatform"`.
- API `auto_expose_new_tables` is set to `false`.
- Local Supabase stack was started, migrations applied, `npx supabase db lint --local` passed, stack stopped.

## Cloudflare Note

- Cloudflare API credentials are configured via environment variables.
- No Cloudflare Pages project or Worker was created or deployed from this repository yet.
- Cloudflare has more than one organization/account available. Do not deploy until the exact UBA-owned Cloudflare account is identified and confirmed.
