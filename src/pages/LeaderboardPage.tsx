import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PageHeader, Panel } from '../components/Panel';
import { fetchLeaderboard } from '../lib/db';
import type { LeaderboardEntry } from '../types/domain';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type SortKey = 'score' | 'gamertag' | 'position' | 'team_name';

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

function scoreTone(score: number): string {
  if (score >= 85) return 'text-yellow-300';
  if (score >= 70) return 'text-[var(--color-uba-blue-light)]';
  if (score >= 50) return 'text-[var(--text2)]';
  return 'text-[var(--text3)]';
}

export function LeaderboardPage() {
  useDocumentTitle('Player Leaderboard');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLeaderboard().then(setEntries);
  }, []);

  const filtered = useMemo(() => {
    let result = [...entries];
    if (positionFilter) result = result.filter(e => e.position === positionFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => e.gamertag.toLowerCase().includes(q));
    }
    if (sortKey === 'score') result.sort((a, b) => b.score - a.score);
    else if (sortKey === 'gamertag') result.sort((a, b) => a.gamertag.localeCompare(b.gamertag));
    else if (sortKey === 'position') result.sort((a, b) => a.position.localeCompare(b.position));
    else if (sortKey === 'team_name') result.sort((a, b) => (a.team_name ?? '').localeCompare(b.team_name ?? ''));
    return result;
  }, [entries, sortKey, positionFilter, search]);

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="UBA Rankings"
        title="Player leaderboard."
        description="All active players ranked by UBA Player Score across 7 skill pillars."
        meta={`${entries.length} players`}
      />

      <Panel className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setPositionFilter(null)} className={`rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] transition-colors ${!positionFilter ? 'bg-[var(--color-uba-gold)] text-black' : 'bg-[var(--navy4)] text-[var(--text2)] hover:text-[var(--text)]'}`}>All</button>
            {POSITIONS.map(pos => (
              <button type="button" key={pos} onClick={() => setPositionFilter(pos)} className={`rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] transition-colors ${positionFilter === pos ? 'bg-[var(--color-uba-gold)] text-black' : 'bg-[var(--navy4)] text-[var(--text2)] hover:text-[var(--text)]'}`}>{pos}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="sort-select" className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--text3)]">Sort</label>
            <select
              id="sort-select"
              aria-label="Sort players by"
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] px-2 py-1 text-[0.7rem] text-[var(--text)] outline-none"
            >
              <option value="score">Score</option>
              <option value="gamertag">Name</option>
              <option value="position">Position</option>
              <option value="team_name">Team</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players…"
            aria-label="Search players"
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] px-3 py-2 text-[0.8rem] text-[var(--text)] placeholder-[var(--text3)] outline-none transition-colors focus:border-[var(--color-uba-gold)]"
          />
        </div>
      </Panel>

      <div className="grid gap-2">
        {filtered.map((entry, i) => (
          <Link
            key={entry.id}
            to={`/player-profile/${entry.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--navy4)] px-4 py-3 transition-all hover:border-[var(--color-uba-gold)] hover:bg-[var(--navy5)] sm:px-5"
          >
            <span className="w-6 text-right text-[0.65rem] font-bold text-[var(--text3)]">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-bold text-[var(--text)]">{entry.gamertag}</p>
              <p className="text-[0.65rem] text-[var(--text3)]">
                {entry.position} · {Math.floor(entry.height_inches / 12)}'{entry.height_inches % 12}"
                {entry.team_name ? <span> · {entry.team_name}</span> : null}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {entry.badge_count != null ? (
                <span className="rounded-md bg-[var(--navy3)] px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-[var(--text2)]">{entry.badge_count} badges</span>
              ) : null}
              <span className={`text-right text-lg font-black tabular-nums tracking-tight ${scoreTone(entry.score)}`}>{entry.score}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <Panel className="p-6 text-center text-sm text-[var(--text3)]">No players match your filters.</Panel>
        )}
      </div>
    </div>
  );
}
