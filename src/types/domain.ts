export type RouteId =
  | 'dashboard'
  | 'playerProfile'
  | 'myPlayer'
  | 'teams'
  | 'teamIdentity'
  | 'importReview'
  | 'league'
  | 'standings'
  | 'announcements'
  | 'calculator'
  | 'admin'
  | 'settings'
  | 'schedule'
  | 'trades'
  | 'freeAgency'
  | 'salaryCap'
  | 'rosterManagement'
  | 'injuries'
  | 'notifications'
  | 'leaderboard'
  | 'playerStats';

export type NavItem = {
  id: RouteId;
  label: string;
  path: string;
  kicker: string;
  accent: string;
};

export type BankReviewRow = {
  id: string;
  player_name: string;
  team_name: string | null;
  team_slug: string | null;
  bank: Record<string, number>;
  bank_promoted_at: string | null;
  promoted_player_id: string | null;
};

export type LeaderboardEntry = {
  id: string;
  slug: string;
  gamertag: string;
  position: string;
  height_inches: number;
  team_name: string | null;
  team_slug: string | null;
  score: number;
  badge_count: number | null;
};

export type Conference = 'East' | 'West';
export type LeagueTier = 'UBA' | 'NXT';

export type Team = {
  id: string;
  name: string;
  shortName: string;
  market?: string;
  league: LeagueTier;
  conference?: Conference;
  division?: string;
  captain?: string;
  primaryColor: string;
  logoUrl?: string;
  jerseyImages?: {
    home?: string;
    away?: string;
    alternate?: string;
  };
  capSpace?: number;
  rosterSpots?: number;
  salaryContracts?: Record<string, number>;
  affiliateTeamIds?: string[];
  affiliateLocations?: string[];
};

export type AccountRole = 'admin' | 'gm' | 'player';

export type PlayerStatus = 'active' | 'injured' | 'pending review' | 'prospect' | 'free_agent';

export type PrimaryPosition = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export const primaryPositions: PrimaryPosition[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export const legalHeightRanges: Record<PrimaryPosition, { min: number; max: number; label: string }> = {
  PG: { min: 67, max: 80, label: "5'7\" — 6'8\"" },
  SG: { min: 70, max: 82, label: "5'10\" — 6'10\"" },
  SF: { min: 76, max: 82, label: "6'4\" — 6'10\"" },
  PF: { min: 78, max: 84, label: "6'6\" — 7'0\"" },
  C: { min: 80, max: 87, label: "6'8\" — 7'3\"" },
};

export type HotZoneName =
  | 'under_basket'
  | 'close_left'
  | 'close_middle'
  | 'close_right'
  | 'mid_range_left'
  | 'mid_range_left_center'
  | 'mid_range_center'
  | 'mid_range_right_center'
  | 'mid_range_right'
  | 'three_left'
  | 'three_left_center'
  | 'three_center'
  | 'three_right_center'
  | 'three_right';

export const hotZoneNames: HotZoneName[] = [
  'under_basket',
  'close_left', 'close_middle', 'close_right',
  'mid_range_left', 'mid_range_left_center', 'mid_range_center', 'mid_range_right_center', 'mid_range_right',
  'three_left', 'three_left_center', 'three_center', 'three_right_center', 'three_right',
];

export const hotZoneCourtLabels: Record<HotZoneName, string> = {
  under_basket: 'Under Basket',
  close_left: 'Close Left',
  close_middle: 'Close Middle',
  close_right: 'Close Right',
  mid_range_left: 'Mid-Range Left',
  mid_range_left_center: 'Mid-Range Left Center',
  mid_range_center: 'Mid-Range Center',
  mid_range_right_center: 'Mid-Range Right Center',
  mid_range_right: 'Mid-Range Right',
  three_left: '3pt Left',
  three_left_center: '3pt Left Center',
  three_center: '3pt Center',
  three_right_center: '3pt Right Center',
  three_right: '3pt Right',
};

export type HotZoneStatus = 'hot' | 'lethal' | 'neutral';

export type HotZone = {
  zone: HotZoneName;
  status: HotZoneStatus;
};

export const allTendencyNames = [
  'Step Through Shot',
  'Shot Under Basket',
  'Shot Close',
  'Shot Close Left',
  'Shot Close Middle',
  'Shot Close Right',
  'Shot Mid Range',
  'Spot Up Shot Mid',
  'Off-Screen Shot Mid',
  'Shot Mid Left',
  'Shot Mid Left Center',
  'Shot Mid Center',
  'Shot Mid Right Center',
  'Shot Mid Right',
  'Shot Three',
  'Spot Up Shot 3',
  'Off-Screen Shot 3',
  'Shot Three Left',
  'Shot Three Left Center',
  'Shot Three Center',
  'Shot Three Right Center',
  'Shot Three Right',
  'Contested Jumper 3',
  'Contested Jumper Mid',
  'Step Back Jumper 3',
  'Stepback Jumper Mid',
  'Spin Jumper',
  'Transition Pull Up 3',
  'Drive Pull Up 3',
  'Drive Pull Up Mid Range',
  'Use Glass',
  'Driving Layup',
  'Standing Dunk',
  'Driving Dunk',
  'Flashy Dunk',
  'Alley-Oop',
  'Putback',
  'Crash',
  'Spin Layup',
  'Hop Step Layup',
  'Euro Step Layup',
  'Floater',
  'Triple Threat Pump Fake',
  'Triple Threat Jab Step',
  'Triple Threat Idle',
  'Triple Threat Shoot',
  'Setup With Sizeup',
  'Setup With Hesitation',
  'No Setup Dribble',
  'Drive',
  'Spot Up Drive',
  'Off Screen Drive',
  'Drive Right',
  'Driving Crossover',
  'Driving Spin',
  'Driving Step Back',
  'Driving Half Spin',
  'Drive Double Crossover',
  'Drive Behind The Back',
  'Drive Dribble Hesitation',
  'Driving In And Out',
  'No Driving Dribble Move',
  'Attack Strong On Drive',
  'Dish to Open Man',
  'Flashy Pass',
  'Alley-Oop Pass',
  'Post Up',
  'Post Shimmy Shot',
  'Post Face Up',
  'Post Back Down',
  'Post Aggressive Backdown',
  'Shoot From Post',
  'Post Hook Left',
  'Post Hook Right',
  'Post Fade Left',
  'Post Fade Right',
  'Post Up And Under',
  'Post Hop Shot',
  'Post Step Back Shot',
  'Post Drive',
  'Post Spin',
  'Post Drop Step',
  'Post Hop Step',
  'Shot',
  'Touches',
  'Roll Vs Pop',
  'Transition Spot Up',
  'Iso Vs Elite Defender',
  'Iso Vs Good Defender',
  'Iso Vs Average Defender',
  'Iso Vs Poor Defender',
  'Play Discipline',
  'Pass Interception',
  'Take Charge',
  'On Ball Steal',
  'Contest Shot',
  'Block Shot',
  'Foul',
  'Hard Foul',
] as const;

export type TendencyName = (typeof allTendencyNames)[number];

export type Player = {
  id: string;
  dbId?: string;
  gamertag: string;
  position: PrimaryPosition;
  secondaryPositions?: PrimaryPosition[];
  archetype: string;
  teamId: string;
  teamDbId?: string;
  overall: number;
  heightInches: number;
  wingspan: number;
  ucBalance: number;
  badges: string[];
  status: PlayerStatus;
  trend: 'up' | 'flat' | 'down';
  attributes: {
    finishing: number;
    shooting: number;
    playmaking: number;
    defense: number;
    physicals: number;
  };
  rawAttributes?: Record<string, number>;
  hotZones?: HotZone[];
  tendencies?: Partial<Record<TendencyName, number>>;
  animations?: string[];
};

export type Standing = {
  teamId: string;
  conference: 'East' | 'West';
  conferenceRank: number;
  wins: number;
  losses: number;
  gamesBack: number;
  last10: string | null;
  ptDiff: number;
  winPct: number;
  status: 'clinched' | 'eliminated' | 'in contention';
  season: string;
};

export type StandingWithTeam = Standing & {
  team: Team;
};

export type Announcement = {
  id: string;
  title: string;
  kicker: string;
  category: 'League' | 'Rewards' | 'Roster' | 'Release';
  date: string;
  body: string;
  pinned: boolean;
};

export type AuditEvent = {
  id: string;
  date: string;
  actor: string;
  action: string;
  target: string;
  severity: 'info' | 'review' | 'locked';
};

export type LeagueRule = {
  title: string;
  body: string;
};

export type PermissionRow = {
  area: string;
  player: string;
  gm: string;
  admin: string;
};

export type RosterImportRow = {
  id: string;
  name: string;
  position: string;
  height: string;
  weight: number;
  discord: string;
  acquired: string;
  teamName: string;
  teamDisplayName: string;
  teamId?: string;
  sourceStatus: 'unverified';
};

export type RosterImportSummary = {
  rawRows: number;
  totalRows: number;
  removedDuplicateRows: string[];
  matchedRows: number;
  unmatchedRows: number;
  matchedTeamCount: number;
  unmatchedTeamNames: string[];
  duplicatePlayerNames: string[];
  duplicateDiscords: string[];
  invalidHeightRows: string[];
  invalidWeightRows: string[];
  unknownAcquisitionRows: string[];
};

export type RosterImportGroup = {
  teamName: string;
  teamDisplayName: string;
  teamId?: string;
  rows: RosterImportRow[];
};

export type GameStatus = 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled';

export type Game = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  week: number | null;
  season: string;
  location: string | null;
  homeTeam?: Team;
  awayTeam?: Team;
};

export type InjurySeverity = 'day-to-day' | 'questionable' | 'out' | 'season-ending';

export type Injury = {
  id: string;
  playerId: string;
  injuryType: string;
  severity: InjurySeverity;
  bodyPart: string;
  description: string | null;
  injuredAt: string;
  expectedReturn: string | null;
  recoveredAt: string | null;
  status: 'active' | 'recovered';
  player?: Player;
};

export type NotificationType =
  | 'trade_proposal'
  | 'trade_approved'
  | 'trade_declined'
  | 'roster_change'
  | 'injury_update'
  | 'free_agency'
  | 'check_in_approved'
  | 'check_in_pending'
  | 'system'
  | 'free_agency_bid'
  | 'free_agency_signed';

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export type TradeProposalStatus = 'pending' | 'approved' | 'declined' | 'withdrawn';

export type TradeProposal = {
  id: string;
  proposerTeamId: string;
  receiverTeamId: string;
  proposerSendsPlayerIds: string[];
  proposerSendsUcAmount: number;
  receiverSendsPlayerIds: string[];
  receiverSendsUcAmount: number;
  status: TradeProposalStatus;
  proposedBy: string | null;
  reviewedBy: string | null;
  adminNotes: string | null;
  proposedAt: string;
  reviewedAt: string | null;
  expiresAt: string | null;
  proposerTeam?: Team;
  receiverTeam?: Team;
  proposerPlayers?: Player[];
  receiverPlayers?: Player[];
};

export type FreeAgencyStatus = 'available' | 'bidding' | 'signed' | 'withdrawn';

export type FreeAgencyListing = {
  id: string;
  playerId: string;
  status: FreeAgencyStatus;
  askingUcBalance: number | null;
  currentBidUc: number;
  currentBidTeamId: string | null;
  listedAt: string;
  expiresAt: string | null;
  signedAt: string | null;
  signedTeamId: string | null;
  player?: Player;
  currentBidTeam?: Team;
  signedTeam?: Team;
};

export type SalaryCapConfig = {
  id: string;
  season: string;
  capAmount: number;
  luxuryTaxThreshold: number | null;
};

export type PlayerSeasonStat = {
  id: string;
  season: string;
  tier: 'UBA' | 'NXT';
  playerName: string;
  teamName: string;
  position: string;
  rosterStatus?: 'active' | 'two_way' | 'minor' | 'inactive' | 'released' | string;
  gp: number | null;
  minTotal: number | null;
  ptsTotal: number | null;
  rebTotal: number | null;
  astTotal: number | null;
  stlTotal: number | null;
  blkTotal: number | null;
  turnoversTotal: number | null;
  fgm: number | null;
  fga: number | null;
  threePtm: number | null;
  threePta: number | null;
  ftm: number | null;
  fta: number | null;
  fgPct: number | null;
  threePtPct: number | null;
  ftPct: number | null;
  tsPct: number | null;
  efgPct: number | null;
  score: number | null;
  fls: number | null;
  prf: number | null;
  dnk: number | null;
  dd: number | null;
  td: number | null;
  twentyPlusPts: number | null;
  gameHighs: Record<string, number | null>;
  gameAverages: Record<string, number | null>;
};

export type TeamSalarySummary = {
  team: Team;
  totalContracts: number;
  capSpace: number;
  rosterSpots: number;
  contractCount: number;
  salaryContracts: Record<string, number>;
};
