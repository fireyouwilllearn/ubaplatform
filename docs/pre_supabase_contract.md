# Pre-Supabase Contract

This project can keep moving before Supabase auth is wired, but only on work that does not pretend the browser is league authority.

## Build Now

- App shell, navigation, layouts, responsive UI, and route structure.
- Domain TypeScript types for players, teams, standings, announcements, roles, and audit events.
- Static read models that exercise the UI without writing to localStorage or claiming to be authoritative.
- Static validation for seed data references, duplicate IDs, standings, and NXT affiliate links.
- Unverified roster import staging that can show review counts without replacing signed-player state.
- Public environment variable contract through Vite `VITE_` keys.
- Supabase TypeScript types generated from hosted database.
- Disabled workflow shells that clearly communicate backend gates.
- Feature pages with static data: Schedule, Trades, Free Agency, Salary Cap, Roster Management, Injuries, Notifications.

## Block Until Discord Auth

- Player ownership checks.
- UC grants, spends, refunds, or manual adjustments.
- Attribute, badge, or tendency writes.
- Admin-only operations beyond the UI shell.
- Calculator integration that reads or writes platform player state.
- Claiming imported roster rows are current signed players without a verified source of truth.
- Interactive trade proposals, free agency bidding, and roster management.

## Current League Model

- UBA main league has Western and Eastern Conference teams with seed/status only.
- NXT League is tracked as a separate development tier with no conferences.
- Seven NXT teams have confirmed shared affiliate groups.
- Remaining NXT teams are intentionally unassigned until confirmed.
- Affiliate locations can exist without a matched UBA team ID when the main-league team is not present.
- Pasted player rows are stored as unverified import candidate data.
- Imported rows can match current UBA teams by exact team name; unmatched source groups stay visible.
- `zUDFA` is displayed as `Undrafted Free Agents`; `zzProspect` is displayed as `Prospect Pool`.
- `Los Angeles Royals` and `Derby City Stingers` appear in the imported roster source but are not promoted into standings or conference data until confirmed.

## Supabase Status

- Hosted project: `ubaplatform-oceania` (ref `xxtunagxgsznhijrodfa`, ap-southeast-2)
- 11 migrations applied covering 17 tables + 1 view + 6 RPCs
- RLS enabled on all tables
- `.env.local` has public anon key (gitignored)
- Discord OAuth not yet configured
- No admin account bootstrapped

## Domain Model

- AccountRole: admin, gm, player.
- PlayerStatus: active, injured, pending review, prospect, free_agent.
- PrimaryPosition (PG/SG/SF/PF/C) with legal height ranges per position in inches.
- Players may have secondaryPositions and `eligiblePositionsForHeight` helper.
- HotZone model: 14 named zones with hot/lethal/neutral status.
- Tendency model: 99 named tendencies stored as Partial<Record<TendencyName, number>>.
- Player type includes heightInches, wingspan, hotZones, tendencies, and animations.

## Next Steps When Auth Is Ready

1. Configure Discord OAuth in Supabase Auth dashboard.
2. Bootstrap first admin `account_profiles` row.
3. Link Supabase CLI (`supabase link`).
4. Verify/migrate seed data.
5. Wire feature pages to live Supabase queries.
6. Deploy to Cloudflare Pages.
