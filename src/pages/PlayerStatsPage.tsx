import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { fetchPlayerSeasonStats } from '../lib/db';
import { PageHeader, Panel } from '../components/Panel';
import { Tooltip } from '../components/Tooltip';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { PlayerSeasonStat } from '../types/domain';

type StatsState = {
  status: 'loading' | 'loaded' | 'error';
  data: PlayerSeasonStat[];
  error: string | null;
};

type StatsAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: PlayerSeasonStat[] }
  | { type: 'LOAD_ERROR'; payload: string };

function statsReducer(state: StatsState, action: StatsAction): StatsState {
  switch (action.type) {
    case 'LOAD_START': return { status: 'loading', data: state.data, error: null };
    case 'LOAD_SUCCESS': return { status: 'loaded', data: action.payload, error: null };
    case 'LOAD_ERROR': return { status: 'error', data: [], error: action.payload };
  }
}

type StatGroup = 'per_game' | 'totals' | 'advanced' | 'efficiency' | 'breakdown' | 'misc';
type StatCategory = 'all' | StatGroup;

const categories: { key: StatCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'per_game', label: 'Per Game' },
  { key: 'totals', label: 'Totals' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'efficiency', label: 'Efficiency' },
  { key: 'breakdown', label: 'Breakdown' },
  { key: 'misc', label: 'Misc' },
];

type StatConfig = {
  key: string;
  label: string;
  fullName: string;
  description: string;
  sortKey: (s: PlayerSeasonStat) => number;
  fmt?: (v: number) => string;
};

const num = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const perGame = (total: unknown, gp: unknown): number => {
  const t = num(total);
  const g = num(gp);
  return g > 0 ? t / g : 0;
};

const pct = (v: number) => (v * 100).toFixed(1) + '%';

const statConfigs: Record<StatGroup, StatConfig[]> = {
  per_game: [
    { key: 'pts', label: 'PTS', fullName: 'Points Per Game', description: 'Average points scored per game played.', sortKey: s => perGame(s.ptsTotal, s.gp), fmt: v => v.toFixed(1) },
    { key: 'reb', label: 'REB', fullName: 'Rebounds Per Game', description: 'Average total rebounds (offensive + defensive) per game.', sortKey: s => perGame(s.rebTotal, s.gp), fmt: v => v.toFixed(1) },
    { key: 'ast', label: 'AST', fullName: 'Assists Per Game', description: 'Average assists per game.', sortKey: s => perGame(s.astTotal, s.gp), fmt: v => v.toFixed(1) },
    { key: 'stl', label: 'STL', fullName: 'Steals Per Game', description: 'Average steals per game.', sortKey: s => perGame(s.stlTotal, s.gp), fmt: v => v.toFixed(1) },
    { key: 'blk', label: 'BLK', fullName: 'Blocks Per Game', description: 'Average blocks per game.', sortKey: s => perGame(s.blkTotal, s.gp), fmt: v => v.toFixed(1) },
    { key: 'min', label: 'MIN', fullName: 'Minutes Per Game', description: 'Average minutes played per game.', sortKey: s => perGame(s.minTotal, s.gp), fmt: v => v.toFixed(1) },
    { key: 'tov', label: 'TO', fullName: 'Turnovers Per Game', description: 'Average turnovers per game.', sortKey: s => perGame(s.turnoversTotal, s.gp), fmt: v => v.toFixed(1) },
    { key: 'fls', label: 'FLS', fullName: 'Fouls Per Game', description: 'Average personal fouls committed per game.', sortKey: s => perGame(s.fls, s.gp), fmt: v => v.toFixed(1) },
    { key: 'prf', label: 'PRF', fullName: 'Performance Rating Per Game', description: 'Average performance rating per game. A composite stat from the S3 sheet combining scoring, efficiency, and impact metrics.', sortKey: s => num(s.gameAverages?.['prf']), fmt: v => v.toFixed(1) },
    { key: 'score', label: 'SCORE', fullName: 'Score Per Game', description: 'Average composite score per game from the S3 sheet.', sortKey: s => num(s.gameAverages?.['score']), fmt: v => v.toFixed(1) },
  ],
  totals: [
    { key: 'ptsTotal', label: 'PTS', fullName: 'Total Points', description: 'Total points scored across all games played.', sortKey: s => num(s.ptsTotal) },
    { key: 'rebTotal', label: 'REB', fullName: 'Total Rebounds', description: 'Total rebounds across all games.', sortKey: s => num(s.rebTotal) },
    { key: 'astTotal', label: 'AST', fullName: 'Total Assists', description: 'Total assists across all games.', sortKey: s => num(s.astTotal) },
    { key: 'stlTotal', label: 'STL', fullName: 'Total Steals', description: 'Total steals across all games.', sortKey: s => num(s.stlTotal) },
    { key: 'blkTotal', label: 'BLK', fullName: 'Total Blocks', description: 'Total blocks across all games.', sortKey: s => num(s.blkTotal) },
    { key: 'minTotal', label: 'MIN', fullName: 'Total Minutes', description: 'Total minutes played across all games.', sortKey: s => num(s.minTotal) },
    { key: 'fgm', label: 'FGM', fullName: 'Field Goals Made', description: 'Total field goals made (2-pointers + 3-pointers combined).', sortKey: s => num(s.fgm) },
    { key: 'fga', label: 'FGA', fullName: 'Field Goals Attempted', description: 'Total field goals attempted (2-pointers + 3-pointers combined).', sortKey: s => num(s.fga) },
    { key: 'threePtm', label: '3PTM', fullName: 'Three-Pointers Made', description: 'Total three-point field goals made.', sortKey: s => num(s.threePtm) },
    { key: 'threePta', label: '3PTA', fullName: 'Three-Pointers Attempted', description: 'Total three-point field goals attempted.', sortKey: s => num(s.threePta) },
    { key: 'ftm', label: 'FTM', fullName: 'Free Throws Made', description: 'Total free throws made.', sortKey: s => num(s.ftm) },
    { key: 'fta', label: 'FTA', fullName: 'Free Throws Attempted', description: 'Total free throws attempted.', sortKey: s => num(s.fta) },
    { key: 'turnoversTotal', label: 'TO', fullName: 'Total Turnovers', description: 'Total turnovers committed across all games.', sortKey: s => num(s.turnoversTotal) },
    { key: 'fls', label: 'FLS', fullName: 'Total Fouls', description: 'Total personal fouls committed across all games.', sortKey: s => num(s.fls) },
  ],
  advanced: [
    {
      key: 'eff', label: 'EFF', fullName: 'Efficiency Rating', description: 'A single-number player evaluation used widely in global basketball (Euroleague, FIBA). Formula: (PTS + REB + AST + STL + BLK) - Missed FG - Missed FT - TO. Does not adjust for pace. League average typically falls in the 10-15 range.',
      sortKey: s => {
        const pts = num(s.ptsTotal); const reb = num(s.rebTotal); const ast = num(s.astTotal);
        const stl = num(s.stlTotal); const blk = num(s.blkTotal); const fga = num(s.fga);
        const fgm = num(s.fgm); const fta = num(s.fta); const ftm = num(s.ftm); const to = num(s.turnoversTotal);
        const gp = num(s.gp) || 1;
        return ((pts + reb + ast + stl + blk) - (fga - fgm) - (fta - ftm) - to) / gp;
      }, fmt: v => v.toFixed(1),
    },
    {
      key: 'gameScore', label: 'GmSc', fullName: 'Game Score (Hollinger)', description: 'John Hollinger\'s per-game efficiency measure. Simplified version using available stats: PTS + 0.4×FGM − 0.7×FGA − 0.4×(FTA−FTM) + STL + 0.7×AST + 0.7×BLK − TO − 0.4×FLS. Note: the full formula includes OREB/DREB/PF weightings omitted here due to data availability.',
      sortKey: s => {
        const pts = num(s.ptsTotal); const fgm = num(s.fgm); const fga = num(s.fga);
        const fta = num(s.fta); const ftm = num(s.ftm); const stl = num(s.stlTotal);
        const ast = num(s.astTotal); const blk = num(s.blkTotal); const to = num(s.turnoversTotal);
        const fls = num(s.fls); const gp = num(s.gp) || 1;
        return (pts + 0.4 * fgm - 0.7 * fga - 0.4 * (fta - ftm) + stl + 0.7 * ast + 0.7 * blk - to - 0.4 * fls) / gp;
      }, fmt: v => v.toFixed(1),
    },
    {
      key: 'pps', label: 'PPS', fullName: 'Points Per Shot', description: 'Points scored divided by field goals attempted. Measures scoring efficiency regardless of shot type. A PPS above 1.2 is solid; above 1.4 is excellent.',
      sortKey: s => { const pts = num(s.ptsTotal); const fga = num(s.fga); return fga > 0 ? pts / fga : 0; }, fmt: v => v.toFixed(2),
    },
    {
      key: 'astTo', label: 'AST/TO', fullName: 'Assist-to-Turnover Ratio', description: 'Total assists divided by total turnovers. Measures a player\'s ability to create for others without giving the ball away. A ratio above 2.0 is excellent for primary ball-handlers.',
      sortKey: s => { const ast = num(s.astTotal); const to = num(s.turnoversTotal); return to > 0 ? ast / to : ast; }, fmt: v => v.toFixed(2),
    },
    {
      key: 'stlTo', label: 'STL/TO', fullName: 'Steal-to-Turnover Ratio', description: 'Total steals divided by total turnovers. Measures defensive disruption relative to offensive mistakes. A ratio above 1.0 indicates a player creates more takeaways than giveaways.',
      sortKey: s => { const stl = num(s.stlTotal); const to = num(s.turnoversTotal); return to > 0 ? stl / to : stl; }, fmt: v => v.toFixed(2),
    },
    {
      key: 'per36', label: 'PER36', fullName: 'Points Per 36 Minutes', description: 'Points per 36 minutes of playing time. Standardizes scoring rate to a typical starter\'s workload, enabling fair comparisons between players with different minutes.',
      sortKey: s => { const pts = num(s.ptsTotal); const min = num(s.minTotal); return min > 0 ? pts / min * 36 : 0; }, fmt: v => v.toFixed(1),
    },
  ],
  efficiency: [
    {
      key: 'twoPtPct', label: '2PT%', fullName: 'Two-Point Percentage', description: 'Field goal percentage on two-point attempts only. Calculated as (FGM − 3PTM) ÷ (FGA − 3PTA). A higher 2PT% indicates efficient interior scoring.',
      sortKey: s => {
        const fgm = num(s.fgm); const fga = num(s.fga); const tpm = num(s.threePtm); const tpa = num(s.threePta);
        const denom = fga - tpa; return denom > 0 ? (fgm - tpm) / denom : 0;
      }, fmt: pct,
    },
    {
      key: 'threePtAr', label: '3PAr', fullName: 'Three-Point Attempt Rate', description: 'The share of field goal attempts that come from beyond the arc. Formula: 3PA ÷ FGA. A higher rate indicates a player who favours outside shooting. 0.40+ is high volume.',
      sortKey: s => { const tpa = num(s.threePta); const fga = num(s.fga); return fga > 0 ? tpa / fga : 0; },
      fmt: pct,
    },
    {
      key: 'ftr', label: 'FTr', fullName: 'Free Throw Attempt Rate', description: 'The rate at which a player draws free throw attempts relative to field goals attempted. Formula: FTA ÷ FGA. A higher FTr indicates a player who attacks the rim and draws contact.',
      sortKey: s => { const fta = num(s.fta); const fga = num(s.fga); return fga > 0 ? fta / fga : 0; },
      fmt: pct,
    },
    {
      key: 'tsPct', label: 'TS%', fullName: 'True Shooting Percentage', description: 'A scoring efficiency metric that accounts for 2-pointers, 3-pointers, and free throws. Formula: PTS ÷ (2 × (FGA + 0.44 × FTA)). TS% above 60% is elite; 55%+ is very good.',
      sortKey: s => num(s.tsPct), fmt: pct,
    },
    {
      key: 'efgPct', label: 'eFG%', fullName: 'Effective Field Goal Percentage', description: 'Field goal percentage adjusted for the added value of three-pointers. Formula: (FGM + 0.5 × 3PTM) ÷ FGA. eFG% above 55% is excellent.',
      sortKey: s => num(s.efgPct), fmt: pct,
    },
    {
      key: 'fgPct', label: 'FG%', fullName: 'Field Goal Percentage', description: 'Basic shooting percentage: total field goals made divided by total field goals attempted.',
      sortKey: s => num(s.fgPct), fmt: pct,
    },
  ],
  breakdown: [
    {
      key: 'pctPts2pt', label: '%2PT', fullName: '% of Points from 2-Pointers', description: 'The percentage of total points scored from two-point field goals. Formula: (2 × 2PM) ÷ Total PTS. Helps identify a player\'s scoring identity.',
      sortKey: s => {
        const pts = num(s.ptsTotal); const fgm = num(s.fgm); const tpm = num(s.threePtm);
        return pts > 0 ? (2 * (fgm - tpm)) / pts : 0;
      }, fmt: pct,
    },
    {
      key: 'pctPts3pt', label: '%3PT', fullName: '% of Points from 3-Pointers', description: 'The percentage of total points scored from three-point field goals. Formula: (3 × 3PM) ÷ Total PTS. Players above 40% rely heavily on outside shooting.',
      sortKey: s => {
        const pts = num(s.ptsTotal); const tpm = num(s.threePtm);
        return pts > 0 ? (3 * tpm) / pts : 0;
      }, fmt: pct,
    },
    {
      key: 'pctPtsFt', label: '%FT', fullName: '% of Points from Free Throws', description: 'The percentage of total points scored from free throws. Formula: FTM ÷ Total PTS. High FT% scorers draw fouls and score at the line.',
      sortKey: s => {
        const pts = num(s.ptsTotal); const ftm = num(s.ftm);
        return pts > 0 ? ftm / pts : 0;
      }, fmt: pct,
    },
    {
      key: 'shotDiet', label: '3PA%', fullName: 'Shot Diet — % of Shots from 3PT', description: 'The percentage of field goal attempts that are three-pointers. Formula: 3PA ÷ FGA. Combined with 2PT%, reveals a player\'s shot profile.',
      sortKey: s => { const tpa = num(s.threePta); const fga = num(s.fga); return fga > 0 ? tpa / fga : 0; },
      fmt: pct,
    },
  ],
  misc: [
    { key: 'gp', label: 'GP', fullName: 'Games Played', description: 'Total number of games the player appeared in.', sortKey: s => num(s.gp) },
    { key: 'dnk', label: 'DNK', fullName: 'Total Dunks', description: 'Total number of dunks (two-handed or one-handed slam dunks). Indicates rim pressure and athletic finishing.', sortKey: s => num(s.dnk) },
    { key: 'dd', label: 'DD', fullName: 'Double-Doubles', description: 'Games where the player recorded double-digit totals in two of: points, rebounds, assists, steals, or blocks.', sortKey: s => num(s.dd) },
    { key: 'td', label: 'TD', fullName: 'Triple-Doubles', description: 'Games where the player recorded double-digit totals in three of: points, rebounds, assists, steals, or blocks.', sortKey: s => num(s.td) },
    { key: 'twentyPlusPts', label: '20+', fullName: '20+ Point Games', description: 'Number of games where the player scored 20 or more points.', sortKey: s => num(s.twentyPlusPts) },
    { key: 'fls', label: 'FLS', fullName: 'Total Fouls', description: 'Total personal fouls committed. High foul totals can indicate aggressive defense or poor discipline.', sortKey: s => num(s.fls) },
    { key: 'prf', label: 'PRF', fullName: 'Total Performance Rating', description: 'Total performance rating from the S3 sheet. A composite stat combining scoring, efficiency, and defensive contributions.', sortKey: s => num(s.prf) },
    { key: 'score', label: 'SCORE', fullName: 'Total Score', description: 'Total composite score from the S3 sheet.', sortKey: s => num(s.score) },
  ],
};

const allStatColumns: StatConfig[] = [
  ...statConfigs.per_game,
  { key: 'fgPct', label: 'FG%', fullName: 'Field Goal Percentage', description: 'Basic shooting percentage: total field goals made divided by total field goals attempted.', sortKey: s => num(s.fgPct), fmt: pct },
  { key: 'threePtPct', label: '3P%', fullName: 'Three-Point Percentage', description: 'Three-point field goal percentage: three-pointers made divided by three-pointers attempted.', sortKey: s => num(s.threePtPct), fmt: pct },
  { key: 'ftPct', label: 'FT%', fullName: 'Free Throw Percentage', description: 'Free throw percentage: free throws made divided by free throws attempted.', sortKey: s => num(s.ftPct), fmt: pct },
  ...statConfigs.efficiency.filter(c => ['tsPct', 'efgPct'].includes(c.key)),
  ...statConfigs.totals.filter(c => ['fgm', 'fga', 'threePtm', 'threePta', 'ftm', 'fta'].includes(c.key)),
  ...statConfigs.misc.filter(c => ['dnk', 'dd', 'td', 'twentyPlusPts'].includes(c.key)),
];

const positions = ['PG', 'SG', 'SF', 'PF', 'C'];

const LEAGUES = ['UBA', 'NXT'] as const;
type League = (typeof LEAGUES)[number];

function displayTeamCode(teamName: string | null | undefined): string {
  return (teamName ?? '').split('/')[0]?.trim() ?? '';
}

export function PlayerStatsPage() {
  useDocumentTitle('Season Stats');
  const [statsState, dispatch] = useReducer(statsReducer, { status: 'loading', data: [], error: null });
  const [category, setCategory] = useState<StatCategory>('all');
  const [sortKey, setSortKey] = useState<string>(allStatColumns[0]!.key);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [league, setLeague] = useState<League>('UBA');
  const [hideTwoWay, setHideTwoWay] = useState(true);

  const load = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const data = await fetchPlayerSeasonStats('S3', league);
      if (data.length === 0) dispatch({ type: 'LOAD_ERROR', payload: `No player stats found for ${league} Season 3.` });
      else dispatch({ type: 'LOAD_SUCCESS', payload: data });
    } catch {
      dispatch({ type: 'LOAD_ERROR', payload: 'Failed to load player stats.' });
    }
  }, [league]);

  useEffect(() => { load(); }, [load]);

  const teams = useMemo(() => {
    const set = new Set(statsState.data.flatMap(s => { const c = displayTeamCode(s.teamName); return c ? [c] : []; }));
    return [...set].toSorted();
  }, [statsState.data]);

  const activeConfig = category === 'all' ? allStatColumns : statConfigs[category];
  const activeStat: StatConfig = activeConfig.find(c => c.key === sortKey) ?? activeConfig[0]!;
  const isAllStats = category === 'all';
  const isPerGame = category === 'per_game';

  function selectSort(nextKey: string) {
    setSortDirection(current => (sortKey === nextKey ? (current === 'desc' ? 'asc' : 'desc') : 'desc'));
    setSortKey(nextKey);
  }

  const filtered = useMemo(() => {
    let result = statsState.data;
    if (positionFilter) result = result.filter(s => s.position === positionFilter);
    if (teamFilter) result = result.filter(s => displayTeamCode(s.teamName) === teamFilter);
    if (hideTwoWay) result = result.filter(s => s.rosterStatus !== 'two_way');
    return result.toSorted((a, b) => {
      const delta = activeStat.sortKey(b) - activeStat.sortKey(a);
      return sortDirection === 'desc' ? delta : -delta;
    });
  }, [statsState.data, positionFilter, teamFilter, hideTwoWay, activeStat, sortDirection]);

  function formatValue(s: PlayerSeasonStat): string {
    const raw = activeStat.sortKey(s);
    if (activeStat.fmt) return activeStat.fmt(raw);
    return Number.isInteger(raw) ? raw.toLocaleString() : raw.toFixed(1);
  }

  if (statsState.status === 'loading') {
    return (
      <div className="grid gap-5">
        <PageHeader kicker="Season 3" title="Player statistics." description="S3 season stats — per-game averages, totals, advanced efficiency metrics, scoring breakdown, and miscellaneous counts." />
        <Panel className="flex items-center justify-center py-20">
          <p className="text-sm text-[var(--text3)]">Loading player stats…</p>
        </Panel>
      </div>
    );
  }

  if (statsState.status === 'error') {
    return (
      <div className="grid gap-5">
        <PageHeader kicker="Season 3" title="Player statistics." description="S3 season player stats could not be loaded." />
        <Panel className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-sm text-[var(--text3)]">{statsState.error}</p>
            <button type="button" onClick={load} className="mt-4 rounded-lg bg-uba-gold px-5 py-2 text-sm font-semibold text-uba-gold-text transition-opacity hover:opacity-90">
              Retry
            </button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Season 3"
        title="Player statistics."
        description="S3 season stats — per-game averages, totals, advanced efficiency metrics, scoring breakdown, and miscellaneous counts. Hover over any stat header for a full explanation. Stats are entered manually by the stats team; some teams may have more games recorded than others."
        meta={`${statsState.data.length} players · ${teams.length} teams`}
      />

      <div
        role="tablist"
        aria-label="Select league tier"
        className="flex rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] p-1 w-fit"
      >
        {LEAGUES.map(l => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={league === l}
            aria-controls="stats-panel"
            onClick={() => setLeague(l)}
            className={`rounded-md px-5 py-2 text-sm font-semibold uppercase tracking-[0.15em] transition-colors ${
              league === l
                ? 'bg-uba-gold text-uba-gold-text shadow-sm'
                : 'text-[var(--text3)] hover:text-[var(--text)]'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <section id="stats-panel" aria-live="polite" className="grid gap-5">
        <div className="flex rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] p-1">
          {categories.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                const nextConfig = c.key === 'all' ? allStatColumns : statConfigs[c.key];
                setCategory(c.key);
                setSortKey(nextConfig[0]!.key);
                setSortDirection('desc');
              }}
              className={`rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.15em] transition-colors ${
                category === c.key
                  ? 'bg-uba-gold text-uba-gold-text shadow-sm'
                  : 'text-[var(--text3)] hover:text-[var(--text)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {!isAllStats && (
          <div className="flex rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] p-1">
            {activeConfig.map(c => (
              <button
                key={c.key}
                type="button"
                onClick={() => selectSort(c.key)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  sortKey === c.key
                    ? 'bg-uba-gold text-uba-gold-text shadow-sm'
                    : 'text-[var(--text3)] hover:text-[var(--text)]'
                }`}
              >
                {c.label}{sortKey === c.key ? (sortDirection === 'desc' ? ' DESC' : ' ASC') : ''}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text3)]">Pos</span>
          <select
            value={positionFilter}
            onChange={e => setPositionFilter(e.target.value)}
            className="rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] px-3 py-2 text-sm text-[var(--text)]"
          >
            <option value="">All Positions</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text3)]">Team</span>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] px-3 py-2 text-sm text-[var(--text)]"
          >
            <option value="">All Teams</option>
            {teams.map((t: string) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--navy4)] px-3 py-2">
          <input
            type="checkbox"
            checked={hideTwoWay}
            onChange={e => setHideTwoWay(e.target.checked)}
            className="h-4 w-4 accent-uba-gold"
          />
          <span className="text-xs font-semibold text-[var(--text3)]">Hide 2-way players</span>
        </label>
        {(positionFilter || teamFilter || hideTwoWay) && (
          <span className="text-xs text-[var(--text3)] self-center">
            {filtered.length} {filtered.length === 1 ? 'player' : 'players'}
            {hideTwoWay ? ' shown, 2-way hidden' : ''}
          </span>
        )}
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          {isAllStats ? (
            <table className="w-full min-w-[1700px] border-collapse text-left">
              <thead className="bg-[var(--navy4)] text-xs uppercase tracking-[0.22em] text-[var(--text3)]">
                <tr>
                  <th className="w-12 px-4 py-4">#</th>
                  <th className="sticky left-0 z-10 bg-[var(--navy4)] px-4 py-4">Player</th>
                  <th className="px-4 py-4 text-center">Pos</th>
                  <th className="px-4 py-4 text-center">Team</th>
                  <th className="px-4 py-4 text-center">GP</th>
                  {allStatColumns.map(c => (
                    <th
                      key={c.key}
                      className="px-3 py-4 text-center"
                      aria-sort={sortKey === c.key ? (sortDirection === 'desc' ? 'descending' : 'ascending') : 'none'}
                    >
                      <button
                        type="button"
                        onClick={() => selectSort(c.key)}
                        className={`inline-flex items-center justify-center gap-1 border-b border-dotted transition-colors ${
                          sortKey === c.key
                            ? 'border-uba-gold text-[var(--text)]'
                            : 'border-[var(--text3)] hover:text-[var(--text)]'
                        }`}
                        aria-label={`Sort by ${c.fullName}`}
                      >
                        <Tooltip label={c.fullName} explain={c.description}>
                          <span>{c.label}</span>
                        </Tooltip>
                        {sortKey === c.key && <span aria-hidden="true" className="text-[0.55rem] tracking-[0.12em]">{sortDirection}</span>}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5 + allStatColumns.length} className="px-4 py-12 text-center text-sm text-[var(--text3)]">
                      No players match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s: PlayerSeasonStat, i: number) => (
                    <tr key={s.id} className="bg-[var(--app-card-strong)]">
                      <td className="w-12 px-4 py-4 text-lg font-black text-uba-gold">{i + 1}</td>
                      <td className="sticky left-0 z-10 bg-[var(--app-card-strong)] px-4 py-4">
                        <p className="font-semibold text-[var(--text)]">{s.playerName}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {s.position ? (
                          <span className="inline-block rounded-full bg-[var(--navy4)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text3)]">
                            {s.position}
                          </span>
                        ) : (
                          <span className="text-[var(--text3)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-semibold text-[var(--text3)]">{displayTeamCode(s.teamName) || '—'}</td>
                      <td className="px-4 py-4 text-center text-[var(--text3)]">{s.gp ?? '—'}</td>
                      {allStatColumns.map(c => (
                        <td key={c.key} className={`px-3 py-4 text-center tabular-nums ${sortKey === c.key ? 'font-bold text-[var(--text)]' : 'font-semibold text-[var(--text3)]'}`}>
                          {c.fmt ? c.fmt(c.sortKey(s)) : (Number.isInteger(c.sortKey(s)) ? c.sortKey(s).toLocaleString() : c.sortKey(s).toFixed(1))}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead className="bg-[var(--navy4)] text-xs uppercase tracking-[0.22em] text-[var(--text3)]">
                <tr>
                  <th className="w-12 px-4 py-4">#</th>
                  <th className="px-4 py-4">Player</th>
                  {isPerGame && <th className="px-4 py-4 text-center">Pos</th>}
                  <th className="px-4 py-4 text-center">Team</th>
                  <th className="px-4 py-4 text-center">GP</th>
                  <th className="px-4 py-4 text-center" aria-sort={sortDirection === 'desc' ? 'descending' : 'ascending'}>
                    <button
                      type="button"
                      onClick={() => selectSort(activeStat.key)}
                      className="inline-flex items-center justify-center gap-1 text-[var(--text3)] transition-colors hover:text-[var(--text)]"
                      aria-label={`Sort by ${activeStat.fullName}`}
                    >
                      <Tooltip label={activeStat.fullName} explain={activeStat.description}>
                        <span className="cursor-help border-b border-dotted border-[var(--text3)]">{activeStat.label}</span>
                      </Tooltip>
                      <span aria-hidden="true" className="text-[0.55rem] uppercase tracking-[0.12em]">{sortDirection}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isPerGame ? 6 : 5} className="px-4 py-12 text-center text-sm text-[var(--text3)]">
                      No players match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s: PlayerSeasonStat, i: number) => (
                    <tr key={s.id} className="bg-[var(--app-card-strong)]">
                      <td className="w-12 px-4 py-4 text-lg font-black text-uba-gold">{i + 1}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[var(--text)]">{s.playerName}</p>
                      </td>
                      {isPerGame && (
                        <td className="px-4 py-4 text-center">
                          {s.position ? (
                            <span className="inline-block rounded-full bg-[var(--navy4)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text3)]">
                              {s.position}
                            </span>
                          ) : (
                            <span className="text-[var(--text3)]">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-4 text-center text-sm font-semibold text-[var(--text3)]">{displayTeamCode(s.teamName) || '—'}</td>
                      <td className="px-4 py-4 text-center text-[var(--text3)]">{s.gp ?? '—'}</td>
                      <td className="px-4 py-4 text-center font-bold text-[var(--text)]">
                        {formatValue(s)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
    </div>
  );
}
