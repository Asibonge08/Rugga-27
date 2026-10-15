import { Club, Player, LeagueId, TacticsConfig, MatchSelection, LeagueTableRow, Fixture, InboxMessage, TransferOffer, ScoutingAssignment, StaffMember } from '../types/rugby';
import { INITIAL_CLUBS, generateClubSquad, generateFixturesForLeague, calculatePlayerOverall, POSITIONS_ORDER } from '../data/rugbyDatabase';
import { getRivalry, calculateFanSatisfactionDelta } from '../data/rugbyRivalries';
import { urcRegistry } from './urcRegistryService';

export interface CareerState {
  version: number;
  managerName: string;
  userClubId: string;
  seasonYear: number;
  currentRound: number;
  weekNumber: number;
  coins: number;
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

  private notify() {
    this.saveToStorage();
    this.subscribers.forEach(cb => cb({ ...this.state }));
  }

  public createNewCareer(userClubId: string, managerName: string): CareerState {
    const clubs: Club[] = JSON.parse(JSON.stringify(INITIAL_CLUBS)).map((c: Club) => ({
      ...c,
      isUserControlled: c.id === userClubId,
      fanSatisfaction: c.fanSatisfaction ?? 82,
      rivalryH2H: {}
    }));

    // Generate squads for all clubs
    let players: Player[] = [];
    clubs.forEach(c => {
      const clubSquad = generateClubSquad(c);
      players = players.concat(clubSquad);
    });

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
      const names = ['Liam', 'Tiaan', 'Cian', 'Sipho', 'Finlay', 'Cobus', 'Duan', 'Callum'];
      const surnames = ['Pretorius', 'O’Brien', 'Botha', 'Mthembu', 'Murphy', 'de Villiers', 'Fourie'];
      const name = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;

      const baseRating = 62 + Math.floor(Math.random() * 10);
      const attrs = {
        scrummaging: baseRating + Math.floor(Math.random() * 8),
        hooking: baseRating,
        lineout: baseRating,
        breakdown: baseRating + 2,
        tackling: baseRating + 4,
        carrying: baseRating + 5,
        offloading: baseRating,
        passing: baseRating + 3,
        kicking: baseRating - 2,
        goalKicking: baseRating - 5,
        speed: baseRating + 8,
        strength: baseRating + 6,
        fitness: 85,
        tacticalAwareness: baseRating - 4,
        workRate: baseRating + 5,
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
        secondaryPositions: [],
        heightCm: 185,
        weightKg: 96,
        attributes: attrs,
        potential: Math.min(96, overall + 16 + Math.floor(Math.random() * 10)),
        overall,
        marketValue: 120000 + Math.floor(Math.random() * 150000),
        weeklyWage: 800,
        contractYearsLeft: 2,
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
    this.notify();
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
          read: false
        });
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

    Object.keys(allStats).forEach(pid => {
      const matchStat = allStats[pid];
      const p = this.state.players.find(x => x.id === pid);
      if (p) {
        p.stats.matchesPlayed++;
        p.stats.tries += matchStat.tries;
        p.stats.conversions += matchStat.conversions;
        p.stats.penalties += matchStat.penalties;
        p.stats.tacklesMade += matchStat.tacklesMade;
        p.stats.turnoversWon += matchStat.turnoversWon;
        p.stats.metresCarried += Math.round(matchStat.metresCarried);
        if (matchStat.yellowCard) p.stats.yellowCards++;
        if (matchStat.redCard) p.stats.redCards++;

        // Moving average of rating
        p.stats.avgRating = Number(((p.stats.avgRating * (p.stats.matchesPlayed - 1) + matchStat.rating) / p.stats.matchesPlayed).toFixed(1));

        // Morale and fatigue adjustments
        p.fatigue = Math.min(100, p.fatigue + 25);
        p.fitness = Math.max(50, p.fitness - 20);
        if (matchStat.rating >= 7.5) p.morale = Math.min(100, p.morale + 5);
      }
    });
  }

  public advanceWeek() {
    this.state.weekNumber++;
    this.state.currentRound = Math.min(18, this.state.currentRound + 1);

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

    // 2. Training and Fatigue recovery
    const intensity = this.state.trainingSchedule.intensity;
    const fatigueDrain = intensity === 'HIGH' ? 10 : intensity === 'NORMAL' ? 4 : 0;
    const attrGain = intensity === 'HIGH' ? 0.35 : intensity === 'NORMAL' ? 0.20 : 0.08;

    this.state.players.forEach(p => {
      // Recover fitness and reduce fatigue
      p.fitness = Math.min(100, p.fitness + 18);
      p.fatigue = Math.max(0, p.fatigue - 22 + fatigueDrain);

      // Young players develop toward potential
      if (p.age < 26 && p.overall < p.potential && Math.random() < attrGain) {
        p.overall = Math.min(p.potential, p.overall + 1);
      }

      // Progress injuries
      if (p.injury) {
        p.injury.weeksRemaining--;
        if (p.injury.weeksRemaining <= 0) {
          this.state.inbox.unshift({
            id: `inj_rec_${p.id}_${Date.now()}`,
            date: `Week ${this.state.weekNumber}`,
            sender: 'Head Physio',
            subject: `${p.name} has returned to full training`,
            body: `Medical staff have cleared ${p.name} after rehabilitation from his ${p.injury.name}. He is available for selection.`,
            category: 'INJURY',
            read: false
          });
          p.injury = null;
        }
      }
    });

    // 3. Random Injury check (higher if fatigue > 70)
    if (Math.random() < 0.25) {
      const uninjured = this.state.players.filter(p => p.clubId === this.state.userClubId && !p.injury);
      if (uninjured.length > 0) {
        const victim = uninjured[Math.floor(Math.random() * uninjured.length)];
        const injuryTypes = [
          { name: 'Hamstring Strain', weeks: 2 },
          { name: 'Concussion (HIA Protocol)', weeks: 1 },
          { name: 'AC Joint Shoulder Sprain', weeks: 3 },
          { name: 'Ankle Ligament Twisting', weeks: 4 }
        ];
        const chosenInj = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
        victim.injury = { name: chosenInj.name, weeksRemaining: chosenInj.weeks };

        this.state.inbox.unshift({
          id: `inj_${victim.id}_${Date.now()}`,
          date: `Week ${this.state.weekNumber}`,
          sender: 'Medical Department',
          subject: `Injury Report: ${victim.name}`,
          body: `${victim.name} suffered a ${chosenInj.name} during training contact drills. Estimated recovery: ${chosenInj.weeks} weeks.`,
          category: 'INJURY',
          read: false
        });
      }
    }

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

    if (userClub.transferBudget < transferFee) {
      return { success: false, message: 'Insufficient transfer funds' };
    }

    const sellingClub = this.state.clubs.find(c => c.id === player.clubId);

    // Complete transaction
    userClub.transferBudget -= transferFee;
    if (sellingClub) {
      sellingClub.transferBudget += transferFee;
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
      body: `We are delighted to officially welcome ${player.name} (${player.primaryPosition}) to ${userClub.name}. The transfer fee of £${transferFee.toLocaleString()} has been processed.`,
      category: 'TRANSFER',
      read: false
    });

    this.notify();
    return { success: true, message: `Successfully signed ${player.name}!` };
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

  public promoteYouthPlayer(playerId: string) {
    const prospectIdx = this.state.youthProspects.findIndex(p => p.id === playerId);
    if (prospectIdx !== -1) {
      const p = this.state.youthProspects.splice(prospectIdx, 1)[0];
      p.squadRole = 'Squad Rotation';
      this.state.players.push(p);

      this.state.inbox.unshift({
        id: `prospect_pro_${p.id}`,
        date: `Week ${this.state.weekNumber}`,
        sender: 'Academy Director',
        subject: `Academy graduate ${p.name} promoted to Senior First Team!`,
        body: `Exciting young talent ${p.name} has impressed the coaching staff and has signed his first professional contract. He is now registered for senior competition.`,
        category: 'BOARD',
        read: false
      });

      this.notify();
    }
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
