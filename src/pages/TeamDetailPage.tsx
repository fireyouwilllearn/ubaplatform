import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { MetricCard, PageHeader, Panel, SectionTitle, StatusPill } from '../components/Panel';
import { standingsWithTeams, teams as staticTeams } from '../data/league';
import { fetchPlayersForTeam, fetchStandingsWithTeams, fetchTeamBySlug } from '../lib/db';
import type { Player, Team } from '../types/domain';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function statusTone(status: string): 'green' | 'red' | 'gold' {
  if (status === 'clinched') {
    return 'green';
  }

  if (status === 'eliminated') {
    return 'red';
  }

  return 'gold';
}

function PlayerRow({ player }: { player: Player }) {
  return (
    <Link to={`/player-profile/${player.id}`} className="grid gap-3 border-b border-[var(--app-border)] px-4 py-3 last:border-b-0 hover:bg-[var(--navy4)] md:grid-cols-[1.2fr_0.3fr_0.4fr_0.4fr_0.6fr] md:items-center">
      <div>
        <p className="font-black text-[color:var(--app-text)]">{player.gamertag}</p>
      </div>
      <p className="font-black text-uba-gold">{player.position}</p>
      <p className="text-sm text-app-muted">{player.overall}</p>
      <p className="text-sm text-app-muted">{Math.floor(player.heightInches / 12)}'{player.heightInches % 12}"</p>
      <div className="md:text-right"><StatusPill tone="green">Promoted</StatusPill></div>
    </Link>
  );
}

const gmWorkflows = [
  'Private playbook vault scoped to this team',
  'Team image board and jersey asset review',
  'Full own-roster view with opponent roster limits enforced by RLS',
];

export function TeamDetailPage() {
  useDocumentTitle('Team Detail');
  const { teamId } = useParams();

  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);

  useEffect(() => {
    if (!teamId) return;

    fetchTeamBySlug(teamId).then(setTeam).catch(() => {});

    fetchPlayersForTeam(teamId)
      .then(setRoster)
      .catch(() => {});
  }, [teamId]);

  const finalTeam = team ?? staticTeams.find(c => c.id === teamId);

  if (!finalTeam) {
    return (
      <Panel className="p-6 sm:p-8">
        <SectionTitle eyebrow="Team lookup" title="Team not found" body="The requested team ID does not exist." />
        <Link to="/teams" className="mt-5 inline-flex rounded-full border border-uba-gold/30 bg-uba-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-uba-gold-light">Back to teams</Link>
      </Panel>
    );
  }

  const standing = standingsWithTeams.find((row) => row.teamId === finalTeam.id);

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker={finalTeam.league === 'NXT' ? 'NXT roster detail' : `${finalTeam.conference ?? 'UBA'} roster detail`}
        title={finalTeam.name}
        description="Team roster showing promoted players from sheet imports."
        meta={finalTeam.market ? `@${finalTeam.market}` : finalTeam.affiliateLocations?.join(' & ')}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Promoted players" value={String(roster.length)} detail={roster.length ? `${roster.length} active on this team` : 'Run importer write + promote to fill'} tone="blue" />
        <MetricCard label="Staged import" value={standing ? '—' : '—'} detail="Review in /import-review" tone="slate" />
        <MetricCard label="League tier" value={finalTeam.league} detail={finalTeam.conference ? `${finalTeam.conference} Conference` : 'Development league'} tone="gold" />
        <MetricCard label="Seed status" value={standing ? `#${standing.conferenceRank}` : '-'} detail={standing?.status ?? 'No standing row'} tone={standing ? statusTone(standing.status) : 'slate'} />
      </section>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-[var(--app-border)] p-5">
          <SectionTitle eyebrow="Live roster" title={roster.length ? `${roster.length} promoted player${roster.length === 1 ? '' : 's'}` : 'No promoted players yet'} body={roster.length ? 'Active roster after import and promotion.' : 'Promote clean import rows to fill this roster.'} />
        </div>
        {roster.length ? roster.map((player) => <PlayerRow key={player.id} player={player} />) : <p role="status" aria-live="polite" className="p-5 text-sm text-app-muted">No promoted players on this team yet.</p>}
      </Panel>

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle
            eyebrow="GM workspace"
            title="Private team tools are staged, not active"
            body="GM workspace with team management tools."
          />
          <StatusPill tone="red">Disabled</StatusPill>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {gmWorkflows.map((workflow) => (
            <div key={workflow} className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-card-strong)] p-4 text-sm font-bold leading-6 text-app-muted">
              {workflow}
            </div>
          ))}
        </div>
      </Panel>

      <Link to="/teams" className="inline-flex w-fit rounded-full border border-[var(--app-border)] bg-[var(--navy4)] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-app-muted hover:text-[color:var(--app-text)]">Back to teams</Link>
    </div>
  );
}
