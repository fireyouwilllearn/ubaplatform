import { useEffect, useState } from 'react';
import { standingsWithTeams as staticStandingsWithTeams } from '../data/league';
import { fetchStandingsWithTeams } from '../lib/db';
import { PageHeader, Panel, SectionTitle } from '../components/Panel';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { StandingWithTeam } from '../types/domain';

const seasons = ['S3', '2026'] as const;
type Season = (typeof seasons)[number];
type View = 'Combined' | 'East' | 'West';

function formatPct(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

function formatGb(value: number): string {
  return value === 0 ? '-' : value.toFixed(1);
}

function formatPtDiff(value: number): string {
  return value > 0 ? '+' + value : String(value);
}

export function StandingsPage() {
  useDocumentTitle('Standings');
  const [data, setData] = useState<StandingWithTeam[] | null>(null);
  const [activeSeason, setActiveSeason] = useState<Season>('S3');
  const [activeView, setActiveView] = useState<View>('Combined');

  useEffect(() => {
    let cancelled = false;
    setData(null);
    const promise = activeView === 'Combined'
      ? fetchStandingsWithTeams(activeSeason)
      : fetchStandingsWithTeams(activeSeason, activeView);
    promise.then(result => { if (!cancelled) setData(result ?? null); }).catch(() => { if (!cancelled) setData(null); });
    return () => { cancelled = true; };
  }, [activeSeason, activeView]);

  const fallbackRows = staticStandingsWithTeams.filter(s => {
    if (activeView === 'Combined') return true;
    return s.conference === activeView;
  });

  const rows = data ?? fallbackRows;

  const sorted = activeView === 'Combined'
    ? rows.toSorted((a, b) => b.winPct - a.winPct || a.conferenceRank - b.conferenceRank)
    : rows;

  const meta = [
    { label: 'Season', value: activeSeason },
    { label: 'View', value: activeView },
  ].map(m => `${m.label}: ${m.value}`).join(' · ');

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Competitive table"
        title="Conference standings."
        description="UBA conference seed rankings with W/L records and point differentials."
        meta={meta}
      />

      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] p-1">
          {seasons.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSeason(s)}
              className={`rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.15em] transition-colors ${
                activeSeason === s
                  ? 'bg-uba-gold text-uba-gold-text shadow-sm'
                  : 'text-[var(--text3)] hover:text-[var(--text)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] p-1">
          {(['Combined', 'East', 'West'] as View[]).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setActiveView(v)}
              className={`rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.15em] transition-colors ${
                activeView === v
                  ? 'bg-uba-gold text-uba-gold-text shadow-sm'
                  : 'text-[var(--text3)] hover:text-[var(--text)]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-[var(--app-border)] p-6 sm:p-8">
          <SectionTitle eyebrow="Seed table" title={activeView === 'Combined' ? 'Wild Card Standings' : `${activeView}ern Conference`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-[var(--navy4)] text-xs uppercase tracking-[0.22em] text-[var(--text3)]">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4 text-center">W</th>
                <th className="px-6 py-4 text-center">L</th>
                <th className="px-6 py-4 text-center">GB</th>
                <th className="px-6 py-4 text-center">PT DIFF</th>
                <th className="px-6 py-4 text-center">W%</th>
                {activeSeason === 'S3' && <th className="px-6 py-4 text-right">Conf</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {sorted.map((row: StandingWithTeam, i: number) => {
                const rank = activeView === 'Combined' ? i + 1 : row.conferenceRank;
                return (
                  <tr key={row.teamId} className="bg-[var(--app-card-strong)]">
                    <td className="px-6 py-5 text-2xl font-black text-uba-gold">{rank}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: row.team.primaryColor }}
                        />
                        <div>
                          <p className="font-black text-[var(--text)]">{row.team.name}</p>
                          <p className="mt-0.5 text-sm text-[var(--text3)]">{row.team.shortName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-[var(--text)]">{row.wins}</td>
                    <td className="px-6 py-5 text-center font-bold text-[var(--text)]">{row.losses}</td>
                    <td className="px-6 py-5 text-center text-[var(--text3)]">{formatGb(row.gamesBack)}</td>
                    <td className={`px-6 py-5 text-center font-semibold ${row.ptDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPtDiff(row.ptDiff)}
                    </td>
                    <td className="px-6 py-5 text-center text-[var(--text3)]">{formatPct(row.winPct)}</td>
                    {activeSeason === 'S3' && (
                      <td className="px-6 py-5 text-right">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                          row.conference === 'East'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {row.conference}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
