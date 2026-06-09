import { useEffect, useReducer } from 'react';
import { Link } from 'react-router';
import { MetricCard, PageHeader, Panel, SectionTitle, StatusPill } from '../components/Panel';
import { UbaPlayerScoreBadge } from '../components/UbaPlayerScoreBadge';
import { useAuth } from '../lib/auth';
import { fetchPlayerById } from '../lib/db';
import type { Player } from '../types/domain';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type PlayerState = Player | null | 'loading';
type PlayerAction =
  | { type: 'set'; player: Player | null }
  | { type: 'clear' }
  | { type: 'error' };

function playerReducer(_state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'set': return action.player;
    case 'clear': return null;
    case 'error': return null;
  }
}

export function MyPlayerPage() {
  useDocumentTitle('My Player');
  const { profile, user } = useAuth();
  const [player, dispatch] = useReducer(playerReducer, 'loading');

  useEffect(() => {
    if (!profile?.player_id) { dispatch({ type: 'clear' }); return; }
    fetchPlayerById(profile.player_id, true)
      .then(found => dispatch({ type: 'set', player: found ?? null }))
      .catch(() => dispatch({ type: 'error' }));
  }, [profile?.player_id]);

  if (player === 'loading') {
    return (
      <Panel className="p-6 sm:p-8">
        <SectionTitle eyebrow="Player lookup" title="Loading your player…" />
      </Panel>
    );
  }

  if (!player) {
    return (
      <div className="grid gap-5">
        <PageHeader
          kicker="Authenticated player hub"
          title="My player profile."
          description="Sign in with Discord, and link your player record via account settings."
          meta="No linked player"
        />
        <Panel className="p-6 sm:p-8">
          <SectionTitle eyebrow="Not linked" title="No player found." body="Your Discord account isn't linked to a player record yet. Contact an admin to set up your player profile." />
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker={`${player.position} · ${Math.floor(player.heightInches / 12)}'${player.heightInches % 12}"`}
        title={player.gamertag}
        description={`${player.teamId ? `${player.teamId} \u00B7 ` : ''}${player.badges.length} badges`}
        meta={`Status: ${player.status}`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="UBA Score" value={<UbaPlayerScoreBadge playerId={player.dbId!} position={player.position} />} detail="Computed from attributes" tone="gold" />
        <MetricCard label="Archetype" value={player.archetype || 'Unset'} detail="Player build" tone="blue" />
        <MetricCard label="Badges" value={String(player.badges.length)} detail="Equipped" tone="gold" />
        <MetricCard label="Tendencies" value={player.tendencies ? 'Loaded' : 'None'} detail="99-tendency profile" tone="green" />
      </section>

      {player.badges.length > 0 && (
        <Panel className="p-6 sm:p-8">
          <SectionTitle eyebrow={`${player.badges.length} equipped`} title="Badges" />
          <div className="mt-4 flex flex-wrap gap-2">
            {player.badges.map((badge) => (
              <StatusPill key={badge} tone="blue">{badge}</StatusPill>
            ))}
          </div>
        </Panel>
      )}

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Panel className="p-6 sm:p-8">
          <SectionTitle eyebrow="Player hub" title="Quick actions" body="Player tools and workflows for managing your UBA career." />
          <div className="mt-6 grid gap-3">
            <Link to={`/player-profile/${player.id}`} className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] px-4 py-3 text-sm transition hover:border-uba-gold/40">
              <span className="font-bold text-[var(--text)]">View public profile</span>
              <span className="text-uba-gold-light">&rarr;</span>
            </Link>
            <div className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] px-4 py-3 text-sm">
              <span className="font-bold text-[var(--text)]">Weekly check-in</span>
              <span className="text-xs text-[var(--text3)]">Auth required</span>
            </div>
            <a
              href="https://ubacalc.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] px-4 py-3 text-sm transition hover:border-uba-gold/40"
            >
              <span className="font-bold text-[var(--text)]">Upgrade calculator</span>
              <span className="flex items-center gap-1 text-xs text-uba-gold-light">Open &rarr;</span>
            </a>
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle eyebrow="Account" title={`${(user?.user_metadata as Record<string, unknown>)?.['full_name'] ?? 'Discord user'}`} body={`Linked player: ${player.gamertag}`} />
        </Panel>
      </section>
    </div>
  );
}
