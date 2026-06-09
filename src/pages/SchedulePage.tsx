import { useEffect, useMemo, useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Panel, PageHeader, MetricCard, SectionTitle } from '../components/Panel';
import { fetchGames, fetchUbaTeams } from '../lib/db';
import type { Game, Team } from '../types/domain';

const statusStyles: Record<string, string> = {
  scheduled: 'bg-[var(--c-blue)]/20 text-[var(--c-blue)]',
  live: 'bg-[var(--c-green)]/20 text-[var(--c-green)] animate-pulse',
  final: 'bg-[var(--navy4)] text-[var(--text2)]',
  postponed: 'bg-[var(--c-amber)]/20 text-[var(--c-amber)]',
  cancelled: 'bg-[var(--c-red)]/20 text-[var(--c-red)]',
};

function GameCard({ game, teams }: { game: Game; teams: Team[] }) {
  const home = teams.find(t => t.id === game.homeTeamId);
  const away = teams.find(t => t.id === game.awayTeamId);
  const isFinal = game.status === 'final';
  const date = new Date(game.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 transition hover:bg-[var(--navy4)]">
      <div className="mb-2 flex items-center justify-between text-xs text-[var(--text3)]">
        <span>{date}</span>
        <span className={statusStyles[game.status] ?? ''}>
          {game.status.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: home?.primaryColor ?? '#666' }}>
            <span className="text-xs font-bold text-white">{home?.shortName ?? '??'}</span>
          </div>
          <span className="font-semibold text-[var(--text)]">{home?.name ?? 'Home Team'}</span>
          {isFinal && <span className="ml-auto text-lg font-bold text-[var(--text)]">{game.homeScore}</span>}
        </div>
      </div>
      <div className="mb-1 flex items-center justify-center text-xs text-[var(--text3)]">vs</div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: away?.primaryColor ?? '#666' }}>
            <span className="text-xs font-bold text-white">{away?.shortName ?? '??'}</span>
          </div>
          <span className="font-semibold text-[var(--text)]">{away?.name ?? 'Away Team'}</span>
          {isFinal && <span className="ml-auto text-lg font-bold text-[var(--text)]">{game.awayScore}</span>}
        </div>
      </div>
      {game.location && (
        <div className="mt-2 text-xs text-[var(--text3)]">{game.location}</div>
      )}
    </div>
  );
}

export function SchedulePage() {
  useDocumentTitle('Schedule');
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [games, allTeams] = await Promise.all([
        fetchGames(),
        fetchUbaTeams(),
      ]);
      if (cancelled) return;
      setAllGames(games);
      setTeams(allTeams);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const gamesByWeek = useMemo(() => {
    if (!selectedWeek) return allGames;
    return allGames.filter(g => g.week === selectedWeek);
  }, [allGames, selectedWeek]);

  const { liveCount, finalCount, scheduledCount } = allGames.reduce(
    (acc, g) => {
      if (g.status === 'live') acc.liveCount++;
      else if (g.status === 'final') acc.finalCount++;
      else if (g.status === 'scheduled') acc.scheduledCount++;
      return acc;
    },
    { liveCount: 0, finalCount: 0, scheduledCount: 0 },
  );

  const weeks = useMemo(() => {
    const all = allGames.map(g => g.week).filter((w): w is number => w !== null);
    return [...new Set(all)].toSorted((a, b) => a - b);
  }, [allGames]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Schedule" kicker="Games & Results" description="Loading schedule data…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        kicker="Games & Results"
        description="View the UBA season schedule, game results, and upcoming matchups."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Total Games" value={String(allGames.length)} detail="This season" />
        <MetricCard label="Played" value={String(finalCount)} detail="Completed games" />
        <MetricCard label="Live Now" value={String(liveCount)} detail="In progress" />
        <MetricCard label="Upcoming" value={String(scheduledCount)} detail="Not yet played" />
      </div>

      {weeks.length > 0 && (
        <>
          <SectionTitle eyebrow="Filter" title="Filter by Week" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedWeek(null)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                selectedWeek === null
                  ? 'border-uba-blue-light/40 bg-uba-blue-light/15 text-uba-blue-light'
                  : 'border-[var(--app-border)] text-[var(--text2)] hover:border-[var(--app-border)]'
              }`}
            >
              All
            </button>
            {weeks.map(week => (
              <button
                type="button"
                key={week}
                onClick={() => setSelectedWeek(week)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selectedWeek === week
                    ? 'border-uba-blue-light/40 bg-uba-blue-light/15 text-uba-blue-light'
                    : 'border-[var(--app-border)] text-[var(--text2)] hover:border-[var(--app-border)]'
                }`}
              >
                Week {week}
              </button>
            ))}
          </div>
        </>
      )}

      <SectionTitle eyebrow="Games" title={selectedWeek ? `Week ${selectedWeek} Games` : 'All Games'} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {gamesByWeek.map(game => (
          <GameCard key={game.id} game={game} teams={teams} />
        ))}
        {gamesByWeek.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--text3)]">
            No games scheduled for this week.
          </div>
        )}
      </div>
    </div>
  );
}
