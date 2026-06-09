import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  affiliatedNxtTeams as staticAffiliatedNxt,
  mainLeagueTeams as staticUbaTeams,
  nxtLeagueTeams as staticNxtTeams,
  standingsWithTeams as staticStandings,
  unassignedNxtTeams as staticUnassignedNxt,
} from '../data/league';
import { rosterImportRowsForTeam, rosterImportSummary } from '../data/playerImport';
import { fetchStandingsWithTeams, fetchUbaTeams, fetchNxtTeams } from '../lib/db';
import { MetricCard, PageHeader, Panel, SectionTitle, StatusPill } from '../components/Panel';
import type { StandingWithTeam, Team } from '../types/domain';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function statusTone(status: string): 'green' | 'red' | 'gold' {
  if (status === 'clinched') return 'green';
  if (status === 'eliminated') return 'red';
  return 'gold';
}

function TeamCard({ team, standing }: { team: Team; standing?: StandingWithTeam }) {
  const importedRoster = rosterImportRowsForTeam(team.id);
  const isNxt = team.league === 'NXT';
  const affiliateLocations = team.affiliateLocations ?? [];
  const previewImportRows = importedRoster.slice(0, 8);

  return (
    <Panel key={team.id} className="overflow-hidden p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--text3)]">{isNxt ? 'NXT League' : `${team.conference ?? 'UBA'} Conference`}</p>
          <h3 className="mt-2 truncate text-3xl font-black tracking-[-0.04em] text-[var(--text)]">{team.name}</h3>
          <p className="mt-2 text-sm text-[var(--text2)]">{team.market ? `@${team.market}` : affiliateLocations.length ? affiliateLocations.join(' & ') : 'Affiliate unassigned'}</p>
        </div>
        <div className="h-14 w-14 rounded-2xl border border-[var(--app-border)]" style={{ backgroundColor: team.primaryColor }} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text3)]">{isNxt ? 'League tier' : 'Conference seed'}</p>
          <p className="mt-2 text-2xl font-black text-uba-gold">{isNxt ? 'NXT' : `${standing ? `#${standing.conferenceRank}` : '-'}`}</p>
        </div>
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text3)]">{isNxt ? 'Shared affiliate' : 'Status'}</p>
          <div className="mt-3">
            {isNxt ? <StatusPill tone={affiliateLocations.length ? 'green' : 'slate'}>{affiliateLocations.length ? `${affiliateLocations.length} clubs` : 'Pending'}</StatusPill> : standing ? <StatusPill tone={statusTone(standing.status)}>{standing.status}</StatusPill> : <StatusPill tone="slate">Unseeded</StatusPill>}
          </div>
        </div>
      </div>

      {isNxt ? (
        <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text3)]">Associated locations</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {affiliateLocations.length ? affiliateLocations.map(location => <StatusPill key={location} tone="blue">{location}</StatusPill>) : <StatusPill tone="slate">Unassigned</StatusPill>}
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <SectionTitle eyebrow="Roster import" title={importedRoster.length ? `${importedRoster.length} unverified player${importedRoster.length === 1 ? '' : 's'}` : 'Awaiting sheet import'} />
        <div className="mt-4 flex flex-wrap gap-2">
          {previewImportRows.map(player => <StatusPill key={player.id} tone="slate">{player.name}</StatusPill>)}
          {importedRoster.length > previewImportRows.length ? <StatusPill tone="gold">+{importedRoster.length - previewImportRows.length} more</StatusPill> : null}
          {!importedRoster.length && <StatusPill tone="slate">No players imported</StatusPill>}
        </div>
      </div>

      <Link to={`/teams/${team.id}`} className="mt-6 inline-flex rounded-full border border-uba-gold/30 bg-uba-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-uba-gold-light transition hover:border-uba-gold/60 hover:bg-uba-gold/18">
        View roster
      </Link>
    </Panel>
  );
}

/*
 * TeamsPage simultaneously fetches UBA teams, NXT teams, and standings from
 * Supabase on mount — three parallel queries through the db.ts data layer.
 * Each has its own useState so they degrade independently: if the standings
 * query fails but teams load, the page still renders team cards (just without
 * seed/status boxes).
 *
 * The `?? static*` fallbacks mean the page is usable with zero config; the
 * static data is already imported at module scope.
 */
export function TeamsPage() {
  useDocumentTitle('Teams');
  const [ubaTeams, setUbaTeams] = useState<Team[] | null>(null);
  const [nxtTeams, setNxtTeams] = useState<Team[] | null>(null);
  const [standings, setStandings] = useState<StandingWithTeam[] | null>(null);

  useEffect(() => {
    Promise.all([fetchUbaTeams(), fetchNxtTeams(), fetchStandingsWithTeams()])
      .then(([uba, nxt, st]) => {
        setUbaTeams(uba);
        setNxtTeams(nxt);
        setStandings(st);
      })
      .catch(() => {});
  }, []);

  const ubaList = ubaTeams ?? staticUbaTeams;
  const nxtList = nxtTeams ?? staticNxtTeams;
  const standingList = standings ?? staticStandings;
  const affiliatedNxt = staticAffiliatedNxt;
  const unassignedNxt = staticUnassignedNxt;

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Roster room"
        title="UBA and NXT League teams."
        description="Browse all UBA and NXT development league teams with their affiliate groups."
        meta={`${affiliatedNxt.length} NXT affiliates mapped`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Roster import" value={String(rosterImportSummary.totalRows)} detail="Player records staged from team sheet imports." tone="blue" />
        <MetricCard label="Matched rows" value={String(rosterImportSummary.matchedRows)} detail={`${rosterImportSummary.matchedTeamCount} current UBA teams matched by name.`} tone="green" />
        <MetricCard label="Needs mapping" value={String(rosterImportSummary.unmatchedRows)} detail={rosterImportSummary.unmatchedTeamNames.join(', ')} tone="gold" />
        <MetricCard label="Raw pasted" value={String(rosterImportSummary.rawRows)} detail="Legacy pasted rows cleared." tone="slate" />
      </section>

      <section className="grid gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle eyebrow="Main league" title="UBA teams" body="Conference and seed data are tracked for the main league." />
          <StatusPill tone="blue">{ubaList.length} teams</StatusPill>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {ubaList.map(team => (
            <TeamCard key={team.id} team={team} standing={standingList.find(s => s.teamId === team.id)} />
          ))}
        </div>
      </section>

      <section className="grid gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle eyebrow="Development league" title="NXT League" body={`${affiliatedNxt.length} NXT teams now carry confirmed shared affiliate groups. ${unassignedNxt.length} remain unassigned until their role is confirmed.`} />
          <StatusPill tone="gold">{nxtList.length} teams</StatusPill>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {nxtList.map(team => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </section>
    </div>
  );
}
