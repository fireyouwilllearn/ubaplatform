import type { Game } from '../types/domain';

const season = '2026';

export const games: Game[] = [
  {
    id: 'g1',
    homeTeamId: 'new-york-empire',
    awayTeamId: 'las-vegas-jokers',
    scheduledAt: '2026-06-01T19:00:00Z',
    homeScore: 87,
    awayScore: 82,
    status: 'final',
    week: 1,
    season,
    location: 'Madison Square Garden',
  },
  {
    id: 'g2',
    homeTeamId: 'detroit-soul',
    awayTeamId: 'minnesota-aurora',
    scheduledAt: '2026-06-01T19:30:00Z',
    homeScore: 91,
    awayScore: 78,
    status: 'final',
    week: 1,
    season,
    location: 'Detroit Arena',
  },
  {
    id: 'g3',
    homeTeamId: 'oakland-sea-lions',
    awayTeamId: 'seattle-octopus',
    scheduledAt: '2026-06-02T20:00:00Z',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    week: 2,
    season,
    location: 'Oakland Coliseum',
  },
  {
    id: 'g4',
    homeTeamId: 'chicago-cyclones',
    awayTeamId: 'dallas-toros',
    scheduledAt: '2026-06-02T20:00:00Z',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    week: 2,
    season,
    location: 'Chicago Stadium',
  },
];

export const weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

function gamesForTeam(teamId: string): Game[] {
  return games.filter(g => g.homeTeamId === teamId || g.awayTeamId === teamId);
}

export function gamesByWeek(week: number): Game[] {
  return games.filter(g => g.week === week);
}
