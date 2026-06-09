import { allTendencyNames, hotZoneCourtLabels, hotZoneNames, type HotZoneName, type PrimaryPosition } from '../types/domain';

export const teamSheetTabs = ['Players', 'Bank', 'Attributes', 'Badges', 'Tendencies', 'Misc.'] as const;

const playerSheetHeaders = [
  'Name',
  'Position',
  'Height',
  'Weight',
  'Discord name',
  'Drafted/Free Agent',
  'Season Joined',
  '2 way/UBAnxt',
] as const;

export const attributeSheetHeaders = [
  'Driving Layup',
  'Post Fade',
  'Post Hook',
  'Post Control',
  'Draw Foul',
  'Close Shot',
  'Mid Range',
  '3PT',
  'Free Throw',
  'Ball Handle',
  'Pass IQ',
  'Pass Accuracy',
  'Offensive Rebound',
  'Standing Dunk',
  'Driving Dunk',
  'Shot IQ',
  'Pass Vision',
  'Hands',
  'Defensive Rebound',
  'Interior Defense',
  'Perimeter Defense',
  'Block',
  'Steal',
  'Speed',
  'Speed With Ball',
  'Vertical',
  'Strength',
  'Stamina',
  'Hustle',
  'Agility',
  'Pass Perception',
  'Defensive Consistency',
  'Help Defense IQ',
  'Offensive Consistency',
] as const;

export const badgeSheetHeaders = [
  'Float Game',
  'Posterizer',
  'Rise Up',
  'Aerial Wizard',
  'Hook Specialist',
  'Layup Mixmaster',
  'Paint Prodigy',
  'Physical Finisher',
  'Post Powerhouse',
  'Post-Up Poet',
  'Post Fade Phenom',
  'Deadeye',
  'Limitless Range',
  'Slippery Off-Ball',
  'Mini Marksman',
  'Set Shot Specialist',
  'Shifty Shooter',
  'Bail Out',
  'Break Starter',
  'Dimer',
  'Handles for Days',
  'Unpluckable',
  'Versatile Visionary',
  'Ankle Assassin',
  'Lightning Launch',
  'Strong Handle',
  'Post Lockdown',
  'Challenger',
  'Off-Ball Pest',
  'Pick Dodger',
  'Glove',
  'Interceptor',
  'Pogo Stick',
  'On-Ball Menace',
  'High-Flying Denier',
  'Paint Patroller',
  'Brick Wall',
  'Immovable Enforcer',
  'Boxout Beast',
  'Rebound Chaser',
] as const;

export const bankSheetHeaders = [
  'Weekly check in',
  'Stream Check in',
  'Point Tasks',
  'Pro Contract',
  'Signing Bonus',
  'Pro Incentives',
  'UC carried over',
  'Total UC',
  'Fines',
  'Upgrade Purchases',
  'Total Spent',
] as const;

const hotzoneSheetHeaders: Array<{ zone: HotZoneName; label: string }> = hotZoneNames.map((zone) => ({
  zone,
  label: hotZoneCourtLabels[zone],
}));

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'hof' | 'legend';
export type ImportedRosterStatus = 'active' | 'two_way' | 'minor' | 'needs_review';

export type TendencyCellReview =
  | { status: 'complete'; values: Partial<Record<(typeof allTendencyNames)[number], number>>; manualLabel?: never }
  | { status: 'empty'; values?: never; manualLabel?: never }
  | { status: 'needs_manual'; values?: never; manualLabel: string }
  | { status: 'invalid'; values?: never; manualLabel: string };

const badgeTierAliases: Record<string, BadgeTier> = {
  bronze: 'bronze',
  silver: 'silver',
  gold: 'gold',
  hof: 'hof',
  'hall of fame': 'hof',
  legend: 'legend',
};

const legalPositions = new Set<PrimaryPosition>(['PG', 'SG', 'SF', 'PF', 'C']);

function normalizeSheetHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parseIntegerCell(value: string): number | null {
  const normalized = value.replace(/,/g, '').trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseHeightInches(value: string): number | null {
  const match = /^(?<feet>[5-7])\s*(?:'|")\s*(?<inches>\d{0,2})\s*"?$/.exec(value.trim());

  if (!match?.groups) {
    return null;
  }

  const feet = Number(match.groups['feet']);
  const inches = match.groups['inches'] ? Number(match.groups['inches']) : 0;

  if (inches > 11) {
    return null;
  }

  return feet * 12 + inches;
}

function normalizePrimaryPosition(value: string): PrimaryPosition | null {
  const normalized = value.trim().toUpperCase();
  return legalPositions.has(normalized as PrimaryPosition) ? normalized as PrimaryPosition : null;
}

function normalizeBadgeTier(value: string): BadgeTier | null {
  const normalized = value.trim().toLowerCase();
  return normalized ? badgeTierAliases[normalized] ?? null : null;
}

function normalizeRosterStatus(value: string): ImportedRosterStatus {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return 'active';
  }

  if (normalized.includes('2 way') || normalized.includes('two way') || normalized.includes('twoway')) {
    return 'two_way';
  }

  if (normalized.includes('ubanxt') || normalized.includes('nxt')) {
    return 'minor';
  }

  return 'needs_review';
}

function reviewTendencyCells(cells: string[]): TendencyCellReview {
  const trimmed: string[] = [];
  for (const cell of cells) {
    const t = cell.trim();
    if (t) trimmed.push(t);
  }

  if (trimmed.length === 0) {
    return { status: 'empty' };
  }

  const numbers = cells.map(parseIntegerCell);
  const allNumeric = numbers.length === allTendencyNames.length && numbers.every((value) => value !== null && value >= 0 && value <= 100);

  if (allNumeric) {
    return {
      status: 'complete',
      values: allTendencyNames.reduce<Partial<Record<(typeof allTendencyNames)[number], number>>>((acc, tendencyName, index) => {
        const value = numbers[index];

        if (value !== null) {
          acc[tendencyName] = value;
        }

        return acc;
      }, {}),
    };
  }

  const manualLabel = trimmed.join(' | ');
  const hasManualPlaceholder = trimmed.some((cell) => /https?:\/\/|tends?|tendenc/i.test(cell));

  return {
    status: hasManualPlaceholder ? 'needs_manual' : 'invalid',
    manualLabel,
  };
}
