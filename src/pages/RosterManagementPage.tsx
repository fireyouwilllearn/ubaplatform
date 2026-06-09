import { useEffect, useMemo, useReducer, useState } from 'react';
import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Panel, PageHeader, MetricCard, SectionTitle } from '../components/Panel';
import { fetchPlayersForTeam, fetchUbaTeams, fetchNxtTeams } from '../lib/db';
import type { Player, Team } from '../types/domain';

type TeamState = {
  ubaTeams: Team[];
  nxtTeams: Team[];
  teamPlayers: Player[];
  loading: boolean;
};

type TeamAction =
  | { type: 'SET_UBA_TEAMS'; payload: Team[] }
  | { type: 'SET_NXT_TEAMS'; payload: Team[] }
  | { type: 'LOAD_PLAYERS_START' }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'CLEAR_PLAYERS' };

function teamReducer(state: TeamState, action: TeamAction): TeamState {
  switch (action.type) {
    case 'SET_UBA_TEAMS': return { ...state, ubaTeams: action.payload };
    case 'SET_NXT_TEAMS': return { ...state, nxtTeams: action.payload };
    case 'LOAD_PLAYERS_START': return { ...state, teamPlayers: state.teamPlayers, loading: true };
    case 'SET_PLAYERS': return { ...state, teamPlayers: action.payload, loading: false };
    case 'CLEAR_PLAYERS': return { ...state, teamPlayers: [], loading: false };
  }
}

export function RosterManagementPage() {
  useDocumentTitle('Roster Management');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [teamState, dispatch] = useReducer(teamReducer, { ubaTeams: [], nxtTeams: [], teamPlayers: [], loading: false });

  const allTeams = useMemo(() => [...teamState.ubaTeams, ...teamState.nxtTeams], [teamState.ubaTeams, teamState.nxtTeams]);
  const selectedTeam = useMemo(() => allTeams.find(t => t.id === selectedTeamId), [allTeams, selectedTeamId]);

  useEffect(() => {
    fetchUbaTeams().then(t => dispatch({ type: 'SET_UBA_TEAMS', payload: t }));
    fetchNxtTeams().then(t => dispatch({ type: 'SET_NXT_TEAMS', payload: t }));
  }, []);

  useEffect(() => {
    if (!selectedTeam?.id) { dispatch({ type: 'CLEAR_PLAYERS' }); return; }
    dispatch({ type: 'LOAD_PLAYERS_START' });
    fetchPlayersForTeam(selectedTeam.id).then(
      p => dispatch({ type: 'SET_PLAYERS', payload: p })
    );
  }, [selectedTeam?.id]);

  const filteredPlayers = useMemo(
    () => filterStatus ? teamState.teamPlayers.filter(p => p.status === filterStatus) : teamState.teamPlayers,
    [teamState.teamPlayers, filterStatus]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    teamState.teamPlayers.forEach(p => { counts[p.status] = (counts[p.status] ?? 0) + 1; });
    return counts;
  }, [teamState.teamPlayers]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roster Management"
        kicker="Admin — Player Rosters"
        description="Admin-only panel for managing player rosters. Select a team to view and manage its roster."
      />

      <SectionTitle eyebrow="Team" title="Select Team" />
      <div className="flex flex-wrap gap-2">
        {allTeams.map(team => (
          <button
            type="button"
            key={team.id}
            onClick={() => { setSelectedTeamId(team.id); setFilterStatus(null); }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              selectedTeamId === team.id
                ? 'border-[var(--app-border)] bg-[var(--navy4)] text-[var(--text)]'
                : 'border-[var(--app-border)] text-[var(--text2)] hover:border-[var(--app-border)]'
            }`}
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: team.primaryColor }} />
            {team.shortName}
          </button>
        ))}
      </div>

      {selectedTeam && (
        <>
          <Link to={`/teams/${selectedTeam.id}`} className="block rounded-xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 transition hover:border-[var(--color-uba-gold)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: selectedTeam.primaryColor }}>
                <span className="text-sm font-bold">{selectedTeam.shortName}</span>
              </div>
              <div>
                <div className="font-semibold">{selectedTeam.name}</div>
                <div className="text-xs text-[var(--text3)]">
                  {selectedTeam.league} · {selectedTeam.conference ?? 'No Conference'}
                </div>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Players" value={teamState.loading ? '...' : String(teamState.teamPlayers.length)} detail="On roster" />
            <MetricCard label="Active" value={teamState.loading ? '...' : String(statusCounts['active'] ?? 0)} detail="Active players" />
            <MetricCard label="Injured" value={teamState.loading ? '...' : String(statusCounts['injured'] ?? 0)} detail="Out" />
            <MetricCard label="Other" value={teamState.loading ? '...' : String(teamState.teamPlayers.length - (statusCounts['active'] ?? 0) - (statusCounts['injured'] ?? 0))} detail="Free agent / prospect" />
          </div>

          <SectionTitle eyebrow="Actions" title="Roster Actions" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Link to="/import-review" className="rounded-xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 text-center transition hover:border-[var(--color-uba-gold)]">
              <div className="mb-1 text-lg font-bold text-[var(--text2)]">+</div>
              <div className="text-xs text-[var(--text3)]">Import Players</div>
            </Link>
            <Link to="/import-review" className="rounded-xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 text-center transition hover:border-[var(--color-uba-gold)]">
              <div className="mb-1 text-lg font-bold text-[var(--text2)]">↻</div>
              <div className="text-xs text-[var(--text3)]">Promote Bank Data</div>
            </Link>
            <Link to="/trades" className="rounded-xl border border-[var(--app-border)] bg-[var(--navy4)] p-4 text-center transition hover:border-[var(--color-uba-gold)]">
              <div className="mb-1 text-lg font-bold text-[var(--text2)]">!</div>
              <div className="text-xs text-[var(--text3)]">Trade Players</div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <SectionTitle eyebrow="Roster" title="Players" />
            <div className="flex gap-1 rounded-lg border border-[var(--app-border)] p-0.5">
              <button
                type="button"
                onClick={() => setFilterStatus(null)}
                className={`rounded-md px-2 py-0.5 text-xs transition ${
                  filterStatus === null ? 'bg-[var(--navy4)] text-[var(--text)]' : 'text-[var(--text3)]'
                }`}
              >
                All
              </button>
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-md px-2 py-0.5 text-xs transition ${
                    filterStatus === status ? 'bg-[var(--navy4)] text-[var(--text)]' : 'text-[var(--text3)]'
                  }`}
                >
                  {status} ({count})
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--app-border)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border)] text-xs uppercase text-[var(--text3)]">
                  <th className="p-3 font-medium">Gamertag</th>
                  <th className="p-3 font-medium">Pos</th>
                  <th className="p-3 font-medium">OVR</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Archetype</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map(player => (
                  <tr key={player.id} className="border-b border-[var(--app-border)] transition hover:bg-[var(--navy4)]">
                    <td className="p-3 font-medium text-[var(--text)]">
                      <Link to={`/player-profile/${player.id}`} className="hover:text-[var(--color-uba-gold)]">
                        {player.gamertag}
                      </Link>
                    </td>
                    <td className="p-3 text-[var(--text2)]">{player.position}</td>
                    <td className="p-3 text-[var(--text)]">{player.overall}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-0.5 text-xs ${
                        player.status === 'active' ? 'bg-[var(--c-green)]/15 text-[var(--c-green)]' :
                        player.status === 'injured' ? 'bg-[var(--c-red)]/15 text-[var(--c-red)]' :
                        'bg-[var(--c-amber)]/15 text-[var(--c-amber)]'
                      }`}>
                        {player.status}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--text2)]">{player.archetype}</td>
                  </tr>
                ))}
                {teamState.loading && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[var(--text3)]">Loading players...</td>
                  </tr>
                )}
                {!teamState.loading && filteredPlayers.length === 0 && (
                  <tr>
                    <td colSpan={5} aria-live="polite" className="p-6 text-center text-[var(--text3)]">
                      No players found for this team.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!selectedTeamId && (
        <div className="py-12 text-center text-[var(--text3)]">
          Select a team above to manage its roster.
        </div>
      )}
    </div>
  );
}
