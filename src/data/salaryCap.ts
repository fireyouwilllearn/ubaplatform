import type { SalaryCapConfig, TeamSalarySummary } from '../types/domain';
import type { Team } from '../types/domain';

export const salaryCapConfigs: SalaryCapConfig[] = [
  {
    id: 'sc-2026',
    season: '2026',
    capAmount: 150000,
    luxuryTaxThreshold: 250000,
  },
  {
    id: 'sc-2025',
    season: '2025',
    capAmount: 140000,
    luxuryTaxThreshold: 240000,
  },
];

export function capConfigForSeason(season: string): SalaryCapConfig | undefined {
  return salaryCapConfigs.find(c => c.season === season);
}

export function teamSalarySummaries(teams: Team[]): TeamSalarySummary[] {
  return teams.map(team => {
    const contracts = team.salaryContracts ?? {};
    const totalContracts = Object.values(contracts).reduce((s, v) => s + v, 0);
    return {
      team,
      totalContracts,
      capSpace: (team.capSpace ?? 0) - totalContracts,
      rosterSpots: team.rosterSpots ?? 0,
      contractCount: Object.keys(contracts).length,
      salaryContracts: contracts,
    };
  });
}
