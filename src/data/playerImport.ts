import type { RosterImportGroup, RosterImportRow, RosterImportSummary } from '../types/domain';

/*
 * The old roster import fixture has been scrubbed on purpose. Real player data
 * now comes from team-owned Google Sheets, and the next importer should write
 * those rows into Supabase staging tables before anything becomes canonical.
 * Keeping this module as an empty adapter lets the current review UI render
 * clear empty states without preserving stale or semi-real player identities.
 */
export const rosterImportRows: RosterImportRow[] = [];

export const rosterImportSummary: RosterImportSummary = {
  rawRows: 0,
  totalRows: 0,
  removedDuplicateRows: [],
  matchedRows: 0,
  unmatchedRows: 0,
  matchedTeamCount: 0,
  unmatchedTeamNames: [],
  duplicatePlayerNames: [],
  duplicateDiscords: [],
  invalidHeightRows: [],
  invalidWeightRows: [],
  unknownAcquisitionRows: [],
};

export function rosterImportRowsForTeam(_teamId: string): RosterImportRow[] {
  return [];
}
