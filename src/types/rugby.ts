export type RugbyPosition =
  | 'LH_PROP'          // 1
  | 'HOOKER'           // 2
  | 'TH_PROP'          // 3
  | 'LOCK_4'           // 4
  | 'LOCK_5'           // 5
  | 'BLINDSIDE_FLANKER'// 6
  | 'OPENSIDE_FLANKER' // 7
  | 'NUMBER_8'         // 8
  | 'SCRUM_HALF'       // 9
  | 'FLY_HALF'         // 10
  | 'LEFT_WING'        // 11
  | 'INSIDE_CENTRE'    // 12
  | 'OUTSIDE_CENTRE'   // 13
  | 'RIGHT_WING'       // 14
  | 'FULLBACK';        // 15

export type PositionCategory = 'PROP' | 'HOOKER' | 'LOCK' | 'FLANKER' | 'NUMBER_8' | 'SCRUM_HALF' | 'FLY_HALF' | 'CENTRE' | 'WING' | 'FULLBACK';

export type RugbyUnit = 'FORWARDS' | 'BACKS';

export type HybridStatus = 'No' | 'Level 1' | 'Level 2' | 'Level 3';
export type HybridLevel = 'NONE' | 'LEVEL_1_LIMITED' | 'LEVEL_2_CAPABLE' | 'LEVEL_3_SPECIALIST';

export interface PlayerCareerStats {
  totalCaps: number;           // Total career caps (club & test matches)
  triesScored: number;         // Total career tries scored
  conversionsAttempted: number;
  conversionsMade: number;
  conversionSuccessRate: number; // Percentage 0-100 (e.g. 82.5%)
  penaltiesAttempted: number;
  penaltiesMade: number;
  penaltySuccessRate: number;  // Percentage 0-100
  totalPoints: number;
  tacklesMade: number;
  turnoversWon: number;
  metresCarried?: number;
  motmAwards?: number;
}

export type SeasonId = '2025-26' | '2026-27';

export const FORWARD_POSITIONS: RugbyPosition[] = [
  'LH_PROP',
  'HOOKER',
  'TH_PROP',
  'LOCK_4',
  'LOCK_5',
  'BLINDSIDE_FLANKER',
  'OPENSIDE_FLANKER',
  'NUMBER_8'
];

export const BACK_POSITIONS: RugbyPosition[] = [
  'SCRUM_HALF',
  'FLY_HALF',
  'LEFT_WING',
  'INSIDE_CENTRE',
  'OUTSIDE_CENTRE',
  'RIGHT_WING',
  'FULLBACK'
];

export function getRugbyUnit(position: RugbyPosition): RugbyUnit {
  return FORWARD_POSITIONS.includes(position) ? 'FORWARDS' : 'BACKS';
}

export function isFrontRow(position: RugbyPosition): boolean {
  return position === 'LH_PROP' || position === 'HOOKER' || position === 'TH_PROP';
}

export interface PlayerAttributes {
  scrummaging: number;        // 1-99
  hooking: number;            // 1-99 (throw/hook)
  lineout: number;            // 1-99 (jumping/timing)
  breakdown: number;          // 1-99 (rucking, turnovers)
  tackling: number;           // 1-99
  carrying: number;           // 1-99 (strength into contact)
  offloading: number;         // 1-99
  passing: number;            // 1-99 (bullet & spin)
  kicking: number;            // 1-99 (territory & clearance)
  goalKicking: number;        // 1-99 (penalty & conversions)
  speed: number;              // 1-99 (pace & acceleration)
  strength: number;           // 1-99
  fitness: number;            // 1-99 (stamina engine)
  tacticalAwareness: number;  // 1-99 (decision making)
  workRate: number;           // 1-99
  consistency: number;        // 1-99
}

export interface Player {
  id: string;
  name: string;
  nationality: string;
  age: number;
  clubId: string;
  clubName?: string;
  primaryPosition: RugbyPosition;
  secondaryPositions: RugbyPosition[];
  heightCm: number;
  weightKg: number;
  attributes: PlayerAttributes;
  potential: number;          // 1-99
  overall: number;            // Calculated 1-99
  marketValue: number;        // e.g. 450,000 GBP
  weeklyWage: number;         // e.g. 5,500 GBP
  contractYearsLeft: number;
  squadRole: 'Key Player' | 'First XV' | 'Squad Rotation' | 'Youth Prospect' | 'Reserve';
  fitness: number;            // 0-100 (current match readiness)
  fatigue: number;            // 0-100
  morale: number;             // 0-100
  form: number;               // 1-10
  injury: {
    name: string;
    weeksRemaining: number;
    type?: string;
  } | null;
  sinBinMinutesRemaining?: number; // In-match tracking
  injuryHistory?: InjuryRecord[]; // Full career and seasonal injury history
  stats: {
    matchesPlayed: number;
    tries: number;
    conversions: number;
    penalties: number;
    dropGoals: number;
    points: number;
    tacklesMade: number;
    tacklesMissed: number;
    turnoversWon: number;
    metresCarried: number;
    yellowCards: number;
    redCards: number;
    avgRating: number;
  };
  // Career Performance Statistics
  careerStats?: PlayerCareerStats;
  // Hybrid Versatility System
  hybridStatus?: HybridStatus;          // 'No' | 'Level 1' | 'Level 2' | 'Level 3'
  approvedPositions?: RugbyPosition[];  // Positions player is certified to play without prohibited penalty
  hybridEvidence?: string;              // Researched real-world evidence / historical match proof
  hybridLevel?: HybridLevel;            // Legacy compatibility alias
  approvedCrossUnitPositions?: RugbyPosition[]; // Legacy compatibility alias
  positionRatings?: Partial<Record<RugbyPosition, number>>;
  hybridTrainingProgress?: number;      // 0-100
  // Official URC Registration Tracking
  registrationCategory?: RegistrationCategory;
  evidenceStatus?: RegistrationEvidenceStatus;
  sourceUrl?: string;
  verifiedDate?: string;
  isVerifiedRealPlayer?: boolean;
  seasonId?: SeasonId;
}

export interface InjuryRecord {
  id: string;
  name: string;                  // e.g. 'Hamstring Strain', 'AC Joint Sprain', 'Concussion'
  type: string;                  // e.g. 'Soft Tissue', 'Ligament', 'HIA Protocol', 'Bone Fracture'
  sustainedDate: string;         // e.g. 'Round 3 (Week 3)' or date
  durationWeeks: number;         // e.g. 3
  severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  recovered: boolean;
  notes?: string;
}

export type RegistrationEvidenceStatus =
  | 'Officially registered'
  | 'Officially confirmed club member'
  | 'Reported signing'
  | 'Historical registration'
  | 'Unconfirmed';

export type RegistrationCategory =
  | 'Senior Contracted'
  | 'Official URC Registered'
  | 'Academy / Development'
  | 'Mid-Season Addition'
  | 'Loan In'
  | 'Loan Out'
  | 'Released / Deregistered'
  | 'Retired';

export interface PlayerRegistration {
  id: string;
  playerId: string;
  playerName: string;
  clubId: string;
  clubName: string;
  season: SeasonId; // '2025-26' | '2026-27'
  primaryPosition: RugbyPosition;
  category: RegistrationCategory;
  evidenceStatus: RegistrationEvidenceStatus;
  startDate?: string;
  endDate?: string;
  sourceUrl?: string;
  verifiedDate?: string;
  notes?: string;
}

export interface Season {
  id: SeasonId; // '2025-26' | '2026-27'
  name: string; // e.g. "2025–26 United Rugby Championship"
  startDate: string;
  endDate: string;
  isCurrentSeason: boolean;
  totalRounds: number;
}

export interface PlayerPosition {
  playerId: string;
  primaryPosition: RugbyPosition;
  secondaryPositions: RugbyPosition[];
  positionRatings: Partial<Record<RugbyPosition, number>>;
  specialistScore: number; // 1-99
}

export interface PlayerRating {
  playerId: string;
  seasonId: SeasonId;
  baseAbility: number; // 1-99
  potential: number;   // 1-99
  currentForm: number; // 1.0 - 10.0
  fitness: number;     // 1-100
  isGameEstimate: boolean; // Flag identifying Rugga 27 game rating vs official stats
  ratingNotes: string;
}

export interface PlayerTransfer {
  id: string;
  playerId: string;
  playerName: string;
  fromClubId: string;
  toClubId: string;
  seasonId: SeasonId;
  effectiveDate: string;
  feeAmount: number;
  transferType: 'PERMANENT' | 'LOAN' | 'ACADEMY_PROMOTION' | 'FREE_AGENT' | 'INJURY_COVER';
  officialAnnouncementUrl?: string;
  isSimulatedCareerTransfer?: boolean;
}

export interface PlayerSource {
  playerId: string;
  officialUrl: string;
  sourceType: 'OFFICIAL_COMPETITION_WEBSITE' | 'OFFICIAL_CLUB_WEBSITE' | 'NATIONAL_UNION_REGISTRY' | 'CONFIRMED_PRESS_RELEASE';
  accessedDate: string;
  verificationEvidence: string;
}

export interface RegistrationVerification {
  playerId: string;
  seasonId: SeasonId;
  clubId: string;
  status: RegistrationEvidenceStatus;
  reconciledWithOfficialRoster: boolean;
  verifiedBy: string;
  auditNotes: string;
  conflictFlag: boolean;
}

export interface HybridEligibility {
  playerId: string;
  status: HybridStatus; // 'No' | 'Level 1' | 'Level 2' | 'Level 3'
  approvedPositions: RugbyPosition[];
  historicalEvidence: string;
  crossUnitCertified: boolean;
  prohibitedPositions: RugbyPosition[];
}

export interface ClubRegistrationAudit {
  clubId: string;
  clubName: string;
  officialFullName?: string;
  shortName?: string;
  country?: string;
  season: SeasonId;
  seniorCount: number;
  academyCount: number;
  loanCount: number;
  midSeasonCount: number;
  totalVerified: number;
  unconfirmedCount: number;
  duplicatesDetected?: number;
  sources: string[];
  lastVerifiedDate: string;
  completenessStatus: 'Complete against available official records' | 'Partially complete' | 'Incomplete' | 'Needs review';
  limitationsNotes?: string;
}

export type LeagueId = 'URC' | 'CURRIE_CUP' | 'SUPER_RUGBY' | 'PREMIERSHIP' | 'INTERNATIONALS';

export interface Club {
  id: string;
  name: string;
  shortName: string;
  leagueId: LeagueId;
  country: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  stadiumName: string;
  stadiumCapacity: number;
  city?: string;
  pitchType?: 'Natural Hybrid Grass' | 'Synthetic Turf' | 'Standard Grass' | string;
  weatherProfile?: 'Dry' | 'Wet' | 'Windy';
  reputation: number;        // 1-100
  transferBudget: number;    // Currency in GBP
  wageBudget: number;        // Weekly wage budget
  facilities: {
    training: number;        // 1-5
    medical: number;         // 1-5
    academy: number;         // 1-5
    stadium: number;         // 1-5
    analytics: number;       // 1-5
  };
  boardConfidence: number;   // 0-100
  fanSatisfaction?: number;  // 0-100
  rivalryH2H?: Record<string, {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    lastResult?: string;
    trophyHeld?: boolean;
  }>;
  managerName?: string;
  isUserControlled?: boolean;
}

export type RivalryIntensity = 'MODERATE' | 'HEATED' | 'FIERCE';

export interface Rivalry {
  id: string;
  name: string;             // e.g. "North-South Derby"
  teamA: string;            // Club ID
  teamB: string;            // Club ID
  trophyName?: string;      // e.g. "North-South Shield"
  intensity: RivalryIntensity; // 'MODERATE' | 'HEATED' | 'FIERCE'
  lore: string;             // Context on history & pride
  tensionModifier: number;  // 1.3 to 1.8
  fanSatisfactionMultiplier: number; // impact multiplier (e.g. 2.0x)
}

export type AttackingStyle = 'BALANCED' | 'WIDE_SPREAD' | 'FORWARD_PACK' | 'TERRITORY_KICK' | 'COUNTER_ATTACK';
export type DefensiveStyle = 'BLITZ_RUSH' | 'DRIFT' | 'BALANCED_LINE' | 'HEAVY_BREAKDOWN';
export type PenaltyChoice = 'POSTS' | 'CORNER_LINEOUT' | 'SCRUM' | 'TAP_AND_GO';
export type TempoStyle = 'HIGH_TEMPO' | 'CONTROLLED' | 'SLOW_ATTRITION';

export interface TacticsConfig {
  attackingStyle: AttackingStyle;
  defensiveStyle: DefensiveStyle;
  penaltyChoice: PenaltyChoice;
  tempo: TempoStyle;
  kickFrequency: 'LOW' | 'MEDIUM' | 'HIGH';
  breakdownCommitment: 'LOW' | 'BALANCED' | 'AGGRESSIVE';
  primaryGoalKickerId?: string;
  captainId?: string;
}

export interface MatchSelection {
  startingXV: Record<number, string>; // Jersey 1 to 15 -> Player ID
  bench: Record<number, string>;      // Jersey 16 to 23 -> Player ID
  substitutionsRemaining?: number;    // World Rugby max 8
  usedSubstitutions?: {
    offPlayerId: string;
    onPlayerId: string;
    minute: number;
    reason: 'TACTICAL' | 'INJURY' | 'HIA';
    position: RugbyPosition;
  }[];
}

export interface LeagueTableRow {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  tryBonusPoints: number;     // 4+ tries
  losingBonusPoints: number;  // Lost by <= 7 points
  points: number;             // Total = (Won*4) + (Drawn*2) + TBP + LBP
}

export interface Fixture {
  id: string;
  round: number;
  leagueId: LeagueId;
  homeClubId: string;
  awayClubId: string;
  played: boolean;
  result?: {
    homeScore: number;
    awayScore: number;
    homeTries: number;
    awayTries: number;
    homeConversions: number;
    awayConversions: number;
    homePenalties: number;
    awayPenalties: number;
    homeDropGoals: number;
    awayDropGoals: number;
    homeTryScorers: string[];
    awayTryScorers: string[];
    events: MatchEvent[];
    homePlayerStats: Record<string, InMatchPlayerStats>;
    awayPlayerStats: Record<string, InMatchPlayerStats>;
  };
}

export type MatchEventType =
  | 'KICK_OFF'
  | 'TRY'
  | 'CONVERSION_SUCCESS'
  | 'CONVERSION_MISS'
  | 'PENALTY_GOAL'
  | 'PENALTY_MISS'
  | 'DROP_GOAL'
  | 'SCRUM'
  | 'LINEOUT'
  | 'MAUL'
  | 'RUCK'
  | 'TACKLE'
  | 'LINE_BREAK'
  | 'TURNOVER'
  | 'KNOCK_ON'
  | 'FORWARD_PASS'
  | 'PENALTY_CONCEDED'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'INJURY'
  | 'SUBSTITUTION'
  | 'HALF_TIME'
  | 'FULL_TIME'
  | 'RIVALRY_SCUFFLE'
  | 'RIVALRY_BIG_HIT'
  | 'RIVALRY_DISPUTE'
  | 'RIVALRY_HEROIC_TURNOVER';

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  description: string;
  teamId: string;
  playerId?: string;
  scoreHome: number;
  scoreAway: number;
  pitchX?: number; // 0-100m
  pitchY?: number; // 0-70m
  isRivalryEvent?: boolean;
}

export interface InMatchPlayerStats {
  playerId: string;
  rating: number;         // 4.0 to 10.0
  tries: number;
  conversions: number;
  penalties: number;
  tacklesMade: number;
  tacklesMissed: number;
  turnoversWon: number;
  metresCarried: number;
  carries: number;
  yellowCard: boolean;
  redCard: boolean;
  injured: boolean;
}

export interface InboxMessage {
  id: string;
  date: string;
  sender: string;
  subject: string;
  body: string;
  category: 'BOARD' | 'TRANSFER' | 'INJURY' | 'MEDIA' | 'SCOUTING' | 'STAFF';
  read: boolean;
  requiresAction?: boolean;
  actionPayload?: any;
}

export interface TransferOffer {
  id: string;
  playerId: string;
  offeringClubId: string;
  sellingClubId: string;
  fee: number;
  wageOffer: number;
  contractYears: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  isLoan: boolean;
}

export interface ScoutingAssignment {
  id: string;
  scoutName: string;
  region: 'South Africa' | 'UK & Ireland' | 'Oceania' | 'France & Europe' | 'Americas';
  positionFilter?: PositionCategory;
  weeksRemaining: number;
  results: string[]; // Player IDs discovered
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Forwards Coach' | 'Backs Coach' | 'Defence Coach' | 'Head Physio' | 'Chief Scout';
  nationality: string;
  rating: number; // 1-20
  weeklySalary: number;
  contractYears: number;
}
