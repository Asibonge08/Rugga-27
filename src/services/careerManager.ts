import {
  Club,
  Player,
  LeagueId,
  TacticsConfig,
  MatchSelection,
  LeagueTableRow,
  Fixture,
  InboxMessage,
  TransferOffer,
  ScoutingAssignment,
  StaffMember,
  RugbyPosition,
  FORWARD_POSITIONS,
  BACK_POSITIONS,
  isFrontRow,
  PlayerAttributes,
  SeasonPhase,
  SeasonAwards,
  OffSeasonSummaryData,
  HistoricalSeasonRecord,
  PlayerDevelopmentResult,
  CareerMilestone
} from '../types/rugby';
import {
  INITIAL_CLUBS,
  generateClubSquad,
  generateFixturesForLeague,
  calculatePlayerOverall,
  POSITIONS_ORDER,
  getPositionShort,
  getPositionName,
  JERSEY_TO_POSITION,
  ensurePlayerHasMinimumPositions,
  getNaturalSecondaryPositions
} from '../data/rugbyDatabase';
import { getRivalry, calculateFanSatisfactionDelta } from '../data/rugbyRivalries';
import { urcRegistry } from './urcRegistryService';
import { checkPositionalEligibility, recalculatePlayerRating, recalculateBatchRatings, calculatePerformanceRating, deriveLastSeasonStats } from './playerRatingService';
import { applyMatchPerformanceMorale, applyTeamResultMorale, applyWeeklyRotationMorale, initPlayerMoraleState } from './playerMoraleService';
import { generateAuthenticPlayerName } from '../calculations';

export function createDefaultMilestones(): CareerMilestone[] {
  return [
    {
      id: 'unbeaten_10',
      title: '10-Match Unbeaten Run',
      description: 'Go 10 consecutive official matches without a defeat',
      category: 'STREAK',
      tier: 'GOLD',
      icon: 'Flame',
      unlocked: false,
      progress: 0,
      target: 10,
      rewardCoins: 500
    },
    {
      id: 'academy_debut',
      title: 'Academy Graduate Debut',
      description: 'Promote an academy graduate and start him in the First XV',
      category: 'ACADEMY',
      tier: 'SILVER',
      icon: 'Sparkles',
      unlocked: false,
      progress: 0,
      target: 1,
      rewardCoins: 250
    },
    {
      id: 'first_trophy',
      title: 'First Trophy Win',
      description: 'Crowned champions of the United Rugby Championship',
      category: 'TROPHY',
      tier: 'PLATINUM',
      icon: 'Trophy',
      unlocked: false,
      progress: 0,
      target: 1,
      rewardCoins: 1000
    },
    {
      id: 'derby_conqueror',
      title: 'Derby Conqueror',
      description: 'Defeat your fiercest traditional derby rivals 3 times',
      category: 'MATCH',
      tier: 'GOLD',
      icon: 'Swords',
      unlocked: false,
      progress: 0,
      target: 3,
      rewardCoins: 400
    },
    {
      id: 'high_roller_50',
      title: 'Century Scoreline',
      description: 'Score 50 or more points in a single competitive fixture',
      category: 'MATCH',
      tier: 'SILVER',
      icon: 'Target',
      unlocked: false,
      progress: 0,
      target: 50,
      rewardCoins: 300
    },
    {
      id: 'clean_sheet',
      title: 'Defensive Fortress',
      description: 'Win a match without conceding a single try (0 tries against)',
      category: 'MATCH',
      tier: 'BRONZE',
      icon: 'Shield',
      unlocked: false,
      progress: 0,
      target: 1,
      rewardCoins: 200
    },
    {
      id: 'home_fortress',
      title: 'Home Fortress',
      description: 'Win 5 consecutive home matches in your home stadium',
      category: 'STREAK',
      tier: 'SILVER',
      icon: 'Building2',
      unlocked: false,
      progress: 0,
      target: 5,
      rewardCoins: 350
    },
    {
      id: 'youth_pioneer',
      title: 'Youth Pioneer',
      description: 'Field 3 or more U-21 / Academy prospects in the Starting XV',
      category: 'ACADEMY',
      tier: 'GOLD',
      icon: 'Users',
      unlocked: false,
      progress: 0,
      target: 3,
      rewardCoins: 450
    },
    {
      id: 'financial_titan',
      title: 'Financial Titan',
      description: 'Build a healthy club balance of over £3,000,000',
      category: 'FINANCE',
      tier: 'PLATINUM',
      icon: 'Coins',
      unlocked: false,
      progress: 0,
      target: 3000000,
      rewardCoins: 600
    }
  ];
}

export interface CareerState {
  version: number;
  managerName: string;
  userClubId: string;
  seasonYear: number;
  currentRound: number;
  weekNumber: number;
  coins: number;
  seasonPhase: SeasonPhase;
  careerYear: number;
  totalCareerYears: number;
  isTransferWindowOpen: boolean;
  lastDailyClaimTimestamp?: number;
  clubs: Club[];
  players: Player[];
  fixtures: Fixture[];
  leagueTables: Record<LeagueId, LeagueTableRow[]>;
  userTactics: TacticsConfig;
  userLineup: MatchSelection;
  inbox: InboxMessage[];
  transferOffers: TransferOffer[];
  scoutingAssignments: ScoutingAssignment[];
  staff: StaffMember[];
  youthProspects: Player[];
  trainingSchedule: {
    focus: 'BALANCED' | 'SET_PIECE' | 'BREAKDOWN' | 'ATTACK_PATTERNS' | 'DEFENCE_FITNESS';
    intensity: 'LOW' | 'NORMAL' | 'HIGH';
  };
  activeTargetedTraining?: ActiveTargetedTraining | null;
  lastOffSeasonSummary?: OffSeasonSummaryData | null;
  seasonArchives?: HistoricalSeasonRecord[];
  milestones: CareerMilestone[];
  statsStreak?: {
    unbeaten: number;
    homeWins: number;
    totalMatches: number;
    derbyWins: number;
  };
}

export interface ActiveTargetedTraining {
  id: string;
  focus: 'ATTACK' | 'DEFENCE' | 'SET_PIECE' | 'KICKING';
  durationWeeks: number; // 1 to 3
  weeksRemaining: number;
  ratingBoost: number; // e.g. +0.8 or +1.4
  costCoins: number;
  startedWeek: number;
}

const STORAGE_KEY = 'rugga_27_urc_save_v1';
const LEGACY_STORAGE_KEY = 'rugby_dynasty_urc_save_v1';

export class CareerManager {
  private state: CareerState;
  private subscribers: ((state: CareerState) => void)[] = [];

  constructor() {
    this.state = this.loadFromStorage() || this.createNewCareer('leinster', 'Coach Dupont');
  }

  public getState(): CareerState {
    return this.state;
  }

  public subscribe(cb: (state: CareerState) => void): () => void {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  public notify() {
    this.saveToStorage();
    this.subscribers.forEach(cb => cb({ ...this.state }));
  }

  public createNewCareer(userClubId: string, managerName: string): CareerState {
    let customClubsMap: Record<string, Partial<Club>> = {};
    try {
      const stored = localStorage.getItem('rugga_27_custom_clubs_v1');
      if (stored) customClubsMap = JSON.parse(stored);
    } catch {
      // storage unavailable
    }

    const clubs: Club[] = JSON.parse(JSON.stringify(INITIAL_CLUBS)).map((c: Club) => {
      const overrides = customClubsMap[c.id] || {};
      return {
        ...c,
        ...overrides,
        isUserControlled: c.id === userClubId,
        fanSatisfaction: c.fanSatisfaction ?? 82,
        rivalryH2H: {}
      };
    });

    // Generate squads for all clubs
    let players: Player[] = [];
    clubs.forEach(c => {
      const clubSquad = generateClubSquad(c);
      players = players.concat(clubSquad);
    });

    // Explicitly exclude departed Sharks players (Fassi, Am) per updated real-world roster
    players = players.filter(p => {
      const lower = p.name.toLowerCase().trim();
      return !(
        p.id === 'urc_p_153215' ||
        p.id === 'urc_p_180559' ||
        lower.includes('fassi') ||
        lower.includes('lukhanyo am') ||
        (p.clubId === 'sharks_urc' && lower === 'am')
      );
    });

    // Ensure every single player has a minimum of 2 playable positions without exception
    players.forEach(p => ensurePlayerHasMinimumPositions(p));

    // Calibrate all players' ratings going by current stats this season, last season stats, and potential
    recalculateBatchRatings(players);

    // Generate fixtures and tables for URC exclusively
    let allFixtures: Fixture[] = [];
    const leagueTables: Record<LeagueId, LeagueTableRow[]> = {
      URC: [],
      CURRIE_CUP: [],
      SUPER_RUGBY: [],
      PREMIERSHIP: [],
      INTERNATIONALS: []
    };

    const { fixtures, table } = generateFixturesForLeague(clubs, 'URC');
    allFixtures = fixtures;
    leagueTables.URC = table;

    // Default Starting XV and Bench for user club
    const userPlayers = players.filter(p => p.clubId === userClubId);
    const startingXV: Record<number, string> = {};
    const bench: Record<number, string> = {};

    POSITIONS_ORDER.forEach((pos, idx) => {
      const jersey = idx + 1;
      // Sort matching players by overall descending so elite international caliber stars always start
      const matching = userPlayers.filter(p => p.primaryPosition === pos).sort((a, b) => b.overall - a.overall);
      if (matching.length > 0) {
        startingXV[jersey] = matching[0].id;
        if (matching[1]) {
          bench[16 + (idx % 8)] = matching[1].id;
        }
      } else if (userPlayers[idx]) {
        startingXV[jersey] = userPlayers[idx].id;
      }
    });

    // Fill remaining bench spots
    const unpicked = userPlayers.filter(p => !Object.values(startingXV).includes(p.id));
    for (let bJersey = 16; bJersey <= 23; bJersey++) {
      if (!bench[bJersey] && unpicked[bJersey - 16]) {
        bench[bJersey] = unpicked[bJersey - 16].id;
      }
    }

    const userTactics: TacticsConfig = {
      attackingStyle: 'BALANCED',
      defensiveStyle: 'BLITZ_RUSH',
      penaltyChoice: 'POSTS',
      tempo: 'HIGH_TEMPO',
      kickFrequency: 'MEDIUM',
      breakdownCommitment: 'BALANCED'
    };

    const initialInbox: InboxMessage[] = [
      {
        id: 'msg_welcome',
        date: 'Week 1',
        sender: 'Club Chairman',
        subject: `Welcome to ${clubs.find(c => c.id === userClubId)?.name}!`,
        body: `Welcome Head Coach ${managerName}. The board and supporters are thrilled to have you take charge for the upcoming campaign. Our primary objective is to qualify for the playoffs and maintain healthy finances. Review your squad, set your tactical philosophy, and prepare for Round 1!`,
        category: 'BOARD',
        read: false
      },
      {
        id: 'msg_scout_network',
        date: 'Week 1',
        sender: 'Head of Recruitment',
        subject: 'Scouting network active for recruitment',
        body: 'Our global scouting team is active across South Africa, UK, France, and Oceania. Check the transfer market to identify targets or negotiate contracts for expiring stars.',
        category: 'SCOUTING',
        read: false
      }
    ];

    const staff: StaffMember[] = [
      { id: 'st_1', name: 'Pieter van Zyl', role: 'Forwards Coach', nationality: 'South Africa', rating: 17, weeklySalary: 3500, contractYears: 2 },
      { id: 'st_2', name: 'Conor O’Shea', role: 'Backs Coach', nationality: 'Ireland', rating: 18, weeklySalary: 3800, contractYears: 3 },
      { id: 'st_3', name: 'Shaun Edwards', role: 'Defence Coach', nationality: 'England', rating: 19, weeklySalary: 4200, contractYears: 2 },
      { id: 'st_4', name: 'Dr. Liam Murphy', role: 'Head Physio', nationality: 'Ireland', rating: 16, weeklySalary: 2800, contractYears: 2 }
    ];

    // Generate 3 initial youth academy prospects
    const youthProspects: Player[] = this.generateYouthBatch(userClubId, 3);

    this.state = {
      version: 1,
      managerName,
      userClubId,
      seasonYear: 2026,
      currentRound: 1,
      weekNumber: 1,
      coins: 750,
      seasonPhase: 'REGULAR_SEASON',
      careerYear: 1,
      totalCareerYears: 20,
      isTransferWindowOpen: false, // Closed during regular season (Free agents only)
      clubs,
      players,
      fixtures: allFixtures,
      leagueTables,
      userTactics,
      userLineup: { startingXV, bench },
      inbox: initialInbox,
      transferOffers: [],
      scoutingAssignments: [
        { id: 'sc_1', scoutName: 'Jaco Pretorius', region: 'South Africa', weeksRemaining: 2, results: [] }
      ],
      staff,
      youthProspects,
      trainingSchedule: {
        focus: 'BALANCED',
        intensity: 'NORMAL'
      },
      activeTargetedTraining: null,
      lastOffSeasonSummary: null,
      seasonArchives: [],
      milestones: createDefaultMilestones(),
      statsStreak: {
        unbeaten: 0,
        homeWins: 0,
        totalMatches: 0,
        derbyWins: 0
      }
    };

    this.notify();
    return this.state;
  }

  private generateYouthBatch(clubId: string, count: number): Player[] {
    const list: Player[] = [];
    const club = this.state?.clubs.find(c => c.id === clubId) || INITIAL_CLUBS[0];

    for (let i = 0; i < count; i++) {
      const pos = POSITIONS_ORDER[Math.floor(Math.random() * POSITIONS_ORDER.length)];
      const name = generateAuthenticPlayerName(club.country);

      // Elite prospects spawn at 78–88 OVR with potential up to 95+
      const baseRating = 78 + Math.floor(Math.random() * 9);
      const attrs = {
        scrummaging: baseRating + Math.floor(Math.random() * 6),
        hooking: baseRating,
        lineout: baseRating,
        breakdown: baseRating + 2,
        tackling: baseRating + 3,
        carrying: baseRating + 4,
        offloading: baseRating + 1,
        passing: baseRating + 2,
        kicking: baseRating,
        goalKicking: baseRating - 2,
        speed: baseRating + 5,
        strength: baseRating + 4,
        fitness: 92,
        tacticalAwareness: baseRating,
        workRate: baseRating + 4,
        consistency: baseRating
      };

      const overall = calculatePlayerOverall(pos, attrs);
      list.push({
        id: `youth_${clubId}_${Date.now()}_${i}`,
        name,
        nationality: club.country,
        age: 18 + Math.floor(Math.random() * 3),
        clubId,
        primaryPosition: pos,
        secondaryPositions: getNaturalSecondaryPositions(pos),
        heightCm: 185 + Math.floor(Math.random() * 12),
        weightKg: 96 + Math.floor(Math.random() * 18),
        attributes: attrs,
        potential: Math.min(97, Math.max(92, overall + 8 + Math.floor(Math.random() * 6))),
        overall,
        marketValue: 260000 + Math.floor(Math.random() * 300000),
        weeklyWage: 1200,
        contractYearsLeft: 3,
        squadRole: 'Youth Prospect',
        fitness: 98,
        fatigue: 5,
        morale: 90,
        form: 7,
        injury: null,
        stats: {
          matchesPlayed: 0,
          tries: 0,
          conversions: 0,
          penalties: 0,
          dropGoals: 0,
          points: 0,
          tacklesMade: 0,
          tacklesMissed: 0,
          turnoversWon: 0,
          metresCarried: 0,
          yellowCards: 0,
          redCards: 0,
          avgRating: 7.0
        }
      });
    }

    return list;
  }

  // Update starting XV or Bench
  public updateLineup(startingXV: Record<number, string>, bench: Record<number, string>) {
    this.state.userLineup = { startingXV, bench };
    this.checkMilestones();
    this.notify();
  }

  /**
   * Calculate player training efficiency (0 to 100%) based on fatigue and injury status
   */
  public calculateTrainingEfficiency(player: Player): number {
    if (player.injury) return 0; // Injured players cannot train; efficiency is 0%
    if (player.isRestedThisWeek) return 100; // Rested players perform light regenerative work

    if (player.fatigue >= 85) return 15; // Severe burnout / exhaustion
    if (player.fatigue >= 70) return 40; // Heavy fatigue
    if (player.fatigue >= 50) return 70; // Noticeable fatigue
    if (player.fatigue >= 35) return 88; // Moderate load
    return 100; // Fresh & optimal
  }

  /**
   * Toggle manager designation for individual player rest (skips contact drills for deep fatigue recovery)
   */
  public togglePlayerRest(playerId: string): { success: boolean; isRested: boolean; message: string } {
    const p = this.state.players.find(x => x.id === playerId);
    if (!p) return { success: false, isRested: false, message: 'Player not found' };

    p.isRestedThisWeek = !p.isRestedThisWeek;
    this.notify();
    return {
      success: true,
      isRested: !!p.isRestedThisWeek,
      message: p.isRestedThisWeek
        ? `${p.name} placed on designated rest. Will recover extra fatigue and avoid training injury risk.`
        : `${p.name} returned to standard training schedule.`
    };
  }

  /**
   * Return any players currently in userLineup who are sidelined with injury
   */
  public getInjuredLineupPlayers(clubId: string = this.state.userClubId): {
    starting: { jersey: number; player: Player }[];
    bench: { jersey: number; player: Player }[];
  } {
    const starting: { jersey: number; player: Player }[] = [];
    const bench: { jersey: number; player: Player }[] = [];

    Object.entries(this.state.userLineup.startingXV).forEach(([jerseyStr, pid]) => {
      const p = this.state.players.find(x => x.id === pid && x.clubId === clubId);
      if (p && p.injury) {
        starting.push({ jersey: Number(jerseyStr), player: p });
      }
    });

    Object.entries(this.state.userLineup.bench).forEach(([jerseyStr, pid]) => {
      const p = this.state.players.find(x => x.id === pid && x.clubId === clubId);
      if (p && p.injury) {
        bench.push({ jersey: Number(jerseyStr), player: p });
      }
    });

    return { starting, bench };
  }

  /**
   * 1-Click Auto-Replace any injured players in the Starting XV and Bench with healthy, eligible squad members
   */
  public autoFixInjuredLineup(clubId: string = this.state.userClubId): {
    replacedCount: number;
    details: string[];
  } {
    const userPlayers = this.state.players.filter(p => p.clubId === clubId);
    const currentPickedIds = new Set<string>([
      ...Object.values(this.state.userLineup.startingXV),
      ...Object.values(this.state.userLineup.bench)
    ]);

    const details: string[] = [];
    let replacedCount = 0;

    // 1. Fix starting XV
    Object.entries(this.state.userLineup.startingXV).forEach(([jerseyStr, pid]) => {
      const jersey = Number(jerseyStr);
      const p = userPlayers.find(x => x.id === pid);
      if (p && p.injury) {
        currentPickedIds.delete(p.id);
        const targetPos = JERSEY_TO_POSITION[jersey];

        // Find healthiest, highest-rated healthy eligible player
        const candidates = userPlayers
          .filter(c => !c.injury && !currentPickedIds.has(c.id))
          .filter(c => {
            if (!targetPos) return true;
            const el = checkPositionalEligibility(c, targetPos);
            return el.eligible;
          })
          .sort((a, b) => {
            const scoreA = a.overall + (100 - a.fatigue) * 0.2 + a.fitness * 0.2;
            const scoreB = b.overall + (100 - b.fatigue) * 0.2 + b.fitness * 0.2;
            return scoreB - scoreA;
          });

        if (candidates.length > 0) {
          const replacement = candidates[0];
          this.state.userLineup.startingXV[jersey] = replacement.id;
          currentPickedIds.add(replacement.id);
          replacedCount++;
          details.push(`Replaced #${jersey} ${p.name} (${p.injury.name}) with ${replacement.name} (OVR ${replacement.overall})`);
        }
      }
    });

    // 2. Fix bench
    Object.entries(this.state.userLineup.bench).forEach(([jerseyStr, pid]) => {
      const jersey = Number(jerseyStr);
      const p = userPlayers.find(x => x.id === pid);
      if (p && p.injury) {
        currentPickedIds.delete(p.id);

        const candidates = userPlayers
          .filter(c => !c.injury && !currentPickedIds.has(c.id))
          .sort((a, b) => {
            const scoreA = a.overall + (100 - a.fatigue) * 0.2 + a.fitness * 0.2;
            const scoreB = b.overall + (100 - b.fatigue) * 0.2 + b.fitness * 0.2;
            return scoreB - scoreA;
          });

        if (candidates.length > 0) {
          const replacement = candidates[0];
          this.state.userLineup.bench[jersey] = replacement.id;
          currentPickedIds.add(replacement.id);
          replacedCount++;
          details.push(`Replaced Bench #${jersey} ${p.name} (${p.injury.name}) with ${replacement.name} (OVR ${replacement.overall})`);
        }
      }
    });

    if (replacedCount > 0) {
      this.notify();
    }

    return { replacedCount, details };
  }

  /**
   * Automatically assemble the optimal Starting XV and Bench
   * based on player overall rating, primary/secondary position fit, current energy levels, and injury/suspension status.
   */
  public autoPickBestXV(clubId: string = this.state.userClubId): {
    startingXV: Record<number, string>;
    bench: Record<number, string>;
  } {
    const userPlayers = this.state.players.filter(p => p.clubId === clubId);
    const healthyPlayers = userPlayers.filter(p => !p.injury);
    const assignedIds = new Set<string>();

    const newStartingXV: Record<number, string> = {};
    const newBench: Record<number, string> = {};

    // 1. Pick Starting XV (Jerseys 1 through 15)
    for (let jersey = 1; jersey <= 15; jersey++) {
      const targetPos = JERSEY_TO_POSITION[jersey];
      const available = healthyPlayers.filter(p => !assignedIds.has(p.id));

      const scored = available.map(p => {
        const el = checkPositionalEligibility(p, targetPos);
        const fitMultiplier = (p.fitness || 90) / 100;
        const fatiguePenalty = (p.fatigue || 0) * 0.15;
        const moraleBonus = (p.moraleState?.confidenceModifier || 0) * 1.5;

        let positionFitScore = 0;
        if (p.primaryPosition === targetPos) {
          positionFitScore = 120;
        } else if (p.secondaryPositions?.includes(targetPos)) {
          positionFitScore = 80;
        } else if (el.eligible) {
          positionFitScore = 40;
        } else {
          positionFitScore = -50;
        }

        const score = (p.overall * 2.5) + positionFitScore + (fitMultiplier * 20) - fatiguePenalty + moraleBonus;
        return { player: p, score, isPrimaryOrSecondary: p.primaryPosition === targetPos || !!p.secondaryPositions?.includes(targetPos) };
      }).sort((a, b) => b.score - a.score);

      const chosen = scored.find(c => c.isPrimaryOrSecondary) || scored[0];
      if (chosen) {
        newStartingXV[jersey] = chosen.player.id;
        assignedIds.add(chosen.player.id);
      }
    }

    // 2. Pick Bench (Jerseys 16 through 23)
    const benchPositions: Record<number, RugbyPosition[]> = {
      16: ['LH_PROP', 'TH_PROP'],
      17: ['HOOKER'],
      18: ['TH_PROP', 'LH_PROP'],
      19: ['LOCK_4', 'LOCK_5'],
      20: ['BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER', 'NUMBER_8'],
      21: ['SCRUM_HALF'],
      22: ['FLY_HALF', 'INSIDE_CENTRE', 'OUTSIDE_CENTRE'],
      23: ['FULLBACK', 'LEFT_WING', 'RIGHT_WING', 'OUTSIDE_CENTRE']
    };

    for (let jersey = 16; jersey <= 23; jersey++) {
      const preferred = benchPositions[jersey] || [];
      const available = healthyPlayers.filter(p => !assignedIds.has(p.id));

      const scored = available.map(p => {
        const matchesPrimary = preferred.includes(p.primaryPosition);
        const matchesSecondary = (p.secondaryPositions || []).some(pos => preferred.includes(pos));
        const fitMultiplier = (p.fitness || 90) / 100;
        const fatiguePenalty = (p.fatigue || 0) * 0.15;
        const posScore = matchesPrimary ? 100 : matchesSecondary ? 60 : 10;
        const score = (p.overall * 2.0) + posScore + (fitMultiplier * 15) - fatiguePenalty;
        return { player: p, score, matches: matchesPrimary || matchesSecondary };
      }).sort((a, b) => b.score - a.score);

      const chosen = scored.find(c => c.matches) || scored[0];
      if (chosen) {
        newBench[jersey] = chosen.player.id;
        assignedIds.add(chosen.player.id);
      }
    }

    this.state.userLineup = { startingXV: newStartingXV, bench: newBench };
    this.notify();
    return { startingXV: newStartingXV, bench: newBench };
  }

  public startTargetedTraining(focus: 'ATTACK' | 'DEFENCE' | 'SET_PIECE' | 'KICKING', durationWeeks: number): { success: boolean; message: string } {
    if (this.state.activeTargetedTraining && this.state.activeTargetedTraining.weeksRemaining > 0) {
      return { success: false, message: `A targeted ${this.state.activeTargetedTraining.focus} training block is already underway (${this.state.activeTargetedTraining.weeksRemaining} wk remaining).` };
    }

    const costCoins = durationWeeks * 40;
    if (this.state.coins < costCoins) {
      return { success: false, message: `Insufficient XP/Coins. Requires ${costCoins} coins for a ${durationWeeks}-week specialized block.` };
    }

    this.state.coins -= costCoins;
    const ratingBoost = durationWeeks === 1 ? 0.8 : durationWeeks === 2 ? 1.4 : 2.0;

    this.state.activeTargetedTraining = {
      id: `tt_${Date.now()}`,
      focus,
      durationWeeks,
      weeksRemaining: durationWeeks,
      ratingBoost,
      costCoins,
      startedWeek: this.state.weekNumber
    };

    this.notify();
    return {
      success: true,
      message: `Started ${durationWeeks}-week targeted ${focus} intensive training block (+${ratingBoost} rating boost upon completion)!`
    };
  }

  public skipTargetedTrainingWithCoins(): { success: boolean; message: string } {
    const active = this.state.activeTargetedTraining;
    if (!active || active.weeksRemaining <= 0) {
      return { success: false, message: 'No active targeted training block to fast-track.' };
    }

    const skipCost = active.weeksRemaining * 35;
    if (this.state.coins < skipCost) {
      return { success: false, message: `Insufficient coins to fast-track. Requires ${skipCost} coins.` };
    }

    this.state.coins -= skipCost;
    return this.completeTargetedTraining(active);
  }

  public completeTargetedTraining(active: ActiveTargetedTraining): { success: boolean; message: string } {
    const userPlayers = this.state.players.filter(p => p.clubId === this.state.userClubId);

    userPlayers.forEach(p => {
      if (p.attributes) {
        if (active.focus === 'ATTACK') {
          p.attributes.carrying = Math.min(99, p.attributes.carrying + Math.round(active.ratingBoost * 1.5));
          p.attributes.offloading = Math.min(99, p.attributes.offloading + Math.round(active.ratingBoost * 1.2));
          p.attributes.passing = Math.min(99, p.attributes.passing + Math.round(active.ratingBoost * 1.2));
        } else if (active.focus === 'DEFENCE') {
          p.attributes.tackling = Math.min(99, p.attributes.tackling + Math.round(active.ratingBoost * 1.5));
          p.attributes.breakdown = Math.min(99, p.attributes.breakdown + Math.round(active.ratingBoost * 1.2));
        } else if (active.focus === 'SET_PIECE') {
          p.attributes.scrummaging = Math.min(99, p.attributes.scrummaging + Math.round(active.ratingBoost * 1.5));
          p.attributes.lineout = Math.min(99, p.attributes.lineout + Math.round(active.ratingBoost * 1.2));
          p.attributes.hooking = Math.min(99, p.attributes.hooking + Math.round(active.ratingBoost * 1.2));
        } else if (active.focus === 'KICKING') {
          p.attributes.kicking = Math.min(99, p.attributes.kicking + Math.round(active.ratingBoost * 1.8));
        }
      }
      p.overall = Math.min(p.potential, Math.max(50, Math.round(p.overall + (active.ratingBoost * 0.7))));
      recalculatePlayerRating(p);
      urcRegistry.updatePlayer(p);
    });

    this.state.inbox.unshift({
      id: `tt_complete_${Date.now()}`,
      date: `Week ${this.state.weekNumber}`,
      sender: 'Head of High Performance',
      subject: `🏆 TRAINING COMPLETE: Targeted ${active.focus} Module (+${active.ratingBoost} Boost)`,
      body: `High Performance Coaching Review:\n\nOur squad has successfully finalized the ${active.durationWeeks}-week intensive ${active.focus} training block!\n\n• Skill Focus: ${active.focus}\n• Direct Rating Boost: +${active.ratingBoost} average attribute progress\n• Squad Status: All active players gained tactical and technical improvements.\n\nKeep pushing the standards!`,
      category: 'BOARD',
      read: false
    });

    this.state.activeTargetedTraining = null;
    this.notify();
    return {
      success: true,
      message: `Targeted ${active.focus} block complete! Squad awarded +${active.ratingBoost} rating boosts.`
    };
  }

  public updateTactics(tactics: Partial<TacticsConfig>) {
    this.state.userTactics = { ...this.state.userTactics, ...tactics };
    this.notify();
  }

  public updateTraining(focus: CareerState['trainingSchedule']['focus'], intensity: CareerState['trainingSchedule']['intensity']) {
    this.state.trainingSchedule = { focus, intensity };
    this.notify();
  }

  public markMessageAsRead(id: string) {
    const msg = this.state.inbox.find(m => m.id === id);
    if (msg) {
      msg.read = true;
      this.notify();
    }
  }

  public markAllMessagesAsRead(): void {
    let changed = false;
    this.state.inbox.forEach(msg => {
      if (!msg.read) {
        msg.read = true;
        changed = true;
      }
    });
    if (changed) {
      this.notify();
    }
  }

  /**
   * Evaluates all Career Milestones and awards achievements, visual badges,
   * coin purses, and inbox honours.
   */
  public checkMilestones(): CareerMilestone[] {
    if (!this.state.milestones || this.state.milestones.length === 0) {
      this.state.milestones = createDefaultMilestones();
    }
    if (!this.state.statsStreak) {
      this.state.statsStreak = { unbeaten: 0, homeWins: 0, totalMatches: 0, derbyWins: 0 };
    }

    const newlyUnlocked: CareerMilestone[] = [];
    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
    const currentDate = `Round ${this.state.currentRound}, Year ${this.state.careerYear} (${this.state.seasonYear})`;

    // Check academy debut & youth pioneer from current lineup
    const userSquad = this.state.players.filter(p => p.clubId === this.state.userClubId);
    const starters = Object.values(this.state.userLineup?.startingXV || {})
      .map(id => userSquad.find(p => p.id === id))
      .filter((p): p is Player => !!p);

    const academyStarters = starters.filter(p => 
      p.id.includes('youth') || p.id.includes('acad') || p.id.startsWith('custom_acad') || p.age <= 21
    );

    this.state.milestones.forEach(m => {
      if (m.unlocked) return;

      let currentProgress = m.progress;
      let shouldUnlock = false;

      switch (m.id) {
        case 'unbeaten_10':
          currentProgress = this.state.statsStreak?.unbeaten || 0;
          if (currentProgress >= m.target) shouldUnlock = true;
          break;

        case 'academy_debut':
          if (academyStarters.length >= 1) {
            currentProgress = 1;
            shouldUnlock = true;
          }
          break;

        case 'first_trophy': {
          const urcTable = this.state.leagueTables?.URC || [];
          const isTop = urcTable[0]?.clubId === this.state.userClubId;
          const archivedTitle = (this.state.seasonArchives || []).some(a => a.championClubId === this.state.userClubId);
          if (archivedTitle || (this.state.seasonPhase === 'OFF_SEASON' && isTop)) {
            currentProgress = 1;
            shouldUnlock = true;
          }
          break;
        }

        case 'derby_conqueror':
          currentProgress = this.state.statsStreak?.derbyWins || 0;
          if (currentProgress >= m.target) shouldUnlock = true;
          break;

        case 'high_roller_50':
          if (m.progress >= m.target) shouldUnlock = true;
          break;

        case 'clean_sheet':
          if (m.progress >= m.target) shouldUnlock = true;
          break;

        case 'home_fortress':
          currentProgress = this.state.statsStreak?.homeWins || 0;
          if (currentProgress >= m.target) shouldUnlock = true;
          break;

        case 'youth_pioneer':
          currentProgress = Math.max(m.progress, academyStarters.length);
          if (academyStarters.length >= m.target) shouldUnlock = true;
          break;

        case 'financial_titan':
          currentProgress = userClub?.transferBudget || 0;
          if (currentProgress >= m.target) shouldUnlock = true;
          break;
      }

      m.progress = currentProgress;

      if (shouldUnlock) {
        m.unlocked = true;
        m.unlockedDate = currentDate;
        newlyUnlocked.push(m);

        // Award reward coins
        this.addCoins(m.rewardCoins, `Milestone Achieved: ${m.title}`);

        // Dispatch celebratory inbox alert
        this.state.inbox.unshift({
          id: `milestone_${m.id}_${Date.now()}`,
          date: currentDate,
          sender: 'Board & Trophy Honours Committee',
          subject: `🏅 MILESTONE UNLOCKED: "${m.title}"!`,
          body: `Major Career Achievement Unlocked!\n\n"${m.title}"\n${m.description}\n\n• Tier: ${m.tier}\n• Reward: +${m.rewardCoins} Rugby Coins deposited into club account.\n\nYour management legacy is permanently etched into the club's Hall of Fame!`,
          category: 'BOARD',
          read: false,
          actionRoute: {
            screen: 'dashboard',
            label: 'View Trophy Room & Badges'
          }
        });
      }
    });

    if (newlyUnlocked.length > 0) {
      this.notify();
    }

    return newlyUnlocked;
  }

  /**
   * Manually update a player's details, name, position and stats
   * Dynamically recalculates overall rating, market value and wage
   */
  public updatePlayer(updatedPlayer: Player): void {
    const idx = this.state.players.findIndex(p => p.id === updatedPlayer.id);
    if (idx === -1) return;

    // Recalculate overall rating from individual rugby attributes if not already explicitly calibrated
    const calculatedOverall = calculatePlayerOverall(updatedPlayer.primaryPosition, updatedPlayer.attributes);
    const finalOverall = updatedPlayer.overall || calculatedOverall;

    // Recalculate market value and weekly wage appropriately
    const baseFactor = Math.pow(finalOverall / 65, 3.8);
    const ageFactor = updatedPlayer.age <= 23 ? 1.35 : updatedPlayer.age <= 29 ? 1.15 : updatedPlayer.age <= 33 ? 0.85 : 0.6;
    const marketValue = Math.round(baseFactor * ageFactor * 1250000);
    const weeklyWage = Math.max(1200, Math.round((marketValue / 52) * 0.12));

    const refinedPlayer: Player = {
      ...updatedPlayer,
      overall: finalOverall,
      marketValue,
      weeklyWage
    };

    this.state.players[idx] = refinedPlayer;

    // Also update in urcRegistry so search, exhibition & audit views stay in sync
    urcRegistry.updatePlayer(refinedPlayer);

    this.notify();
  }

  /**
   * Update club details (Team Name, Short Name, Stadium, Kit Colors, Pitch Type, Weather)
   */
  public updateClubDetails(clubId: string, updates: Partial<Club>): void {
    const club = this.state.clubs.find(c => c.id === clubId);
    if (!club) return;
    Object.assign(club, updates);
    this.notify();
  }

  /**
   * Batch Edit players: apply uniform adjustments to multiple players in a single step
   */
  public batchUpdatePlayers(
    playerIds: string[],
    updates: {
      fitness?: number;
      fatigue?: number;
      potential?: number;
      potentialDelta?: number;
      morale?: number;
      form?: number;
      squadRole?: Player['squadRole'];
    }
  ): number {
    let count = 0;
    playerIds.forEach(id => {
      const p = this.state.players.find(player => player.id === id);
      if (p) {
        if (updates.fitness !== undefined) p.fitness = Math.max(1, Math.min(100, updates.fitness));
        if (updates.fatigue !== undefined) p.fatigue = Math.max(0, Math.min(100, updates.fatigue));
        if (updates.potential !== undefined) p.potential = Math.max(p.overall, Math.min(99, updates.potential));
        if (updates.potentialDelta !== undefined) p.potential = Math.max(p.overall, Math.min(99, p.potential + updates.potentialDelta));
        if (updates.morale !== undefined) p.morale = Math.max(1, Math.min(100, updates.morale));
        if (updates.form !== undefined) p.form = Math.max(1, Math.min(10, updates.form));
        if (updates.squadRole !== undefined) p.squadRole = updates.squadRole;
        if ((updates as any).recalculateRatings) {
          recalculatePlayerRating(p);
        }

        urcRegistry.updatePlayer(p);
        count++;
      }
    });

    if (count > 0) {
      this.notify();
    }
    return count;
  }

  /**
   * Recalculates player ratings for a specific club going by their current stats this season,
   * last season stats, and potential.
   */
  public recalculateClubRatings(clubId: string = this.state.userClubId) {
    const clubPlayers = this.state.players.filter(p => p.clubId === clubId);
    const result = recalculateBatchRatings(clubPlayers);
    clubPlayers.forEach(p => urcRegistry.updatePlayer(p));
    this.notify();
    return result.summary;
  }

  /**
   * Recalculates all player ratings across all clubs in the championship.
   */
  public recalculateAllPlayerRatings() {
    const result = recalculateBatchRatings(this.state.players);
    this.state.players.forEach(p => urcRegistry.updatePlayer(p));
    this.notify();
    return result.summary;
  }

  // --- Rugby Nations Standard Coin System ---

  public getCoins(): number {
    return this.state.coins || 0;
  }

  public addCoins(amount: number, reason: string = 'In-Game Reward'): void {
    if (amount <= 0) return;
    this.state.coins = (this.state.coins || 0) + amount;
    this.notify();
  }

  public spendCoins(amount: number): boolean {
    if (amount <= 0) return true;
    if ((this.state.coins || 0) < amount) return false;
    this.state.coins -= amount;
    this.notify();
    return true;
  }

  /**
   * Exchange Rugby Coins to inject Transfer Budget & Wage Budget into the user's club
   * (Modeled after Rugby Nations club cash packs)
   */
  public exchangeCoinsForCash(
    coinCost: number,
    transferCash: number,
    wageCash: number,
    packTitle: string = 'Financial Injection'
  ): { success: boolean; message: string } {
    if ((this.state.coins || 0) < coinCost) {
      return { success: false, message: `Insufficient Coins. You need ${coinCost.toLocaleString()} Coins (Current: ${this.state.coins || 0}).` };
    }

    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
    if (!userClub) {
      return { success: false, message: 'User club not found.' };
    }

    // Deduct coins and credit treasury
    this.state.coins -= coinCost;
    userClub.transferBudget += transferCash;
    userClub.wageBudget += wageCash;

    // Send confirmation to inbox
    this.state.inbox.unshift({
      id: `cash_exchange_${Date.now()}`,
      date: `Week ${this.state.weekNumber}`,
      sender: 'Board of Directors & Commercial Treasury',
      subject: `💰 ${packTitle}: £${transferCash.toLocaleString()} Deposited!`,
      body: `Transaction Approved: ${coinCost.toLocaleString()} Rugby Coins exchanged for commercial club investment.\n\n• Transfer Budget Added: +£${transferCash.toLocaleString()}\n• Wage Budget Added: +£${wageCash.toLocaleString()}/week\n• New Transfer Treasury: £${userClub.transferBudget.toLocaleString()}\n\nFunds are immediately accessible for scouting, contract extensions, and marquee signings!`,
      category: 'BOARD',
      read: false
    });

    this.notify();
    return {
      success: true,
      message: `Successfully exchanged ${coinCost.toLocaleString()} Coins for £${transferCash.toLocaleString()} Transfer Budget & £${wageCash.toLocaleString()} Wage Budget!`
    };
  }

  /**
   * Daily free login / matchday claim bonus
   */
  public claimDailyCoinReward(): { success: boolean; amount: number; message: string } {
    const amount = 250;
    this.state.coins = (this.state.coins || 0) + amount;
    this.state.lastDailyClaimTimestamp = Date.now();

    this.state.inbox.unshift({
      id: `daily_coin_${Date.now()}`,
      date: `Week ${this.state.weekNumber}`,
      sender: 'Rugby Nations Daily Patronage',
      subject: `🎁 Daily Free Reward: +${amount} Rugby Coins Claimed!`,
      body: `Thank you for managing your club today! You have claimed your daily bonus of ${amount} Rugby Coins.\n\nVisit the Club Store to top up more coins or exchange coins for cash injections!`,
      category: 'BOARD',
      read: false
    });

    this.notify();
    return { success: true, amount, message: `Claimed +${amount} Rugby Coins!` };
  }

  /**
   * Rugby Nations Booster: Instant Team Recovery
   */
  public buyInstantFitnessPack(): { success: boolean; message: string } {
    const cost = 200;
    if ((this.state.coins || 0) < cost) {
      return { success: false, message: `Insufficient Coins. You need ${cost} Coins.` };
    }

    this.state.coins -= cost;
    const userPlayers = this.state.players.filter(p => p.clubId === this.state.userClubId);
    userPlayers.forEach(p => {
      p.fitness = 100;
      p.fatigue = 0;
      p.morale = Math.max(90, p.morale || 80);
    });

    this.notify();
    return { success: true, message: `Squad recovery activated! All ${userPlayers.length} players restored to 100% match fitness & peak morale.` };
  }

  /**
   * Rugby Nations Booster: Morale & Fan Surge
   */
  public buyMoraleBoostPack(): { success: boolean; message: string } {
    const cost = 175;
    if ((this.state.coins || 0) < cost) {
      return { success: false, message: `Insufficient Coins. You need ${cost} Coins.` };
    }

    this.state.coins -= cost;
    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
    if (userClub) {
      userClub.boardConfidence = Math.min(100, userClub.boardConfidence + 15);
      userClub.fanSatisfaction = Math.min(100, (userClub.fanSatisfaction || 80) + 15);
    }

    this.notify();
    return { success: true, message: `Club PR campaign launched! Board Confidence and Fan Satisfaction boosted by +15%.` };
  }

  // Apply user match result and simulate AI matches of current round
  public applyMatchResultAndSimulateRound(userFixtureId: string, result: Fixture['result']) {
    const userFix = this.state.fixtures.find(f => f.id === userFixtureId);
    if (userFix && result) {
      userFix.played = true;
      userFix.result = result;
      this.updateLeagueTableFromResult(userFix);
      this.updatePlayerStatsFromMatch(result);

      // Process rivalry & fan satisfaction updates for user club
      const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
      const opponentClubId = userFix.homeClubId === this.state.userClubId ? userFix.awayClubId : userFix.homeClubId;
      const opponentClub = this.state.clubs.find(c => c.id === opponentClubId);

      if (userClub && opponentClub) {
        const isHome = userFix.homeClubId === userClub.id;
        const userScore = isHome ? result.homeScore : result.awayScore;
        const oppScore = isHome ? result.awayScore : result.homeScore;
        const userTries = isHome ? result.homeTries : result.awayTries;
        const scoreDiff = userScore - oppScore;
        const userWon = scoreDiff > 0;
        const isDraw = scoreDiff === 0;

        const activeRivalry = getRivalry(userClub.id, opponentClub.id);
        const isRivalry = !!activeRivalry;

        // Update Head-to-Head record for rivalry
        if (!userClub.rivalryH2H) userClub.rivalryH2H = {};
        if (!userClub.rivalryH2H[opponentClub.id]) {
          userClub.rivalryH2H[opponentClub.id] = { played: 0, won: 0, drawn: 0, lost: 0 };
        }
        const h2h = userClub.rivalryH2H[opponentClub.id];
        h2h.played++;
        if (userWon) {
          h2h.won++;
          h2h.trophyHeld = true;
          h2h.lastResult = `W ${userScore}-${oppScore}`;
        } else if (isDraw) {
          h2h.drawn++;
          h2h.lastResult = `D ${userScore}-${oppScore}`;
        } else {
          h2h.lost++;
          h2h.trophyHeld = false;
          h2h.lastResult = `L ${userScore}-${oppScore}`;
        }

        // Calculate Fan Satisfaction Impact
        const { delta: fanDelta, sentimentText } = calculateFanSatisfactionDelta({
          userWon,
          isDraw,
          isRivalry,
          scoreDiff: Math.abs(scoreDiff),
          isAway: !isHome,
          triesScored: userTries
        });

        const currentFanSat = userClub.fanSatisfaction ?? 82;
        userClub.fanSatisfaction = Math.max(10, Math.min(100, currentFanSat + fanDelta));

        // Board Confidence impact
        const boardDelta = isRivalry
          ? (userWon ? 6 : isDraw ? 1 : -5)
          : (userWon ? 3 : isDraw ? 0 : -3);
        userClub.boardConfidence = Math.max(10, Math.min(100, userClub.boardConfidence + boardDelta));

        // Team Results Morale Fluctuation across squad
        const userSquad = this.state.players.filter(p => p.clubId === userClub.id);
        const allStats = { ...result.homePlayerStats, ...result.awayPlayerStats };
        const participatedPlayerIds = new Set<string>(Object.keys(allStats));

        userSquad.forEach(p => {
          applyTeamResultMorale(p, {
            userWon,
            isDraw,
            scoreDiff: Math.abs(scoreDiff),
            isRivalry,
            participated: participatedPlayerIds.has(p.id),
            roundNumber: this.state.currentRound
          });
          recalculatePlayerRating(p);
          urcRegistry.updatePlayer(p);
        });

        // Generate Inbox Message / Media Headline for the match
        if (isRivalry && activeRivalry) {
          const trophyNotice = activeRivalry.trophyName
            ? userWon
              ? ` The coveted ${activeRivalry.trophyName} is proudly claimed for the trophy cabinet!`
              : ` Heartbreak: Relinquished the ${activeRivalry.trophyName} to ${opponentClub.shortName}.`
            : '';

          this.state.inbox.unshift({
            id: `rivalry_post_${Date.now()}`,
            date: `Week ${this.state.weekNumber}`,
            sender: userWon ? 'Official Supporters Trust' : 'Club Fan Media & Forum',
            subject: userWon
              ? `🏆 DERBY TRIUMPH: ${userClub.shortName} conquer ${opponentClub.shortName} in ${activeRivalry.name}!`
              : `💔 DERBY ANGUISH: Bitter defeat to arch-rivals ${opponentClub.shortName} in ${activeRivalry.name}`,
            body: `${sentimentText}\n\nFinal Score: ${userClub.shortName} ${userScore} - ${oppScore} ${opponentClub.shortName}.${trophyNotice}\n\nFan satisfaction is now at ${userClub.fanSatisfaction}%.`,
            category: 'MEDIA',
            read: false
          });
        }

        // Rugby Nations match coins payout
        const baseCoins = userWon ? 150 : isDraw ? 75 : 40;
        const tryCoins = (userTries || 0) * 15;
        const bonusCoins = (userTries || 0) >= 4 ? 50 : 0;
        const totalCoinsEarned = baseCoins + tryCoins + bonusCoins;
        this.state.coins = (this.state.coins || 0) + totalCoinsEarned;

        this.state.inbox.unshift({
          id: `match_coins_${Date.now()}`,
          date: `Week ${this.state.weekNumber}`,
          sender: 'Rugby Nations Rewards',
          subject: `🪙 Match Purse: +${totalCoinsEarned} Rugby Coins Awarded!`,
          body: `Match Rewards Summary:\n• Result: +${baseCoins} Coins (${userWon ? 'Victory' : isDraw ? 'Draw' : 'Match Payout'})\n• Try Bonus: +${tryCoins} Coins (${userTries} Tries)\n${bonusCoins > 0 ? `• Bonus Point (4+ Tries): +${bonusCoins} Coins\n` : ''}\nTotal: +${totalCoinsEarned} Rugby Coins.\nCurrent Balance: ${this.state.coins.toLocaleString()} Coins. Visit the Club Store to exchange Coins for in-game Transfer & Wage Budget!`,
          category: 'BOARD',
          read: false,
          actionRoute: {
            screen: 'finances',
            label: 'Visit Club Store'
          }
        });

        // Matchday Ticket Revenue: (Attendance × Ticket Price) - Operational Expenses (20%)
        if (isHome) {
          const fanModifier = 0.6 + (((userClub.fanSatisfaction ?? 80) / 100) * 0.4);
          const attendance = Math.round(userClub.stadiumCapacity * Math.min(1.0, 0.75 * fanModifier));
          const ticketPrice = 30; // standard match ticket price
          const grossTicketRevenue = attendance * ticketPrice;
          const operationalExpenses = Math.round(grossTicketRevenue * 0.20);
          const netMatchdayTicketRevenue = grossTicketRevenue - operationalExpenses;

          userClub.transferBudget += netMatchdayTicketRevenue;

          this.state.inbox.unshift({
            id: `ticket_rev_${Date.now()}`,
            date: `Week ${this.state.weekNumber}`,
            sender: 'Stadium Operations & Ticketing',
            subject: `🏟️ Matchday Gate Receipts: +£${netMatchdayTicketRevenue.toLocaleString()} Net Revenue`,
            body: `Matchday Ticketing Breakdown:\n• Official Attendance: ${attendance.toLocaleString()} (${Math.round((attendance / userClub.stadiumCapacity) * 100)}% capacity)\n• Ticket Price: £${ticketPrice}\n• Gross Gate Receipts: £${grossTicketRevenue.toLocaleString()}\n• Operational & Matchday Expenses (20%): -£${operationalExpenses.toLocaleString()}\n• Net Matchday Revenue Credited: +£${netMatchdayTicketRevenue.toLocaleString()}\n\nFunds have been deposited into the club's transfer budget.`,
            category: 'BOARD',
            read: false,
            actionRoute: {
              screen: 'finances',
              label: 'Inspect Club Finances'
            }
          });
        }

        // Update Career Streaks & Milestones
        if (!this.state.statsStreak) {
          this.state.statsStreak = { unbeaten: 0, homeWins: 0, totalMatches: 0, derbyWins: 0 };
        }
        this.state.statsStreak.totalMatches++;

        if (userWon || isDraw) {
          this.state.statsStreak.unbeaten++;
        } else {
          this.state.statsStreak.unbeaten = 0;
        }

        if (isHome) {
          if (userWon) {
            this.state.statsStreak.homeWins++;
          } else {
            this.state.statsStreak.homeWins = 0;
          }
        }

        if (isRivalry && userWon) {
          this.state.statsStreak.derbyWins++;
        }

        // Direct match milestones updates
        const highRoller = (this.state.milestones || []).find(m => m.id === 'high_roller_50');
        if (highRoller && !highRoller.unlocked) {
          highRoller.progress = Math.max(highRoller.progress, userScore);
        }

        const cleanSheet = (this.state.milestones || []).find(m => m.id === 'clean_sheet');
        const oppTries = isHome ? result.awayTries : result.homeTries;
        if (cleanSheet && !cleanSheet.unlocked && userWon && oppTries === 0) {
          cleanSheet.progress = 1;
        }

        this.checkMilestones();
      }
    }

    // Simulate all other unplayed fixtures for currentRound across all leagues
    const currentRound = this.state.currentRound;
    const remainingFixtures = this.state.fixtures.filter(f => f.round === currentRound && !f.played);

    remainingFixtures.forEach(fix => {
      this.simulateAIFixture(fix);
    });

    // Advance round and process weekly developments
    this.advanceWeek();
  }

  private simulateAIFixture(fixture: Fixture) {
    const homeClub = this.state.clubs.find(c => c.id === fixture.homeClubId);
    const awayClub = this.state.clubs.find(c => c.id === fixture.awayClubId);
    if (!homeClub || !awayClub) return;

    // Home advantage ~ +4 reputation
    const homePower = homeClub.reputation + 4;
    const awayPower = awayClub.reputation;
    const diff = homePower - awayPower;

    // Plausible rugby score generation
    let homeTries = Math.max(0, Math.round(2.6 + (diff * 0.08) + (Math.random() * 2 - 1)));
    let awayTries = Math.max(0, Math.round(2.1 - (diff * 0.08) + (Math.random() * 2 - 1)));

    let homeConvs = Math.min(homeTries, Math.round(homeTries * 0.78));
    let awayConvs = Math.min(awayTries, Math.round(awayTries * 0.75));

    let homePens = Math.max(0, Math.floor(Math.random() * 3));
    let awayPens = Math.max(0, Math.floor(Math.random() * 3));

    let homeScore = (homeTries * 5) + (homeConvs * 2) + (homePens * 3);
    let awayScore = (awayTries * 5) + (awayConvs * 2) + (awayPens * 3);

    fixture.played = true;
    fixture.result = {
      homeScore,
      awayScore,
      homeTries,
      awayTries,
      homeConversions: homeConvs,
      awayConversions: awayConvs,
      homePenalties: homePens,
      awayPenalties: awayPens,
      homeDropGoals: 0,
      awayDropGoals: 0,
      homeTryScorers: [],
      awayTryScorers: [],
      events: [],
      homePlayerStats: {},
      awayPlayerStats: {}
    };

    this.updateLeagueTableFromResult(fixture);
  }

  private updateLeagueTableFromResult(fixture: Fixture) {
    const res = fixture.result;
    if (!res) return;

    const table = this.state.leagueTables[fixture.leagueId];
    if (!table) return;

    const homeRow = table.find(r => r.clubId === fixture.homeClubId);
    const awayRow = table.find(r => r.clubId === fixture.awayClubId);
    if (!homeRow || !awayRow) return;

    homeRow.played++;
    awayRow.played++;

    homeRow.pointsFor += res.homeScore;
    homeRow.pointsAgainst += res.awayScore;
    homeRow.pointsDiff = homeRow.pointsFor - homeRow.pointsAgainst;

    awayRow.pointsFor += res.awayScore;
    awayRow.pointsAgainst += res.homeScore;
    awayRow.pointsDiff = awayRow.pointsFor - awayRow.pointsAgainst;

    // Rugby bonus points:
    // 4+ tries = 1 Try Bonus Point (TBP)
    let homeTBP = res.homeTries >= 4 ? 1 : 0;
    let awayTBP = res.awayTries >= 4 ? 1 : 0;

    homeRow.tryBonusPoints += homeTBP;
    awayRow.tryBonusPoints += awayTBP;

    if (res.homeScore > res.awayScore) {
      // Home Win (4 pts)
      homeRow.won++;
      homeRow.points += 4 + homeTBP;

      // Away Losing Bonus Point (LBP) if margin <= 7
      let awayLBP = (res.homeScore - res.awayScore) <= 7 ? 1 : 0;
      awayRow.lost++;
      awayRow.losingBonusPoints += awayLBP;
      awayRow.points += awayLBP + awayTBP;
    } else if (res.awayScore > res.homeScore) {
      // Away Win (4 pts)
      awayRow.won++;
      awayRow.points += 4 + awayTBP;

      // Home Losing Bonus Point (LBP) if margin <= 7
      let homeLBP = (res.awayScore - res.homeScore) <= 7 ? 1 : 0;
      homeRow.lost++;
      homeRow.losingBonusPoints += homeLBP;
      homeRow.points += homeLBP + homeTBP;
    } else {
      // Draw (2 pts each)
      homeRow.drawn++;
      awayRow.drawn++;
      homeRow.points += 2 + homeTBP;
      awayRow.points += 2 + awayTBP;
    }

    // Sort table by Points desc, then PointsDiff desc, then Tries
    table.sort((a, b) => b.points - a.points || b.pointsDiff - a.pointsDiff || (b.pointsFor - a.pointsFor));
  }

  private updatePlayerStatsFromMatch(result: Fixture['result']) {
    if (!result) return;
    const allStats = { ...result.homePlayerStats, ...result.awayPlayerStats };
    const participatedPlayerIds = new Set<string>(Object.keys(allStats));

    Object.keys(allStats).forEach(pid => {
      const matchStat = allStats[pid];
      const p = this.state.players.find(x => x.id === pid);
      if (p) {
        if (!p.stats) {
          p.stats = {
            matchesPlayed: 0,
            tries: 0,
            conversions: 0,
            penalties: 0,
            dropGoals: 0,
            points: 0,
            tacklesMade: 0,
            tacklesMissed: 0,
            turnoversWon: 0,
            metresCarried: 0,
            yellowCards: 0,
            redCards: 0,
            avgRating: 7.0
          };
        }
        p.stats.matchesPlayed++;
        p.stats.tries += matchStat.tries || 0;
        p.stats.conversions += matchStat.conversions || 0;
        p.stats.penalties += matchStat.penalties || 0;
        p.stats.points = (p.stats.tries * 5) + (p.stats.conversions * 2) + (p.stats.penalties * 3) + (p.stats.dropGoals * 3);
        p.stats.tacklesMade += matchStat.tacklesMade || 0;
        p.stats.tacklesMissed += matchStat.tacklesMissed || 0;
        p.stats.turnoversWon += matchStat.turnoversWon || 0;
        p.stats.metresCarried += Math.round(matchStat.metresCarried || 0);
        if (matchStat.yellowCard) p.stats.yellowCards++;
        if (matchStat.redCard) p.stats.redCards++;

        // Moving average of rating
        const currentRating = typeof matchStat.rating === 'number' ? matchStat.rating : 6.5;
        p.stats.avgRating = Number((((p.stats.avgRating || 7.0) * (p.stats.matchesPlayed - 1) + currentRating) / p.stats.matchesPlayed).toFixed(1));

        // Workload-based in-match fatigue calculation
        const staminaEngine = (p.attributes?.fitness || 75) / 100;
        const workActivity = (matchStat.tacklesMade * 0.9) + (matchStat.carries * 0.8) + (matchStat.metresCarried * 0.05);
        const fatigueGain = Math.round(18 + (workActivity * (1.2 - staminaEngine * 0.4)));

        p.fatigue = Math.min(100, p.fatigue + Math.max(14, Math.min(38, fatigueGain)));
        p.fitness = Math.max(25, p.fitness - Math.round(fatigueGain * 0.65));

        // Dynamic match performance morale fluctuation
        applyMatchPerformanceMorale(p, matchStat, this.state.currentRound);

        // Dynamically adjust player rating going by current stats this season, last season, and potential
        recalculatePlayerRating(p);
        urcRegistry.updatePlayer(p);

        // In-Match Injury Check (elevated if player was playing with high fatigue > 60)
        const fatigueMultiplier = p.fatigue > 75 ? 3.5 : p.fatigue > 60 ? 2.0 : 1.0;
        const inMatchInjuryChance = 0.022 * fatigueMultiplier;

        if (matchStat.injured || Math.random() < inMatchInjuryChance) {
          if (!p.injury) {
            const matchInjuries = [
              { name: 'Hamstring Pull', type: 'Soft Tissue', weeks: 2, severity: 'MINOR' as const },
              { name: 'Concussion (HIA Protocol)', type: 'HIA Protocol', weeks: 1, severity: 'MINOR' as const },
              { name: 'Ankle Ligament Sprain', type: 'Ligament', weeks: 3, severity: 'MODERATE' as const },
              { name: 'AC Joint Shoulder Separation', type: 'Joint Trauma', weeks: 4, severity: 'MODERATE' as const },
              { name: 'MCL Knee Sprain', type: 'Ligament', weeks: 5, severity: 'SEVERE' as const },
              { name: 'Dead Leg (Severe Contusion)', type: 'Hematoma', weeks: 1, severity: 'MINOR' as const }
            ];
            const chosenInj = matchInjuries[Math.floor(Math.random() * matchInjuries.length)];
            p.injury = {
              name: chosenInj.name,
              weeksRemaining: chosenInj.weeks,
              type: chosenInj.type,
              severity: chosenInj.severity,
              sustainedRound: this.state.currentRound,
              sustainedWeek: this.state.weekNumber
            };

            if (!p.injuryHistory) p.injuryHistory = [];
            p.injuryHistory.unshift({
              id: `inj_match_${p.id}_${Date.now()}`,
              name: chosenInj.name,
              type: chosenInj.type,
              sustainedDate: `URC Round ${this.state.currentRound} Matchday`,
              durationWeeks: chosenInj.weeks,
              severity: chosenInj.severity,
              recovered: false,
              notes: `Sustained during competitive live collision in Round ${this.state.currentRound}.`
            });

            if (p.clubId === this.state.userClubId) {
              this.state.inbox.unshift({
                id: `match_inj_${p.id}_${Date.now()}`,
                date: `Round ${this.state.currentRound}`,
                sender: 'Chief Medical Officer',
                subject: `🚨 MATCH INJURY: ${p.name} (${chosenInj.name})`,
                body: `Medical Update from the Matchday:\n\n${p.name} sustained a ${chosenInj.name} (${chosenInj.severity} severity) during the match.\n• Classification: ${chosenInj.type}\n• Estimated Absence: ${chosenInj.weeks} week${chosenInj.weeks > 1 ? 's' : ''}.\n• Availability: Sidelined from First Team selection until medically cleared.\n\nPlease adjust your starting XV and bench selections accordingly in Squad / Tactics.`,
                category: 'INJURY',
                read: false
              });
            }
          }
        }
      }
    });

    // Unselected squad reserves begin early fatigue recovery
    this.state.players
      .filter(p => p.clubId === this.state.userClubId && !participatedPlayerIds.has(p.id))
      .forEach(p => {
        p.fatigue = Math.max(0, p.fatigue - 8);
        p.fitness = Math.min(100, p.fitness + 6);
      });
  }

  public advanceWeek() {
    this.state.weekNumber++;
    this.state.currentRound = Math.min(18, this.state.currentRound + 1);

    // Progress Active Targeted Training
    if (this.state.activeTargetedTraining && this.state.activeTargetedTraining.weeksRemaining > 0) {
      this.state.activeTargetedTraining.weeksRemaining--;
      if (this.state.activeTargetedTraining.weeksRemaining <= 0) {
        this.completeTargetedTraining(this.state.activeTargetedTraining);
      }
    }

    // Auto-check for end of regular season (all round 18 fixtures completed)
    const allFixturesPlayed = this.state.fixtures.length > 0 && this.state.fixtures.every(f => f.played);
    if (allFixturesPlayed && this.state.seasonPhase === 'REGULAR_SEASON') {
      this.processEndOfSeason();
      return;
    }

    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);

    // 1. Weekly Finances for user club
    if (userClub) {
      const totalWeeklyWage = this.state.players
        .filter(p => p.clubId === userClub.id)
        .reduce((sum, p) => sum + p.weeklyWage, 0);

      const staffWages = this.state.staff.reduce((sum, s) => sum + s.weeklySalary, 0);
      const weeklySponsorship = Math.round(userClub.reputation * 1200);
      const fanMultiplier = 0.6 + (((userClub.fanSatisfaction ?? 80) / 100) * 0.4); // Higher fan satisfaction fills stadium
      const ticketRevenue = Math.round((userClub.stadiumCapacity * 0.75 * fanMultiplier) * 25 * 0.5); // avg home match share

      const netCashflow = (weeklySponsorship + ticketRevenue) - (totalWeeklyWage + staffWages);
      userClub.transferBudget = Math.max(0, userClub.transferBudget + netCashflow);
    }

    // 2. Training, Fatigue recovery, and Training Efficiency calculation
    const intensity = this.state.trainingSchedule.intensity;
    const baseFatigueRecovery = intensity === 'LOW' ? 28 : intensity === 'NORMAL' ? 18 : 8;
    const baseFitnessGain = intensity === 'LOW' ? 22 : intensity === 'NORMAL' ? 16 : 10;
    const attrGain = intensity === 'HIGH' ? 0.35 : intensity === 'NORMAL' ? 0.20 : 0.08;

    const medicalLevel = userClub?.facilities?.medical || 2;
    const trainingLevel = userClub?.facilities?.training || 2;
    const facilityBonus = 1 + (trainingLevel * 0.05); // 5% to 25% training bonus

    this.state.players.forEach(p => {
      // Calculate training efficiency based on fatigue and injury
      p.trainingEfficiency = this.calculateTrainingEfficiency(p);

      // Handle Individual Rest Assignment
      if (p.isRestedThisWeek) {
        p.fatigue = Math.max(0, p.fatigue - 40);
        p.fitness = Math.min(100, p.fitness + 30);
        p.isRestedThisWeek = false; // Reset for next week
      } else {
        // Standard training recovery based on workload
        p.fatigue = Math.max(0, p.fatigue - baseFatigueRecovery);
        p.fitness = Math.min(100, p.fitness + baseFitnessGain);
      }

      // Young players develop toward potential - strictly scaled by Training Efficiency!
      if (p.age < 26 && p.overall < p.potential && !p.injury) {
        const efficiencyMultiplier = (p.trainingEfficiency || 100) / 100;
        if (Math.random() < (attrGain * efficiencyMultiplier * facilityBonus)) {
          p.overall = Math.min(p.potential, p.overall + 1);
        }
      }

      // Rotation Status & Squad Role Morale Management
      if (p.clubId === this.state.userClubId) {
        const startingIds = new Set<string>(Object.values(this.state.userLineup?.startingXV || {}));
        const benchIds = new Set<string>(Object.values(this.state.userLineup?.bench || {}));
        const wasStarted = startingIds.has(p.id);
        const wasBenched = benchIds.has(p.id);
        const wasOmitted = !wasStarted && !wasBenched;

        applyWeeklyRotationMorale(p, {
          wasStarted,
          wasBenched,
          wasOmitted,
          isInjured: !!p.injury,
          isFatigued: (p.fatigue || 0) > 60,
          isRested: !!p.isRestedThisWeek,
          roundNumber: this.state.weekNumber
        });

        // If Key Player becomes severely discontent (<40 morale), send manager warning
        if (p.squadRole === 'Key Player' && p.morale < 40 && wasOmitted && !p.injury) {
          const alreadyNotified = this.state.inbox.some(m => m.id.startsWith(`morale_unhappy_${p.id}`));
          if (!alreadyNotified) {
            this.state.inbox.unshift({
              id: `morale_unhappy_${p.id}_${Date.now()}`,
              date: `Week ${this.state.weekNumber}`,
              sender: `${p.name} (Player Representative)`,
              subject: `⚠️ SQUAD DISSATISFACTION: ${p.name} demands more playing time`,
              body: `Coach,\n\n${p.name} is deeply frustrated with his continued omission from the starting lineup. As a designated Key Player, he expected regular first-team rugby and feels his form is stalling on the sidelines.\n\nHis morale has dropped to ${p.morale}%, which is severely impairing his in-game confidence and performance ratings.\n\nWe urge you to restore him to the Starting XV for the next round.`,
              category: 'BOARD',
              read: false
            });
          }
        }
      }

      // Dynamically recalculate player rating based on stats this season, last season, and potential
      recalculatePlayerRating(p);
      urcRegistry.updatePlayer(p);

      // Progress existing injuries
      if (p.injury) {
        // Medical facility bonus: Level 4 or 5 accelerates recovery chance
        const medicalSpeedup = (p.clubId === this.state.userClubId && medicalLevel >= 4 && Math.random() < 0.30) ? 2 : 1;
        p.injury.weeksRemaining = Math.max(0, p.injury.weeksRemaining - medicalSpeedup);

        if (p.injury.weeksRemaining <= 0) {
          // Player fully recovered
          if (p.injuryHistory) {
            const activeRecord = p.injuryHistory.find(r => !r.recovered && r.name === p.injury?.name);
            if (activeRecord) activeRecord.recovered = true;
          }

          if (p.clubId === this.state.userClubId) {
            this.state.inbox.unshift({
              id: `inj_rec_${p.id}_${Date.now()}`,
              date: `Week ${this.state.weekNumber}`,
              sender: 'Head Physio & Medical Staff',
              subject: `✅ MEDICAL CLEARANCE: ${p.name} returns to full training`,
              body: `Physiotherapy & Conditioning update:\n\n${p.name} has completed full rehabilitation following his ${p.injury.name}.\n• Status: 100% Fit & Medically Cleared\n• Availability: Returned to active selection for upcoming matchdays!\n\nWelcome back to the squad.`,
              category: 'INJURY',
              read: false
            });
          }
          p.injury = null;
        }
      }
    });

    // 3. Training Contact Injury Check
    // Risk depends on workload intensity, player fatigue, and medical facilities
    const uninjuredUserPlayers = this.state.players.filter(p => p.clubId === this.state.userClubId && !p.injury && !p.isRestedThisWeek);

    uninjuredUserPlayers.forEach(p => {
      let riskPct = intensity === 'HIGH' ? 0.04 : intensity === 'NORMAL' ? 0.015 : 0.003;
      if (p.fatigue > 75) riskPct *= 4.0; // Exhausted players risk breakdown
      else if (p.fatigue > 60) riskPct *= 2.0;

      // Medical facility mitigates risk
      if (medicalLevel >= 4) riskPct *= 0.75;

      if (Math.random() < riskPct) {
        const trainingInjuries = [
          { name: 'Hamstring Strain (Grade 1)', type: 'Soft Tissue', weeks: 2, severity: 'MINOR' as const },
          { name: 'Concussion (HIA Protocol)', type: 'HIA Protocol', weeks: 1, severity: 'MINOR' as const },
          { name: 'AC Joint Shoulder Contusion', type: 'Joint Sprain', weeks: 3, severity: 'MODERATE' as const },
          { name: 'Ankle Ligament Twisting', type: 'Ligament', weeks: 3, severity: 'MODERATE' as const },
          { name: 'Groin / Adductor Tear', type: 'Soft Tissue', weeks: 4, severity: 'MODERATE' as const }
        ];
        const chosenInj = trainingInjuries[Math.floor(Math.random() * trainingInjuries.length)];
        p.injury = {
          name: chosenInj.name,
          weeksRemaining: chosenInj.weeks,
          type: chosenInj.type,
          severity: chosenInj.severity,
          sustainedRound: this.state.currentRound,
          sustainedWeek: this.state.weekNumber
        };

        if (!p.injuryHistory) p.injuryHistory = [];
        p.injuryHistory.unshift({
          id: `inj_train_${p.id}_${Date.now()}`,
          name: chosenInj.name,
          type: chosenInj.type,
          sustainedDate: `Week ${this.state.weekNumber} Training Session`,
          durationWeeks: chosenInj.weeks,
          severity: chosenInj.severity,
          recovered: false,
          notes: `Sustained in high-intensity contact drills while fatigue was at ${p.fatigue}%.`
        });

        this.state.inbox.unshift({
          id: `inj_${p.id}_${Date.now()}`,
          date: `Week ${this.state.weekNumber}`,
          sender: 'Medical Department',
          subject: `⚠️ TRAINING INJURY: ${p.name} (${chosenInj.name})`,
          body: `Medical Incident Report:\n\n${p.name} sustained a ${chosenInj.name} during team contact training.\n• Severity: ${chosenInj.severity} (${chosenInj.type})\n• Player Fatigue at incident: ${p.fatigue}%\n• Estimated Absence: ${chosenInj.weeks} week${chosenInj.weeks > 1 ? 's' : ''}\n• Training Efficiency: Reduced to 0% during rehabilitation.\n\nHe has been placed on individual physiotherapy protocol.`,
          category: 'INJURY',
          read: false
        });
      }
    });

    // 4. Scouting updates
    this.state.scoutingAssignments.forEach(scout => {
      scout.weeksRemaining--;
      if (scout.weeksRemaining <= 0) {
        // Discovered targets
        const candidates = this.state.players
          .filter(p => p.clubId !== this.state.userClubId && p.overall >= 80)
          .slice(0, 3);
        scout.results = candidates.map(c => c.id);
        scout.weeksRemaining = 4; // Reset cycle

        this.state.inbox.unshift({
          id: `scout_rpt_${Date.now()}`,
          date: `Week ${this.state.weekNumber}`,
          sender: scout.scoutName,
          subject: `Scouting Report: ${scout.region} Prospects`,
          body: `Our scouting mission in ${scout.region} has uncovered ${candidates.length} high-calibre transfer targets matching our squad profile. Check the Scouting tab for full attribute analysis.`,
          category: 'SCOUTING',
          read: false
        });
      }
    });

    // 5. Board review message
    if (this.state.weekNumber % 4 === 0 && userClub) {
      this.state.inbox.unshift({
        id: `board_rev_${this.state.weekNumber}`,
        date: `Week ${this.state.weekNumber}`,
        sender: 'Board of Directors',
        subject: 'Monthly Club Performance Review',
        body: `The board has reviewed our recent performances and financial metrics. Board confidence currently sits at ${userClub.boardConfidence}%. Keep maintaining standards in upcoming fixtures.`,
        category: 'BOARD',
        read: false
      });
    }

    this.notify();
  }

  // Player Transfer Negotiations
  public signPlayer(playerId: string, transferFee: number, wage: number, contractYears: number, role: Player['squadRole']): { success: boolean; message: string } {
    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
    const player = this.state.players.find(p => p.id === playerId);

    if (!userClub || !player) return { success: false, message: 'Invalid club or player' };

    const isFreeAgent = player.clubId === 'free_agents';

    // Transfer window check: if closed and not a free agent, reject
    if (!this.state.isTransferWindowOpen && !isFreeAgent) {
      return {
        success: false,
        message: 'Transfer market is CLOSED. During the regular season, only unattached Free Agents may be signed. Full club transfers re-open in Pre-Season.'
      };
    }

    const actualFee = isFreeAgent ? 0 : transferFee;

    if (userClub.transferBudget < actualFee) {
      return { success: false, message: 'Insufficient transfer funds' };
    }

    const sellingClub = !isFreeAgent ? this.state.clubs.find(c => c.id === player.clubId) : null;

    // Complete transaction
    if (actualFee > 0) {
      userClub.transferBudget -= actualFee;
      if (sellingClub) {
        sellingClub.transferBudget += actualFee;
      }
    }

    player.clubId = userClub.id;
    player.weeklyWage = wage;
    player.contractYearsLeft = contractYears;
    player.squadRole = role;
    player.morale = 95;

    this.state.inbox.unshift({
      id: `sign_${player.id}_${Date.now()}`,
      date: `Week ${this.state.weekNumber}`,
      sender: 'Chief Executive',
      subject: `Official Confirmation: ${player.name} Signs for ${userClub.name}!`,
      body: `We are delighted to officially welcome ${player.name} (${getPositionShort(player.primaryPosition)}, Age ${player.age}) to ${userClub.name}.\n\n` +
        (isFreeAgent
          ? `• Free Agent signing (zero transfer fee)\n• Contract: ${contractYears} Years @ £${wage.toLocaleString()}/wk\n• Designated Role: ${role}`
          : `• Transfer fee of £${actualFee.toLocaleString()} processed\n• Contract: ${contractYears} Years @ £${wage.toLocaleString()}/wk\n• Designated Role: ${role}`),
      category: 'TRANSFER',
      read: false
    });

    this.notify();
    return {
      success: true,
      message: isFreeAgent
        ? `Signed free agent ${player.name} on a ${contractYears}-year deal!`
        : `Successfully signed ${player.name} for £${actualFee.toLocaleString()}!`
    };
  }

  public sellPlayer(playerId: string, fee: number): { success: boolean; message: string } {
    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
    const player = this.state.players.find(p => p.id === playerId);

    if (!userClub || !player) return { success: false, message: 'Player not found' };

    // Choose random rival club
    const rivalClubs = this.state.clubs.filter(c => c.id !== userClub.id);
    const buyer = rivalClubs[Math.floor(Math.random() * rivalClubs.length)];

    userClub.transferBudget += fee;
    player.clubId = buyer.id;

    // Remove from user lineup if selected
    Object.keys(this.state.userLineup.startingXV).forEach(k => {
      if (this.state.userLineup.startingXV[Number(k)] === player.id) {
        delete this.state.userLineup.startingXV[Number(k)];
      }
    });

    this.state.inbox.unshift({
      id: `sale_${player.id}_${Date.now()}`,
      date: `Week ${this.state.weekNumber}`,
      sender: 'Finance Director',
      subject: `${player.name} departs for £${fee.toLocaleString()}`,
      body: `Transfer agreement finalized. ${player.name} has completed his move to ${buyer.name}. The funds have been deposited into our club budget.`,
      category: 'TRANSFER',
      read: false
    });

    this.notify();
    return { success: true, message: `Sold ${player.name} to ${buyer.name} for £${fee.toLocaleString()}` };
  }

  /**
   * Promote an academy player to the Senior First Team
   */
  public promoteYouthPlayer(playerId: string): { success: boolean; message: string } {
    const prospectIdx = this.state.youthProspects.findIndex(p => p.id === playerId);
    if (prospectIdx === -1) {
      return { success: false, message: 'Prospect not found in academy' };
    }

    const p = this.state.youthProspects.splice(prospectIdx, 1)[0];
    ensurePlayerHasMinimumPositions(p);
    p.squadRole = 'Squad Rotation';
    p.contractYearsLeft = Math.max(2, p.contractYearsLeft);
    this.state.players.push(p);

    this.state.inbox.unshift({
      id: `prospect_pro_${p.id}_${Date.now()}`,
      date: `Week ${this.state.weekNumber}`,
      sender: 'Academy Director',
      subject: `Academy graduate ${p.name} promoted to Senior First Team!`,
      body: `Exciting young talent ${p.name} (Age ${p.age}, OVR ${p.overall}, POT ${p.potential}) has signed his first professional senior contract. He is now registered for senior matchday selection.`,
      category: 'BOARD',
      read: false,
      actionRoute: {
        screen: 'squad',
        targetEntityId: p.id,
        label: 'Select in Senior Squad'
      }
    });

    this.notify();
    return { success: true, message: `Promoted ${p.name} to the senior squad!` };
  }

  /**
   * Demote an existing senior squad player (aged <= 23) into the Academy to focus on development
   */
  public demoteToAcademy(playerId: string): { success: boolean; message: string } {
    const pIdx = this.state.players.findIndex(p => p.id === playerId);
    if (pIdx === -1) {
      return { success: false, message: 'Player not found in senior squad' };
    }

    const player = this.state.players[pIdx];

    // Academy Eligibility Rule: Hard age limit of 23 years old (Age <= 23)
    if (player.age > 23) {
      return {
        success: false,
        message: `Ineligible: ${player.name} is ${player.age} years old. The Academy strictly enforces a maximum age limit of 23 (U23).`
      };
    }

    // Remove from senior lineup if selected
    Object.keys(this.state.userLineup.startingXV).forEach(k => {
      if (this.state.userLineup.startingXV[Number(k)] === player.id) {
        delete this.state.userLineup.startingXV[Number(k)];
      }
    });
    Object.keys(this.state.userLineup.bench).forEach(k => {
      if (this.state.userLineup.bench[Number(k)] === player.id) {
        delete this.state.userLineup.bench[Number(k)];
      }
    });

    // Remove from senior squad and add to academy
    this.state.players.splice(pIdx, 1);
    player.squadRole = 'Youth Prospect';
    this.state.youthProspects.push(player);

    this.state.inbox.unshift({
      id: `demote_${player.id}_${Date.now()}`,
      date: `Week ${this.state.weekNumber}`,
      sender: 'Academy Director',
      subject: `${player.name} assigned to Youth Academy development`,
      body: `${player.name} (Age ${player.age}) has transitioned to the Youth Academy roster to focus on intensive technical conditioning and accelerated growth.`,
      category: 'BOARD',
      read: false
    });

    this.notify();
    return { success: true, message: `${player.name} assigned to the Youth Academy.` };
  }

  /**
   * Manually add a custom created academy player (Name, Age 16-21, Position, Base Stats, Potential)
   */
  public addAcademyPlayer(data: {
    name: string;
    age: number;
    primaryPosition: RugbyPosition;
    potential: number;
    baseOverall?: number;
  }): Player {
    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
    const country = userClub?.country || 'South Africa';
    const baseVal = data.baseOverall || Math.max(58, data.potential - 14);

    const isForward = FORWARD_POSITIONS.includes(data.primaryPosition);
    const isFront = isFrontRow(data.primaryPosition);

    const attrs: PlayerAttributes = {
      scrummaging: isFront ? baseVal + 5 : isForward ? baseVal : baseVal - 15,
      hooking: data.primaryPosition === 'HOOKER' ? baseVal + 6 : 40,
      lineout: data.primaryPosition === 'LOCK_4' || data.primaryPosition === 'LOCK_5' ? baseVal + 6 : isForward ? baseVal : 35,
      breakdown: isForward ? baseVal + 3 : baseVal - 4,
      tackling: isForward ? baseVal + 4 : baseVal - 2,
      carrying: baseVal + 2,
      offloading: baseVal - 2,
      passing: !isForward ? baseVal + 4 : baseVal - 5,
      kicking: data.primaryPosition === 'FLY_HALF' || data.primaryPosition === 'FULLBACK' ? baseVal + 6 : baseVal - 15,
      goalKicking: data.primaryPosition === 'FLY_HALF' ? baseVal + 8 : 45,
      speed: !isForward ? baseVal + 6 : baseVal - 3,
      strength: isForward ? baseVal + 5 : baseVal - 2,
      fitness: 85,
      tacticalAwareness: baseVal - 4,
      workRate: baseVal + 4,
      consistency: baseVal - 2
    };

    const overall = calculatePlayerOverall(data.primaryPosition, attrs);
    const newProspect: Player = {
      id: `custom_acad_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: data.name.trim() || 'Young Prospect',
      nationality: country,
      age: Math.min(23, Math.max(16, data.age)),
      clubId: this.state.userClubId,
      primaryPosition: data.primaryPosition,
      secondaryPositions: getNaturalSecondaryPositions(data.primaryPosition),
      heightCm: isForward ? 192 : 182,
      weightKg: isForward ? 106 : 88,
      attributes: attrs,
      potential: Math.min(99, Math.max(overall, data.potential)),
      overall,
      marketValue: 80000 + (overall * 3500),
      weeklyWage: 650,
      contractYearsLeft: 3,
      squadRole: 'Youth Prospect',
      fitness: 100,
      fatigue: 0,
      morale: 92,
      form: 7,
      injury: null,
      stats: {
        matchesPlayed: 0,
        tries: 0,
        conversions: 0,
        penalties: 0,
        dropGoals: 0,
        points: 0,
        tacklesMade: 0,
        tacklesMissed: 0,
        turnoversWon: 0,
        metresCarried: 0,
        yellowCards: 0,
        redCards: 0,
        avgRating: 7.0
      }
    };

    this.state.youthProspects.push(newProspect);

    this.state.inbox.unshift({
      id: `add_acad_${newProspect.id}`,
      date: `Week ${this.state.weekNumber}`,
      sender: 'Academy Director',
      subject: `New Prospect Inducted: ${newProspect.name}`,
      body: `Custom academy recruit ${newProspect.name} (${getPositionShort(newProspect.primaryPosition)}, Age ${newProspect.age}) has joined the youth development cohort. Rated OVR ${newProspect.overall} with a projected ceiling of POT ${newProspect.potential}.`,
      category: 'BOARD',
      read: false
    });

    this.notify();
    return newProspect;
  }

  /**
   * Release an academy player
   */
  public releaseAcademyPlayer(playerId: string): void {
    const idx = this.state.youthProspects.findIndex(p => p.id === playerId);
    if (idx !== -1) {
      const removed = this.state.youthProspects.splice(idx, 1)[0];
      this.notify();
    }
  }

  /**
   * Auto-Scouted / AI-Generated: Generate 3-5 realistic youth regens/prospects into Academy
   */
  public generateYouthIntake(count: number = 4): Player[] {
    const intake = this.generateYouthBatch(this.state.userClubId, count);
    this.state.youthProspects = [...this.state.youthProspects, ...intake];

    this.state.inbox.unshift({
      id: `intake_${Date.now()}`,
      date: `Week ${this.state.weekNumber}`,
      sender: 'Head of Youth Recruitment',
      subject: `🎓 New Academy Scouting Intake: ${intake.length} Prospects Signed!`,
      body: `Our regional scouts have enrolled ${intake.length} promising teenagers into the Academy:\n` +
        intake.map(p => `• ${p.name} (${getPositionShort(p.primaryPosition)}, Age ${p.age}, OVR ${p.overall}, POT ${p.potential})`).join('\n') +
        `\n\nMonitor their growth and prepare high-ceiling prospects for senior promotion.`,
      category: 'SCOUTING',
      read: false,
      actionRoute: {
        screen: 'academy',
        label: 'View Youth Academy'
      }
    });

    this.notify();
    return intake;
  }

  /**
   * Background Development Engine (Simulated Growth):
   * Runs the official progression algorithm:
   * - If Current Rating < Potential Rating:
   *   - Baseline growth: +1 to +2 OVR points depending on Potential ceiling & Academy facility tier
   *   - High-potential prodigies (Gap >= 10 points): up to +3 OVR
   *   - Age 22-23 growth slows to +1 max
   * - Hard age limit 23: players turning 24 cannot develop further in academy and must be promoted/released.
   * - Re-calculate individual key attributes proportionally according to player's position.
   */
  public simulateYouthGrowth(): {
    developedCount: number;
    reports: { player: Player; ovrGain: number; oldOvr: number; newOvr: number; keyBoosts: string }[];
  } {
    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
    const academyTier = userClub?.facilities.academy || 3;
    const reports: { player: Player; ovrGain: number; oldOvr: number; newOvr: number; keyBoosts: string }[] = [];

    this.state.youthProspects.forEach(p => {
      // Hard age limit: players >= 24 must be promoted or released
      if (p.age >= 24) return;

      if (p.overall < p.potential) {
        const gap = p.potential - p.overall;
        let ovrGain = 1;

        // High potential prodigies (Gap >= 10 points) can receive up to +3 OVR
        if (gap >= 10 && p.age <= 20) {
          ovrGain = Math.min(3, 1 + (academyTier >= 4 ? 2 : 1));
        } else if (gap >= 6 && p.age <= 21) {
          ovrGain = Math.min(2, 1 + (academyTier >= 3 ? 1 : 0));
        } else if (p.age >= 22) {
          // Age 22-23 growth slows to +1 max
          ovrGain = 1;
        }

        // Cap at potential
        ovrGain = Math.min(ovrGain, p.potential - p.overall);

        if (ovrGain > 0) {
          const oldOvr = p.overall;
          p.overall += ovrGain;

          // Proportionally distribute attribute gains based on Rugby Position
          const boosts: string[] = [];
          const pos = p.primaryPosition;

          if (pos === 'LH_PROP' || pos === 'TH_PROP') {
            p.attributes.scrummaging = Math.min(99, p.attributes.scrummaging + ovrGain + 1);
            p.attributes.strength = Math.min(99, p.attributes.strength + ovrGain + 1);
            p.attributes.tackling = Math.min(99, p.attributes.tackling + ovrGain);
            p.attributes.workRate = Math.min(99, p.attributes.workRate + ovrGain);
            boosts.push('Scrummaging +2', 'Strength +2', 'Tackling +1');
          } else if (pos === 'HOOKER') {
            p.attributes.hooking = Math.min(99, p.attributes.hooking + ovrGain + 1);
            p.attributes.scrummaging = Math.min(99, p.attributes.scrummaging + ovrGain);
            p.attributes.breakdown = Math.min(99, p.attributes.breakdown + ovrGain + 1);
            boosts.push('Hooking +2', 'Breakdown +2', 'Scrummaging +1');
          } else if (pos === 'LOCK_4' || pos === 'LOCK_5') {
            p.attributes.lineout = Math.min(99, p.attributes.lineout + ovrGain + 1);
            p.attributes.strength = Math.min(99, p.attributes.strength + ovrGain + 1);
            p.attributes.tackling = Math.min(99, p.attributes.tackling + ovrGain);
            boosts.push('Lineout +2', 'Strength +2', 'Tackling +1');
          } else if (pos === 'BLINDSIDE_FLANKER' || pos === 'OPENSIDE_FLANKER' || pos === 'NUMBER_8') {
            p.attributes.breakdown = Math.min(99, p.attributes.breakdown + ovrGain + 1);
            p.attributes.tackling = Math.min(99, p.attributes.tackling + ovrGain + 1);
            p.attributes.carrying = Math.min(99, p.attributes.carrying + ovrGain);
            boosts.push('Breakdown & Jackal +2', 'Tackling +2', 'Carrying +1');
          } else if (pos === 'SCRUM_HALF') {
            p.attributes.passing = Math.min(99, p.attributes.passing + ovrGain + 1);
            p.attributes.speed = Math.min(99, p.attributes.speed + ovrGain + 1);
            p.attributes.tacticalAwareness = Math.min(99, p.attributes.tacticalAwareness + ovrGain);
            boosts.push('Bullet Passing +2', 'Speed +2', 'Tactical IQ +1');
          } else if (pos === 'FLY_HALF') {
            p.attributes.kicking = Math.min(99, p.attributes.kicking + ovrGain + 1);
            p.attributes.goalKicking = Math.min(99, p.attributes.goalKicking + ovrGain + 1);
            p.attributes.passing = Math.min(99, p.attributes.passing + ovrGain);
            p.attributes.tacticalAwareness = Math.min(99, p.attributes.tacticalAwareness + ovrGain);
            boosts.push('Tactical Kicking +2', 'Goal Kicking +2', 'Vision +1');
          } else if (pos === 'INSIDE_CENTRE' || pos === 'OUTSIDE_CENTRE') {
            p.attributes.tackling = Math.min(99, p.attributes.tackling + ovrGain + 1);
            p.attributes.carrying = Math.min(99, p.attributes.carrying + ovrGain + 1);
            p.attributes.offloading = Math.min(99, p.attributes.offloading + ovrGain);
            boosts.push('Midfield Defence +2', 'Hard Carrying +2', 'Offloading +1');
          } else {
            // Wings & Fullback
            p.attributes.speed = Math.min(99, p.attributes.speed + ovrGain + 1);
            p.attributes.carrying = Math.min(99, p.attributes.carrying + ovrGain);
            p.attributes.kicking = Math.min(99, p.attributes.kicking + ovrGain);
            boosts.push('Pace & Sprint +2', 'Finishing +1', 'High Ball +1');
          }

          p.marketValue = Math.round(p.marketValue * (1 + (ovrGain * 0.12)));
          reports.push({
            player: p,
            ovrGain,
            oldOvr,
            newOvr: p.overall,
            keyBoosts: boosts.join(', ')
          });
        }
      }
    });

    if (reports.length > 0) {
      this.state.inbox.unshift({
        id: `acad_growth_${Date.now()}`,
        date: `Week ${this.state.weekNumber}`,
        sender: 'Academy Performance Director',
        subject: `📈 Youth Academy Growth Review: ${reports.length} Prospects Improved!`,
        body: `Our off-screen academy match development and technical training cycles yielded positive progression:\n` +
          reports.map(r => `• ${r.player.name} (${getPositionShort(r.player.primaryPosition)}): +${r.ovrGain} OVR (${r.oldOvr} ➔ ${r.newOvr}) [${r.keyBoosts}]`).join('\n') +
          `\n\nAcademy Facility Tier: ${academyTier}/5. High-performing prospects are nearing senior readiness!`,
        category: 'BOARD',
        read: false
      });
      this.notify();
    }

    return { developedCount: reports.length, reports };
  }

  public upgradeFacility(facilityKey: keyof Club['facilities']): { success: boolean; message: string } {
    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
    if (!userClub) return { success: false, message: 'Club not found' };

    const currentLevel = userClub.facilities[facilityKey];
    if (currentLevel >= 5) {
      return { success: false, message: 'Facility is already at world-class maximum tier (5/5).' };
    }

    const upgradeCost = currentLevel * 450000;
    if (userClub.transferBudget < upgradeCost) {
      return { success: false, message: `Insufficient funds. Upgrade requires £${upgradeCost.toLocaleString()}.` };
    }

    userClub.transferBudget -= upgradeCost;
    userClub.facilities[facilityKey] += 1;

    this.state.inbox.unshift({
      id: `fac_up_${Date.now()}`,
      date: `Week ${this.state.weekNumber}`,
      sender: 'Director of Infrastructure',
      subject: `${facilityKey.toUpperCase()} upgraded to Tier ${userClub.facilities[facilityKey]}!`,
      body: `Construction and upgrades completed for £${upgradeCost.toLocaleString()}. This state-of-the-art facility will deliver measurable performance boosts.`,
      category: 'BOARD',
      read: false
    });

    this.notify();
    return { success: true, message: `Upgraded ${facilityKey} to Level ${userClub.facilities[facilityKey]}!` };
  }

  /**
   * Contract Renewal System:
   * Negotiates salary & multi-year contract duration (1-5 years) for an existing player.
   * Prevents player from hitting Free Agency upon contract expiry.
   */
  public renewPlayerContract(
    playerId: string,
    weeklyWage: number,
    years: number,
    role: Player['squadRole']
  ): { success: boolean; message: string; accepted: boolean } {
    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
    const player = this.state.players.find(p => p.id === playerId);

    if (!userClub || !player) return { success: false, message: 'Player not found', accepted: false };

    // Minimum acceptable wage formula based on player overall and role
    const expectedWage = Math.round((player.marketValue / 100) * 1.45);
    const minAcceptableWage = Math.round(expectedWage * 0.82);

    if (weeklyWage < minAcceptableWage) {
      return {
        success: false,
        accepted: false,
        message: `Renewal Rejected: ${player.name}'s representative turned down £${weeklyWage.toLocaleString()}/wk. Demands at least £${minAcceptableWage.toLocaleString()}/wk for a ${years}-year extension.`
      };
    }

    player.weeklyWage = weeklyWage;
    player.contractYearsLeft = years;
    player.squadRole = role;
    player.morale = Math.min(100, player.morale + 15);

    this.state.inbox.unshift({
      id: `renew_${player.id}_${Date.now()}`,
      date: `Week ${this.state.weekNumber}`,
      sender: `${player.name} (Player Representative)`,
      subject: `✍️ CONTRACT RENEWAL: ${player.name} signs ${years}-year extension!`,
      body: `Renewal Agreement Finalized:\n\n${player.name} has signed a ${years}-year contract extension at ${userClub.name} earning £${weeklyWage.toLocaleString()}/week.\n\n• Designated Role: ${role}\n• Contract Expiry: Season ${this.state.seasonYear + years}\n• Morale: 100% (Ecstatic to commit future to the club).`,
      category: 'TRANSFER',
      read: false
    });

    this.notify();
    return {
      success: true,
      accepted: true,
      message: `Renewal Accepted! ${player.name} has signed a ${years}-year extension at £${weeklyWage.toLocaleString()}/wk.`
    };
  }

  /**
   * Probability-based Retirement System for players aged 35+:
   * Checks player age at the end of each season. Players aged 35+ undergo a probability check
   * based on age, injury history, and stamina. Retiring players are removed from club rosters,
   * opening up their salary budget space and freeing wage commitments.
   */
  public evaluateRetirements(): OffSeasonSummaryData['retiredPlayers'] {
    const retiredList: OffSeasonSummaryData['retiredPlayers'] = [];
    const remainingPlayers: Player[] = [];

    for (const player of this.state.players) {
      if (player.age >= 35) {
        // Base probability curve
        let retireProb = 0.25; // age 35
        if (player.age === 36) retireProb = 0.45;
        else if (player.age === 37) retireProb = 0.70;
        else if (player.age === 38) retireProb = 0.85;
        else if (player.age >= 39) retireProb = 0.95;
        if (player.age >= 41) retireProb = 1.0;

        // Conditioning & injury modifiers
        if (player.injury) retireProb += 0.15;
        if ((player.injuryHistory?.length || 0) >= 3) retireProb += 0.10;
        if (player.fitness < 75) retireProb += 0.10;

        const roll = Math.random();
        if (roll < retireProb) {
          // Player Hangs Up Boots!
          const club = this.state.clubs.find(c => c.id === player.clubId);
          const clubName = club?.name || (player.clubId === 'free_agents' ? 'Free Agent' : 'Club Legend');
          const freedWage = player.weeklyWage * 52; // Annual salary freed
          const wasUserPlayer = player.clubId === this.state.userClubId;

          retiredList.push({
            id: player.id,
            name: player.name,
            age: player.age,
            clubName,
            position: player.primaryPosition,
            freedWage,
            wasUserPlayer
          });

          // If in user lineup, remove from startingXV and bench
          if (wasUserPlayer) {
            Object.keys(this.state.userLineup.startingXV).forEach(k => {
              if (this.state.userLineup.startingXV[Number(k)] === player.id) {
                delete this.state.userLineup.startingXV[Number(k)];
              }
            });
            Object.keys(this.state.userLineup.bench).forEach(k => {
              if (this.state.userLineup.bench[Number(k)] === player.id) {
                delete this.state.userLineup.bench[Number(k)];
              }
            });

            this.state.inbox.unshift({
              id: `retire_${player.id}_${Date.now()}`,
              date: `Off-Season Year ${this.state.seasonYear}`,
              sender: 'Board & Supporters Club',
              subject: `🎖️ RETIREMENT: ${player.name} announces rugby retirement at Age ${player.age}`,
              body: `Farewell to a stalwart:\n\n${player.name} (${getPositionShort(player.primaryPosition)}, Age ${player.age}) has officially announced his retirement from professional rugby.\n\nHis departure vacates £${player.weeklyWage.toLocaleString()}/wk (£${(player.weeklyWage * 52).toLocaleString()}/yr) in club wage bill space.\n\nWe thank him for his exemplary service, leadership, and sacrifice on the pitch.`,
              category: 'BOARD',
              read: false
            });
          }

          // Do not add to remainingPlayers -> removed from active club rosters!
          continue;
        }
      }

      remainingPlayers.push(player);
    }

    this.state.players = remainingPlayers;
    return retiredList;
  }

  /**
   * Contract Expiries & Free Agency Transition:
   * Decrements contract lengths. If a player reaches 0 years left without renewal,
   * automatically moves them to the Free Agent pool and triggers an inbox alert.
   */
  public evaluateContractExpiries(): OffSeasonSummaryData['expiredToFreeAgents'] {
    const expiredList: OffSeasonSummaryData['expiredToFreeAgents'] = [];

    for (const player of this.state.players) {
      if (player.clubId === 'free_agents') continue;

      // Decrement contract duration
      player.contractYearsLeft = Math.max(0, player.contractYearsLeft - 1);

      if (player.contractYearsLeft === 0) {
        // Contract has expired without renewal! Moves to Free Agent pool
        const wasUserPlayer = player.clubId === this.state.userClubId;
        player.clubId = 'free_agents';

        expiredList.push({
          id: player.id,
          name: player.name,
          age: player.age,
          position: player.primaryPosition,
          overall: player.overall,
          wasUserPlayer
        });

        if (wasUserPlayer) {
          // Remove from lineup
          Object.keys(this.state.userLineup.startingXV).forEach(k => {
            if (this.state.userLineup.startingXV[Number(k)] === player.id) {
              delete this.state.userLineup.startingXV[Number(k)];
            }
          });
          Object.keys(this.state.userLineup.bench).forEach(k => {
            if (this.state.userLineup.bench[Number(k)] === player.id) {
              delete this.state.userLineup.bench[Number(k)];
            }
          });

          this.state.inbox.unshift({
            id: `contract_exp_${player.id}_${Date.now()}`,
            date: `Off-Season Year ${this.state.seasonYear}`,
            sender: 'Director of Rugby',
            subject: `⚠️ CONTRACT EXPIRED: ${player.name} is now a Free Agent!`,
            body: `Contract Update Notice:\n\n${player.name} (${getPositionShort(player.primaryPosition)}, OVR ${player.overall}) has reached the expiration of his contract without an extension being finalized.\n\nHe has officially entered the Free Agent market. If you still wish to retain him, you can negotiate a new contract with him as an unattached free agent without paying any transfer fee.`,
            category: 'TRANSFER',
            read: false
          });
        }
      }
    }

    return expiredList;
  }

  /**
   * Calculates a player's annual Development Score (0 to 100) by comparing their
   * actual seasonal statistics against their projected potential and current overall.
   *
   * Evaluates:
   * 1. Match Involvement & Exposure (0-30 pts): Competitive reps are essential; lack of game time halts youth growth.
   * 2. Performance Quality vs Expected Tier (0-35 pts): Standout average match ratings relative to current tier.
   * 3. Role-Specific Contributions (0-20 pts): Tries, meters, turnovers, tackles, and discipline.
   * 4. Work Ethic & Professionalism (0-15 pts): Driven by workRate and consistency attributes.
   *
   * Comparing actual stats against potential allows for unexpected breakthroughs (surging past projected ceiling)
   * or stagnations in growth (lack of playing time or poor ratings stunting progress and lowering potential).
   */
  public calculateDevelopmentScore(player: Player): {
    score: number;
    verdict: 'BREAKTHROUGH' | 'RAPID_GROWTH' | 'STEADY' | 'STAGNATION' | 'DECLINE';
    factors: {
      matchExperience: number;
      formRating: number;
      keyContributions: number;
      workEthic: number;
    };
    explanation: string;
    stagnationReason?: string;
  } {
    const stats = player.stats || {
      matchesPlayed: 0,
      tries: 0,
      conversions: 0,
      penalties: 0,
      points: 0,
      tacklesMade: 0,
      tacklesMissed: 0,
      turnoversWon: 0,
      metresCarried: 0,
      yellowCards: 0,
      redCards: 0,
      avgRating: 7.0
    };

    // 1. Match Experience & Playing Time Factor (0-30 pts)
    let matchExp = 0;
    if (stats.matchesPlayed >= 14) matchExp = 30;
    else if (stats.matchesPlayed >= 10) matchExp = 26;
    else if (stats.matchesPlayed >= 6) matchExp = 20;
    else if (stats.matchesPlayed >= 3) matchExp = 12;
    else if (stats.matchesPlayed >= 1) matchExp = 6;
    else matchExp = 0; // Bench warmer or zero competitive minutes

    // 2. Form Rating vs Expected Potential Tier (0-35 pts)
    let formScore = 0;
    const avgRating = stats.avgRating || 7.0;
    if (stats.matchesPlayed > 0) {
      if (avgRating >= 8.2) formScore = 35;
      else if (avgRating >= 7.8) formScore = 31;
      else if (avgRating >= 7.4) formScore = 26;
      else if (avgRating >= 7.0) formScore = 21;
      else if (avgRating >= 6.5) formScore = 14;
      else if (avgRating >= 6.0) formScore = 8;
      else formScore = 3;

      // Tier expectation comparison:
      // A lower overall player who plays at an elite rating is punching way above their weight!
      const expectedRatingForTier = 6.2 + ((player.overall - 50) / 50) * 1.6;
      const ratingDelta = avgRating - expectedRatingForTier;
      if (ratingDelta > 0.35) {
        formScore = Math.min(35, formScore + 4);
      } else if (ratingDelta < -0.35) {
        formScore = Math.max(2, formScore - 4);
      }
    } else {
      // If inactive, development depends on training workRate
      formScore = player.attributes.workRate >= 80 ? 12 : 5;
    }

    // 3. Role Contributions & Discipline (0-20 pts)
    const attackPts = (stats.tries || 0) * 2.5 + Math.min(6, (stats.metresCarried || 0) / 50);
    const defPts = (stats.turnoversWon || 0) * 2.0 + Math.min(6, (stats.tacklesMade || 0) / 10);
    const kickingPts = Math.min(4, (stats.points || 0) / 15);
    const disciplinePenalty = (stats.yellowCards || 0) * 2 + (stats.redCards || 0) * 5;
    const contributionScore = Math.max(0, Math.min(20, Math.round(attackPts + defPts + kickingPts - disciplinePenalty)));

    // 4. Work Ethic & Professionalism (0-15 pts)
    const workRate = player.attributes.workRate || 65;
    const consistency = player.attributes.consistency || 65;
    const workEthicScore = Math.min(15, Math.round((workRate * 0.1) + (consistency * 0.05)));

    const rawScore = Math.min(100, Math.max(0, matchExp + formScore + contributionScore + workEthicScore));

    // Determine Verdict based on Score, Age, and Headroom
    const potentialHeadroom = player.potential - player.overall;
    let verdict: 'BREAKTHROUGH' | 'RAPID_GROWTH' | 'STEADY' | 'STAGNATION' | 'DECLINE' = 'STEADY';
    let explanation = '';
    let stagnationReason: string | undefined = undefined;

    if (player.age >= 31) {
      verdict = 'DECLINE';
      explanation = `Veteran physical decline with age ${player.age}, balanced by tactical consistency.`;
    } else if (rawScore >= 76) {
      // Exceeding expectations! Triggers Unexpected Breakthrough
      verdict = 'BREAKTHROUGH';
      explanation = `Sensational on-pitch campaign! Standout match ratings (${avgRating.toFixed(1)}) and heavy match involvement shattered expected development ceiling.`;
    } else if (rawScore >= 62 && (potentialHeadroom > 0 || player.age <= 24)) {
      verdict = 'RAPID_GROWTH';
      explanation = `Strong development trajectory. Regular first-team minutes and positive impact accelerated attribute gains.`;
    } else if (rawScore >= 45) {
      verdict = 'STEADY';
      explanation = `Steady seasonal progression meeting baseline expectations.`;
    } else {
      // Stagnation!
      verdict = 'STAGNATION';
      if (stats.matchesPlayed <= 2) {
        stagnationReason = 'Severe lack of competitive first-team match minutes halted player growth.';
      } else if (avgRating < 6.4) {
        stagnationReason = `Sub-par on-field match performance (Avg Rating: ${avgRating.toFixed(1)}) stalled progression.`;
      } else if (workRate < 60) {
        stagnationReason = 'Low training application and work rate caused developmental plateau.';
      } else {
        stagnationReason = 'Underperformed expected potential baseline across seasonal fixtures.';
      }
      explanation = `Growth Stagnation: ${stagnationReason}`;
    }

    return {
      score: rawScore,
      verdict,
      factors: {
        matchExperience: matchExp,
        formRating: formScore,
        keyContributions: contributionScore,
        workEthic: workEthicScore
      },
      explanation,
      stagnationReason
    };
  }

  /**
   * Player Aging & Progression / Veteran Degradation Formula:
   * Evaluates each player annually using their Development Score against their potential.
   * Allows for unexpected breakthroughs (surging past projected ceiling)
   * or stagnations in growth (lack of playing time or poor ratings stunting progress and lowering potential).
   */
  public evaluatePlayerAgingAndProgression(): {
    breakoutPlayers: OffSeasonSummaryData['breakoutPlayers'];
    stagnatedPlayers: NonNullable<OffSeasonSummaryData['stagnatedPlayers']>;
    developmentReports: PlayerDevelopmentResult[];
  } {
    const breakoutPlayers: OffSeasonSummaryData['breakoutPlayers'] = [];
    const stagnatedPlayers: NonNullable<OffSeasonSummaryData['stagnatedPlayers']> = [];
    const developmentReports: PlayerDevelopmentResult[] = [];

    for (const player of this.state.players) {
      player.age += 1;

      // Reset off-season conditioning
      player.fatigue = 0;
      player.fitness = 100;
      if (player.injury) {
        player.injury.weeksRemaining = Math.max(0, player.injury.weeksRemaining - 8);
        if (player.injury.weeksRemaining <= 0) {
          player.injury = null;
        }
      }

      const oldPotential = player.potential;
      const oldOverall = player.overall;

      // Calculate annual Development Score
      const dev = this.calculateDevelopmentScore(player);
      player.developmentScore = dev.score;
      player.developmentVerdict = dev.verdict;

      if (player.age >= 31) {
        // Veteran Degradation Formula:
        // Physical speed, strength, and stamina decline realistically, but tactical awareness and consistency remain elite.
        // If veteran had high development score (>= 60), decay is cushioned by match fitness.
        const decayPoints = dev.score >= 60
          ? 1
          : player.age >= 35 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;

        player.attributes.speed = Math.max(45, player.attributes.speed - decayPoints);
        player.attributes.fitness = Math.max(50, player.attributes.fitness - Math.floor(decayPoints * 0.8));
        player.attributes.strength = Math.max(50, player.attributes.strength - Math.floor(decayPoints * 0.5));

        // Mental attributes hold up
        player.attributes.tacticalAwareness = Math.min(99, player.attributes.tacticalAwareness + 1);
        player.attributes.consistency = Math.min(99, player.attributes.consistency + 1);

        player.overall = Math.max(55, player.overall - Math.min(3, decayPoints));
      } else {
        switch (dev.verdict) {
          case 'BREAKTHROUGH': {
            // Unexpected Breakthrough: player shatters potential ceiling!
            const potBoost = Math.floor(Math.random() * 3) + 2; // +2 to +4 potential
            player.potential = Math.min(99, player.potential + potBoost);
            const ovrGain = Math.min(player.potential - player.overall, Math.floor(Math.random() * 2) + 2); // +2 to +3
            player.overall = Math.min(player.potential, player.overall + ovrGain);

            player.attributes.speed = Math.min(99, player.attributes.speed + 2);
            player.attributes.offloading = Math.min(99, player.attributes.offloading + 2);
            player.attributes.passing = Math.min(99, player.attributes.passing + 2);
            player.attributes.tacticalAwareness = Math.min(99, player.attributes.tacticalAwareness + 2);
            player.attributes.workRate = Math.min(99, player.attributes.workRate + 2);

            breakoutPlayers.push({
              id: player.id,
              name: player.name,
              oldPotential,
              newPotential: player.potential,
              overall: player.overall,
              wasUserPlayer: player.clubId === this.state.userClubId,
              developmentScore: dev.score,
              reason: dev.explanation
            });

            if (player.clubId === this.state.userClubId) {
              this.state.inbox.unshift({
                id: `breakout_${player.id}_${Date.now()}`,
                date: `Off-Season Year ${this.state.seasonYear}`,
                sender: 'Head of Analytics',
                subject: `⭐ BREAKOUT PLAYER: ${player.name} breaks potential ceiling!`,
                body: `Player Performance Breakthrough:\n\n${player.name} (Dev Score: ${dev.score}/100) demonstrated phenomenal on-field impact, shattering his previous ceiling!\n• Potential upgraded: ${oldPotential} ➔ ${player.potential}\n• Current Overall: ${player.overall} (+${ovrGain})\n• Development Verdict: Sensational Breakthrough\n\nHe is in prime condition to dominate next season!`,
                category: 'SCOUTING',
                read: false,
                actionRoute: {
                  screen: 'squad',
                  targetEntityId: player.id,
                  label: 'Inspect Breakout Star'
                }
              });
            }
            break;
          }

          case 'RAPID_GROWTH': {
            const headroom = player.potential - player.overall;
            const growth = Math.min(headroom, Math.floor(Math.random() * 2) + 2); // +2 or +3
            if (growth > 0) {
              player.overall += growth;
              player.attributes.speed = Math.min(99, player.attributes.speed + 1);
              player.attributes.strength = Math.min(99, player.attributes.strength + 1);
              player.attributes.tacticalAwareness = Math.min(99, player.attributes.tacticalAwareness + 1);
            }
            break;
          }

          case 'STEADY': {
            const headroom = player.potential - player.overall;
            if (player.age <= 24 && headroom > 0) {
              player.overall += 1;
              player.attributes.tacticalAwareness = Math.min(99, player.attributes.tacticalAwareness + 1);
            }
            break;
          }

          case 'STAGNATION': {
            // Unexpected Stagnation: lack of match exposure or sub-par ratings halts growth!
            if (player.age <= 26 && player.potential > player.overall) {
              const potDrop = Math.min(3, Math.max(1, Math.floor((45 - dev.score) / 10) + 1));
              player.potential = Math.max(player.overall, player.potential - potDrop);

              stagnatedPlayers.push({
                id: player.id,
                name: player.name,
                age: player.age,
                position: player.primaryPosition,
                oldPotential,
                newPotential: player.potential,
                overall: player.overall,
                wasUserPlayer: player.clubId === this.state.userClubId,
                developmentScore: dev.score,
                reason: dev.stagnationReason || dev.explanation
              });

              if (player.clubId === this.state.userClubId) {
                this.state.inbox.unshift({
                  id: `stagnate_${player.id}_${Date.now()}`,
                  date: `Off-Season Year ${this.state.seasonYear}`,
                  sender: 'Director of Rugby',
                  subject: `⚠️ GROWTH STAGNATION: ${player.name} progression stalls`,
                  body: `Player Development Alert:\n\n${player.name} (Dev Score: ${dev.score}/100) experienced an unexpected stagnation in growth this campaign.\n• Cause: ${dev.stagnationReason || 'Limited match exposure / below-par form'}\n• Matches Played: ${player.stats.matchesPlayed}\n• Average Rating: ${(player.stats.avgRating || 0).toFixed(1)}\n• Projected Potential: ${oldPotential} ➔ ${player.potential}\n• Current Overall: ${player.overall} (No growth)\n\nRecommendation: Provide regular first-team match minutes or assign a dedicated mentor to jumpstart his development next season.`,
                  category: 'STAFF',
                  read: false,
                  actionRoute: {
                    screen: 'squad',
                    targetEntityId: player.id,
                    label: 'Inspect Stagnated Player'
                  }
                });
              }
            }
            break;
          }
        }
      }

      // Record detailed development report
      developmentReports.push({
        playerId: player.id,
        playerName: player.name,
        age: player.age,
        position: player.primaryPosition,
        clubId: player.clubId,
        developmentScore: dev.score,
        verdict: dev.verdict,
        oldPotential,
        newPotential: player.potential,
        oldOverall,
        newOverall: player.overall,
        explanation: dev.explanation,
        factors: dev.factors
      });

      // Recalculate market value & wages
      recalculatePlayerRating(player);
    }

    return { breakoutPlayers, stagnatedPlayers, developmentReports };
  }

  /**
   * Automated End-of-Season Processing:
   * Smoothly transitions game_state from REGULAR_SEASON to OFF_SEASON when final fixture concludes.
   * Archives tables, computes awards (MVP, Golden Boot, Top Try Scorer), pays prize money,
   * generates ticket sales, runs 35+ retirements, handles expiring contracts, ages players,
   * and prepares the Off-Season summary dashboard.
   */
  public processEndOfSeason(): OffSeasonSummaryData {
    const userClub = this.state.clubs.find(c => c.id === this.state.userClubId);
    const urcTable = this.state.leagueTables.URC || [];
    const championClubId = urcTable[0]?.clubId || 'leinster';
    const championClubName = this.state.clubs.find(c => c.id === championClubId)?.name || 'Leinster Rugby';
    const champion = { id: championClubId, name: championClubName };
    const userTableIndex = urcTable.findIndex(r => r.clubId === this.state.userClubId);
    const userFinishPos = userTableIndex !== -1 ? userTableIndex + 1 : 8;

    // 1. Season Awards
    // Top Try Scorer
    let topTryPlayer: Player = this.state.players[0];
    let maxTries = -1;
    this.state.players.forEach(p => {
      if ((p.stats.tries || 0) > maxTries) {
        maxTries = p.stats.tries;
        topTryPlayer = p;
      }
    });

    // Golden Boot (Points)
    let goldenBootPlayer: Player = this.state.players[0];
    let maxPoints = -1;
    this.state.players.forEach(p => {
      if ((p.stats.points || 0) > maxPoints) {
        maxPoints = p.stats.points;
        goldenBootPlayer = p;
      }
    });

    // MVP (highest avg rating with >= 6 matches)
    let mvpPlayer: Player = this.state.players[0];
    let highestRating = -1;
    this.state.players.forEach(p => {
      if ((p.stats.matchesPlayed || 0) >= 6 && (p.stats.avgRating || 0) > highestRating) {
        highestRating = p.stats.avgRating;
        mvpPlayer = p;
      }
    });

    const awards: SeasonAwards = {
      seasonYear: this.state.seasonYear,
      championClubId: champion.id,
      championClubName: champion.name,
      mvpPlayerId: mvpPlayer?.id || 'mvp_1',
      mvpPlayerName: mvpPlayer?.name || 'Damian Willemse',
      mvpClubName: this.state.clubs.find(c => c.id === mvpPlayer?.clubId)?.name || 'DHL Stormers',
      mvpRating: highestRating > 0 ? highestRating : 8.6,
      topTryScorerId: topTryPlayer?.id || 'try_1',
      topTryScorerName: topTryPlayer?.name || 'Cheslin Kolbe',
      topTryCount: maxTries > 0 ? maxTries : 12,
      topTryClubName: this.state.clubs.find(c => c.id === topTryPlayer?.clubId)?.name || 'Tokyo Sungoliath',
      goldenBootId: goldenBootPlayer?.id || 'boot_1',
      goldenBootName: goldenBootPlayer?.name || 'Handré Pollard',
      goldenBootPoints: maxPoints > 0 ? maxPoints : 148,
      goldenBootClubName: this.state.clubs.find(c => c.id === goldenBootPlayer?.clubId)?.name || 'Leicester Tigers'
    };

    // 2. Financial Prize Money Payout based on league finish
    let prizeMoney = 250000;
    if (userFinishPos === 1) prizeMoney = 1500000;
    else if (userFinishPos === 2) prizeMoney = 1000000;
    else if (userFinishPos <= 4) prizeMoney = 750000;
    else if (userFinishPos <= 8) prizeMoney = 500000;

    // Season ticket sales revenue
    const fanMultiplier = ((userClub?.fanSatisfaction ?? 80) / 100);
    const seasonTicketRevenue = Math.round((userClub?.stadiumCapacity || 18000) * 0.65 * fanMultiplier * 320);

    if (userClub) {
      userClub.transferBudget += (prizeMoney + seasonTicketRevenue);
      // Board evaluation adjustment
      if (userFinishPos <= 4) {
        userClub.boardConfidence = Math.min(100, userClub.boardConfidence + 12);
        userClub.fanSatisfaction = Math.min(100, (userClub.fanSatisfaction ?? 80) + 10);
      } else if (userFinishPos <= 8) {
        userClub.boardConfidence = Math.min(100, userClub.boardConfidence + 4);
      } else {
        userClub.boardConfidence = Math.max(40, userClub.boardConfidence - 10);
      }
    }

    // 3. Retirements (35+)
    const retiredPlayers = this.evaluateRetirements();

    // 4. Contract Expiries -> Free Agency
    const expiredToFreeAgents = this.evaluateContractExpiries();

    // 5. Player Aging, Veteran Decay, and Development Score Progression (Breakouts & Stagnations)
    const { breakoutPlayers, stagnatedPlayers } = this.evaluatePlayerAgingAndProgression();

    // 6. Youth Academy Intake / Draft (graduate 3-4 prospects)
    const youthGraduates = this.generateYouthBatch(this.state.userClubId, 3).map(p => ({
      id: p.id,
      name: p.name,
      position: p.primaryPosition,
      age: p.age,
      overall: p.overall,
      potential: p.potential
    }));

    // 7. Save to season historical archives
    if (!this.state.seasonArchives) this.state.seasonArchives = [];
    this.state.seasonArchives.unshift({
      seasonYear: this.state.seasonYear,
      careerYear: this.state.careerYear,
      championClubId: champion.id,
      championClubName: champion.name,
      userClubId: this.state.userClubId,
      userFinishPosition: userFinishPos,
      awards,
      finalTable: JSON.parse(JSON.stringify(urcTable))
    });

    const offSeasonSummary: OffSeasonSummaryData = {
      seasonYear: this.state.seasonYear,
      nextSeasonYear: this.state.seasonYear + 1,
      careerYear: this.state.careerYear,
      champion,
      userFinishPosition: userFinishPos,
      prizeMoney,
      seasonTicketRevenue,
      boardSatisfaction: userClub?.boardConfidence ?? 85,
      awards,
      retiredPlayers,
      expiredToFreeAgents,
      youthGraduates,
      breakoutPlayers,
      stagnatedPlayers
    };

    if (userFinishPos === 1) {
      const firstTrophy = (this.state.milestones || []).find(m => m.id === 'first_trophy');
      if (firstTrophy && !firstTrophy.unlocked) {
        firstTrophy.progress = 1;
      }
    }
    this.checkMilestones();

    this.state.lastOffSeasonSummary = offSeasonSummary;
    this.state.seasonPhase = 'OFF_SEASON';

    this.state.inbox.unshift({
      id: `end_of_season_${this.state.seasonYear}_${Date.now()}`,
      date: `Season ${this.state.seasonYear} Conclusion`,
      sender: 'League Board & Operations',
      subject: `🏆 SEASON ${this.state.seasonYear} CONCLUDED: Final Review & Off-Season Transition`,
      body: `Season ${this.state.seasonYear} is officially in the books!\n\n• Champions: ${champion.name}\n• Your Finish: Position #${userFinishPos}\n• Prize Money Awarded: £${prizeMoney.toLocaleString()}\n• Season Ticket Renewals: £${seasonTicketRevenue.toLocaleString()}\n• Season MVP: ${awards.mvpPlayerName} (${awards.mvpClubName})\n• Top Try Scorer: ${awards.topTryScorerName} (${awards.topTryCount} tries)\n• Golden Boot: ${awards.goldenBootName} (${awards.goldenBootPoints} pts)\n\nProceed to the Pre-Season window to make dynamic transfers and re-sign free agents before kickoff!`,
      category: 'BOARD',
      read: false
    });

    this.notify();
    return offSeasonSummary;
  }

  /**
   * Transition to Pre-Season:
   * Opens the transfer market for dynamic bidding, buyouts, and free agents.
   */
  public proceedToPreSeason(): void {
    this.state.seasonPhase = 'PRE_SEASON';
    this.state.isTransferWindowOpen = true; // Transfers active!

    this.state.inbox.unshift({
      id: `preseason_open_${Date.now()}`,
      date: `Pre-Season ${this.state.seasonYear + 1}`,
      sender: 'Director of Rugby',
      subject: `🟢 PRE-SEASON TRANSFER WINDOW OPEN!`,
      body: `Welcome to the Pre-Season transfer window for the upcoming ${this.state.seasonYear + 1} campaign!\n\n• The transfer market is OPEN for dynamic signings and rival buyouts.\n• Unattached Free Agents are available for signing.\n• Review expiring contracts and prepare your Starting XV.\n\nOnce you are ready, click "Kick Off Regular Season" to lock in squads and begin Round 1 fixtures.`,
      category: 'TRANSFER',
      read: false
    });

    this.notify();
  }

  /**
   * Starts the New Season:
   * Advances calendar year, rolls over fixtures, resets league table to 0-0,
   * closes the transfer market (Free Agents only), and begins Round 1.
   */
  public startNewSeason(): void {
    this.state.careerYear = Math.min(this.state.totalCareerYears, this.state.careerYear + 1);
    this.state.seasonYear += 1;
    this.state.currentRound = 1;
    this.state.weekNumber = 1;
    this.state.seasonPhase = 'REGULAR_SEASON';
    this.state.isTransferWindowOpen = false; // Closed during regular season (Free agents only)

    // Archive season stats to lastSeasonStats and reset current seasonal stats
    this.state.players.forEach(p => {
      p.lastSeasonStats = {
        seasonId: `${this.state.seasonYear - 1}-${(this.state.seasonYear).toString().slice(2)}`,
        seasonName: `${this.state.seasonYear - 1} URC Regular Season`,
        matchesPlayed: p.stats.matchesPlayed,
        tries: p.stats.tries,
        conversions: p.stats.conversions,
        penalties: p.stats.penalties,
        dropGoals: p.stats.dropGoals,
        points: p.stats.points,
        tacklesMade: p.stats.tacklesMade,
        tacklesMissed: p.stats.tacklesMissed,
        turnoversWon: p.stats.turnoversWon,
        metresCarried: p.stats.metresCarried,
        yellowCards: p.stats.yellowCards,
        redCards: p.stats.redCards,
        avgRating: p.stats.avgRating || 7.0
      };

      p.stats = {
        matchesPlayed: 0,
        tries: 0,
        conversions: 0,
        penalties: 0,
        dropGoals: 0,
        points: 0,
        tacklesMade: 0,
        tacklesMissed: 0,
        turnoversWon: 0,
        metresCarried: 0,
        yellowCards: 0,
        redCards: 0,
        avgRating: 7.0
      };
    });

    // Regenerate fixtures and reset table for new season
    const { fixtures, table } = generateFixturesForLeague(this.state.clubs, 'URC');
    this.state.fixtures = fixtures;
    this.state.leagueTables.URC = table;

    // Recalculate ratings
    recalculateBatchRatings(this.state.players);

    this.state.inbox.unshift({
      id: `season_kickoff_${this.state.seasonYear}_${Date.now()}`,
      date: `Week 1, Season ${this.state.seasonYear}`,
      sender: 'URC League Operations',
      subject: `🏉 Season ${this.state.seasonYear} KICKS OFF! (Year ${this.state.careerYear} of ${this.state.totalCareerYears})`,
      body: `The new URC Championship season is officially underway!\n\n• Transfer Market Status: CLOSED (Only Free Agents may be signed during the regular campaign)\n• Fixtures: 18 rounds generated\n• Current Round: Round 1\n\nGood luck Coach. Lead your team to the silverware!`,
      category: 'BOARD',
      read: false
    });

    this.notify();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // storage full or disabled
    }
  }

  private loadFromStorage(): CareerState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed) {
          if (typeof parsed.coins !== 'number') {
            parsed.coins = 750;
          }
          if (parsed.clubs) {
            parsed.clubs.forEach((c: Club) => {
              if (c.fanSatisfaction === undefined) c.fanSatisfaction = 82;
              if (!c.rivalryH2H) c.rivalryH2H = {};
            });
          }
          if (parsed.players) {
            parsed.players = parsed.players.filter((p: Player) => {
              const lower = p.name.toLowerCase().trim();
              return !(
                p.id === 'urc_p_153215' ||
                p.id === 'urc_p_180559' ||
                lower.includes('fassi') ||
                lower.includes('lukhanyo am') ||
                (p.clubId === 'sharks_urc' && lower === 'am')
              );
            });
          }
          if (parsed.userLineup) {
            const validIds = new Set((parsed.players || []).map((p: Player) => p.id));
            if (parsed.userLineup.startingXV) {
              Object.keys(parsed.userLineup.startingXV).forEach(k => {
                if (!validIds.has(parsed.userLineup.startingXV[Number(k)])) {
                  delete parsed.userLineup.startingXV[Number(k)];
                }
              });
            }
            if (parsed.userLineup.bench) {
              Object.keys(parsed.userLineup.bench).forEach(k => {
                if (!validIds.has(parsed.userLineup.bench[Number(k)])) {
                  delete parsed.userLineup.bench[Number(k)];
                }
              });
            }

            // Refill any slots that became empty due to departed players
            if (parsed.players && parsed.userClubId) {
              const userSquad = parsed.players.filter((p: Player) => p.clubId === parsed.userClubId);
              const picked = new Set<string>([
                ...Object.values(parsed.userLineup.startingXV || {}).map(String),
                ...Object.values(parsed.userLineup.bench || {}).map(String)
              ]);

              parsed.userLineup.startingXV = parsed.userLineup.startingXV || {};
              for (let j = 1; j <= 15; j++) {
                if (!parsed.userLineup.startingXV[j]) {
                  const targetPos = (JERSEY_TO_POSITION as any)[j];
                  const available = userSquad.filter((p: Player) => !picked.has(p.id) && !p.injury);
                  const positional = available.find((p: Player) => p.primaryPosition === targetPos || p.secondaryPositions?.includes(targetPos));
                  const chosen = positional || available[0];
                  if (chosen) {
                    parsed.userLineup.startingXV[j] = chosen.id;
                    picked.add(chosen.id);
                  }
                }
              }

              parsed.userLineup.bench = parsed.userLineup.bench || {};
              for (let j = 16; j <= 23; j++) {
                if (!parsed.userLineup.bench[j]) {
                  const available = userSquad.filter((p: Player) => !picked.has(p.id) && !p.injury);
                  const chosen = available[0];
                  if (chosen) {
                    parsed.userLineup.bench[j] = chosen.id;
                    picked.add(chosen.id);
                  }
                }
              }
            }
          }

          if (!parsed.seasonPhase) parsed.seasonPhase = 'REGULAR_SEASON';
          if (!parsed.careerYear) parsed.careerYear = 1;
          if (!parsed.totalCareerYears) parsed.totalCareerYears = 20;
          if (parsed.isTransferWindowOpen === undefined) parsed.isTransferWindowOpen = parsed.seasonPhase === 'PRE_SEASON';
          if (!parsed.seasonArchives) parsed.seasonArchives = [];

          if (!parsed.milestones || parsed.milestones.length === 0) {
            parsed.milestones = createDefaultMilestones();
          } else {
            const existingIds = new Set(parsed.milestones.map((m: any) => m.id));
            createDefaultMilestones().forEach(dm => {
              if (!existingIds.has(dm.id)) {
                parsed.milestones.push(dm);
              }
            });
          }

          if (!parsed.statsStreak) {
            parsed.statsStreak = { unbeaten: 0, homeWins: 0, totalMatches: 0, derbyWins: 0 };
          }

          // Ensure every loaded player and youth prospect has a MINIMUM of 2 positions they can play!
          if (parsed.players && Array.isArray(parsed.players)) {
            parsed.players.forEach((p: Player) => ensurePlayerHasMinimumPositions(p));
            recalculateBatchRatings(parsed.players);
          }
          if (parsed.youthProspects && Array.isArray(parsed.youthProspects)) {
            parsed.youthProspects.forEach((p: Player) => ensurePlayerHasMinimumPositions(p));
          }
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  }

  public exportSaveJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importSaveJSON(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      if (parsed && parsed.userClubId && parsed.players) {
        if (!parsed.milestones) parsed.milestones = createDefaultMilestones();
        if (!parsed.statsStreak) parsed.statsStreak = { unbeaten: 0, homeWins: 0, totalMatches: 0, derbyWins: 0 };
        parsed.players.forEach((p: Player) => ensurePlayerHasMinimumPositions(p));
        if (parsed.youthProspects) parsed.youthProspects.forEach((p: Player) => ensurePlayerHasMinimumPositions(p));
        this.state = parsed;
        this.notify();
        return true;
      }
    } catch {
      // invalid
    }
    return false;
  }
}

export const careerManager = new CareerManager();
