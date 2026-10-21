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

export interface SeasonStats {
  seasonId: string;            // e.g. '2024-25' or '2025-26'
  seasonName: string;          // e.g. '2024–25 URC Regular & Finals'
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
}

export type MoraleTier = 'ECSTATIC' | 'HIGH' | 'CONTENT' | 'DISCONTENT' | 'FRUSTRATED';

export interface MoraleLogEntry {
  category: 'PERFORMANCE' | 'ROTATION' | 'TEAM_RESULT' | 'REST' | 'ROLE_SATISFACTION';
  title: string;
  delta: number;
  timestamp: string;
}

export interface PlayerMoraleState {
  score: number;             // 0 to 100
  tier: MoraleTier;
  confidenceModifier: number;// -3 to +3 in-game rating effect
  description: string;
  recentLogs: MoraleLogEntry[];
  consecutiveStarts: number;
  consecutiveBenched: number;
  consecutiveOmitted: number;
}

export type PenaltyDecisionOption = 'POSTS' | 'CORNER_LINEOUT' | 'SCRUM' | 'TAP_AND_GO';

export interface PenaltyKickerCandidate {
  playerId: string;
  number: number;
  name: string;
  kickingAttr: number;
  morale: number;
  confidenceTier: MoraleTier;
  successChance: number; // 0-100%
}

export interface PendingPenaltyDecision {
  team: 'home' | 'away';
  isUserTeam: boolean;
  fieldX: number; // 0-100
  fieldY: number; // 0-70
  distanceToPostsMetres: number;
  angleDescription: 'Central' | 'Slight Angle' | 'Acute Touchline Angle';
  availableKickers: PenaltyKickerCandidate[];
  defaultChoice: PenaltyDecisionOption;
  recommendedChoice: PenaltyDecisionOption;
  reason: string;
}

export interface RatingPerformanceBreakdown {
  baseRating: number;
  currentSeasonDelta: number;
  lastSeasonDelta: number;
  potentialFactor: number;
  moraleFactor?: number;      // Morale & confidence impact (-3 to +3 OVR)
  calculatedOverall: number;
  previousOverall: number;
  overallDelta: number;
  statHighlights: string[];
  recalculatedDate?: string;
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
    severity?: 'MINOR' | 'MODERATE' | 'SEVERE';
    sustainedRound?: number;
    sustainedWeek?: number;
  } | null;
  isRestedThisWeek?: boolean;
  consecutiveStarts?: number; // Number of consecutive matches started without rest (forces rotation at 4-5)
  trainingEfficiency?: number; // 0-100% based on fatigue and injury
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
  // Seasonal and Historical Performance Statistics
  lastSeasonStats?: SeasonStats;
  careerStats?: PlayerCareerStats;
  ratingBreakdown?: RatingPerformanceBreakdown;
  moraleState?: PlayerMoraleState;
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
  developmentScore?: number;
  developmentVerdict?: 'BREAKTHROUGH' | 'RAPID_GROWTH' | 'STEADY' | 'STAGNATION' | 'DECLINE';
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

export type GamePlanPreset = 'DEFENSIVE' | 'NORMAL' | 'ATTACKING' | 'CUSTOM';
export type StyleOfPlay = 'EXPANSIVE' | 'BALANCED' | 'TERRITORY' | 'FORWARDS';
export type KickTendency = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type RuckCommitment = 'CONSERVATIVE' | 'BALANCED' | 'HEAVY' | 'AGGRESSIVE';
export type DefensiveLine = 'DEEP' | 'FLAT' | 'HIGH';
export type PenaltyDecisionMode = 'PROMPT' | 'AUTO';

export interface QueuedSubstitution {
  id: string;
  onPitchJersey: number;
  offPlayerId: string;
  offPlayerName: string;
  offPosition: RugbyPosition;
  onPlayerId: string;
  onPlayerName: string;
  onPlayerPosition: RugbyPosition;
  isInjurySub?: boolean;
}

export interface LiveMatchInjuryEvent {
  injuredPlayerId: string;
  injuredPlayerName: string;
  jerseyNumber: number;
  injuryName: string;
  severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  durationWeeks: number;
  description: string;
  recommendedSub?: {
    playerId: string;
    jerseyNumber: number;
    name: string;
    overall: number;
    position: string;
  };
}

export interface TacticsConfig {
  attackingStyle: AttackingStyle;
  defensiveStyle: DefensiveStyle;
  penaltyChoice: PenaltyChoice;
  tempo: TempoStyle;
  kickFrequency: 'LOW' | 'MEDIUM' | 'HIGH';
  breakdownCommitment: 'LOW' | 'BALANCED' | 'AGGRESSIVE';
  primaryGoalKickerId?: string;
  captainId?: string;
  // Extended tactical controls per Section 4 & 5
  gamePlan?: GamePlanPreset;
  styleOfPlay?: StyleOfPlay;
  kickTendency?: KickTendency;
  ruckCommitment?: RuckCommitment;
  defensiveLine?: DefensiveLine;
  penaltyDecisionMode?: PenaltyDecisionMode;
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
  | 'RIVALRY_HEROIC_TURNOVER'
  | 'PENALTY_DECISION';

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
  actionRoute?: {
    screen: 'dashboard' | 'squad' | 'tactics' | 'competitions' | 'transfers' | 'registry' | 'training' | 'finances' | 'academy' | 'inbox';
    targetEntityId?: string;
    label?: string;
  };
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

export type SeasonPhase = 'REGULAR_SEASON' | 'PLAYOFFS' | 'OFF_SEASON' | 'PRE_SEASON';

export interface SeasonAwards {
  seasonYear: number;
  championClubId: string;
  championClubName: string;
  mvpPlayerId: string;
  mvpPlayerName: string;
  mvpClubName: string;
  mvpRating: number;
  topTryScorerId: string;
  topTryScorerName: string;
  topTryCount: number;
  topTryClubName: string;
  goldenBootId: string;
  goldenBootName: string;
  goldenBootPoints: number;
  goldenBootClubName: string;
}

export interface OffSeasonSummaryData {
  seasonYear: number;
  nextSeasonYear: number;
  careerYear: number;
  champion: { id: string; name: string };
  userFinishPosition: number;
  prizeMoney: number;
  seasonTicketRevenue: number;
  boardSatisfaction: number;
  awards: SeasonAwards;
  retiredPlayers: {
    id: string;
    name: string;
    age: number;
    clubName: string;
    position: RugbyPosition;
    freedWage: number;
    wasUserPlayer: boolean;
  }[];
  expiredToFreeAgents: {
    id: string;
    name: string;
    age: number;
    position: RugbyPosition;
    overall: number;
    wasUserPlayer: boolean;
  }[];
  youthGraduates: {
    id: string;
    name: string;
    position: RugbyPosition;
    age: number;
    overall: number;
    potential: number;
  }[];
  breakoutPlayers: {
    id: string;
    name: string;
    oldPotential: number;
    newPotential: number;
    overall: number;
    wasUserPlayer: boolean;
    developmentScore?: number;
    reason?: string;
  }[];
  stagnatedPlayers?: {
    id: string;
    name: string;
    age: number;
    position: RugbyPosition;
    oldPotential: number;
    newPotential: number;
    overall: number;
    wasUserPlayer: boolean;
    developmentScore: number;
    reason: string;
  }[];
}

export interface PlayerDevelopmentResult {
  playerId: string;
  playerName: string;
  age: number;
  position: RugbyPosition;
  clubId: string;
  developmentScore: number; // 0 - 100
  verdict: 'BREAKTHROUGH' | 'RAPID_GROWTH' | 'STEADY' | 'STAGNATION' | 'DECLINE';
  oldPotential: number;
  newPotential: number;
  oldOverall: number;
  newOverall: number;
  explanation: string;
  factors: {
    matchExperience: number;
    formRating: number;
    keyContributions: number;
    workEthic: number;
  };
}

export interface HistoricalSeasonRecord {
  seasonYear: number;
  careerYear: number;
  championClubId: string;
  championClubName: string;
  userClubId: string;
  userFinishPosition: number;
  awards: SeasonAwards;
  finalTable: LeagueTableRow[];
}

export interface CareerMilestone {
  id: string;
  title: string;
  description: string;
  category: 'STREAK' | 'ACADEMY' | 'TROPHY' | 'MATCH' | 'FINANCE' | 'REPUTATION';
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  icon: string; // 'Flame' | 'Trophy' | 'Sparkles' | 'Shield' | 'Target' | 'Crown' | 'Coins' | 'Users' | 'Building2'
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  target: number;
  rewardCoins: number;
}

