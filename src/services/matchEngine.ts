import { Club, Player, TacticsConfig, MatchEvent, InMatchPlayerStats, Fixture, Rivalry } from '../types/rugby';
import { soundFx } from './soundFx';
import { getRivalry } from '../data/rugbyRivalries';

export interface VisualPlayer {
  id: string;
  name: string;
  number: number;
  team: 'home' | 'away';
  x: number;      // 0 to 100 meters
  y: number;      // 0 to 70 meters
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  speed: number;
  isCarrier: boolean;
  state: 'idle' | 'running' | 'carrying' | 'tackling' | 'rucking' | 'scrum' | 'lineout' | 'kicking' | 'celebrating' | 'sin_bin';
  sinBinTimer?: number; // Match minutes
  stats: InMatchPlayerStats;
}

export interface Ball {
  x: number;
  y: number;
  z: number;      // Height in meters
  vx: number;
  vy: number;
  vz: number;
  carrierId: string | null;
  state: 'carried' | 'passed' | 'kicked' | 'loose' | 'placed_for_kick' | 'scored';
  targetX?: number;
  targetY?: number;
}

export type MatchPhase =
  | 'KICK_OFF'
  | 'OPEN_PLAY'
  | 'RUCK'
  | 'SCRUM'
  | 'LINEOUT'
  | 'MAUL'
  | 'CONVERSION'
  | 'PENALTY_KICK'
  | 'TRY_SCORED'
  | 'HALF_TIME'
  | 'FULL_TIME';

export interface MatchEngineState {
  matchMinute: number;         // 0 to 80+
  phase: MatchPhase;
  phaseTimer: number;          // seconds remaining in phase
  homeScore: number;
  awayScore: number;
  homeTries: number;
  awayTries: number;
  possessionTeam: 'home' | 'away';
  phaseCount: number;          // Rucks in current attacking sequence
  territory: { home: number; away: number }; // %
  possession: { home: number; away: number }; // %
  rucksWon: { home: number; away: number };
  scrumsWon: { home: number; away: number };
  turnovers: { home: number; away: number };
  penaltiesConceded: { home: number; away: number };
  events: MatchEvent[];
  commentary: string[];
  isPaused: boolean;
  speedMultiplier: number;     // 1, 2, 4
  highlightsOnly: boolean;
  inHighlight: boolean;
  matchTension: number;        // 0 to 100 (Match tension scale)
  isRivalryMatch: boolean;
  activeRivalry: Rivalry | null;
}

export class RugbyMatchEngine {
  public homeClub: Club;
  public awayClub: Club;
  public homePlayers: VisualPlayer[] = [];
  public awayPlayers: VisualPlayer[] = [];
  public ball: Ball = { x: 50, y: 35, z: 0, vx: 0, vy: 0, vz: 0, carrierId: null, state: 'placed_for_kick' };
  public state: MatchEngineState;
  public homeTactics: TacticsConfig;
  public awayTactics: TacticsConfig;
  private animFrameId: number | null = null;
  private onUpdateCallback?: (engine: RugbyMatchEngine) => void;
  private lastTimestamp: number = 0;
  private lastRivalryEventMinute: number = -15;

  constructor(
    homeClub: Club,
    awayClub: Club,
    homeSquad: Player[],
    awaySquad: Player[],
    homeTactics: TacticsConfig,
    awayTactics: TacticsConfig,
    homeLineup: Record<number, string>,
    awayLineup: Record<number, string>
  ) {
    this.homeClub = homeClub;
    this.awayClub = awayClub;
    this.homeTactics = homeTactics;
    this.awayTactics = awayTactics;

    const activeRivalry = getRivalry(homeClub.id, awayClub.id);
    const isRivalry = !!activeRivalry;
    const initialTension = isRivalry ? (activeRivalry.intensity === 'FIERCE' ? 82 : 72) : 42;

    const initialCommentary: string[] = isRivalry
      ? [
          `🔥 RIVALRY CLASH: ${activeRivalry.name}! The atmosphere is electric as ${homeClub.name} host arch-rivals ${awayClub.name}.`,
          `${activeRivalry.lore}`,
          `Tension is electric! Both squads emerge to an absolute wall of sound.`
        ]
      : ['Welcome to the match! Both squads take to the pitch.'];

    this.state = {
      matchMinute: 0,
      phase: 'KICK_OFF',
      phaseTimer: 3.0,
      homeScore: 0,
      awayScore: 0,
      homeTries: 0,
      awayTries: 0,
      possessionTeam: 'home',
      phaseCount: 0,
      territory: { home: 50, away: 50 },
      possession: { home: 50, away: 50 },
      rucksWon: { home: 0, away: 0 },
      scrumsWon: { home: 0, away: 0 },
      turnovers: { home: 0, away: 0 },
      penaltiesConceded: { home: 0, away: 0 },
      events: [],
      commentary: initialCommentary,
      isPaused: true,
      speedMultiplier: 1,
      highlightsOnly: false,
      inHighlight: true,
      matchTension: initialTension,
      isRivalryMatch: isRivalry,
      activeRivalry: activeRivalry || null
    };

    this.initializePlayers(homeSquad, awaySquad, homeLineup, awayLineup);
    this.setupKickoff('home');
  }

  private initializePlayers(
    homeSquad: Player[],
    awaySquad: Player[],
    homeLineup: Record<number, string>,
    awayLineup: Record<number, string>
  ) {
    this.homePlayers = [];
    this.awayPlayers = [];

    // Helper for visual player
    const createVisual = (p: Player, num: number, team: 'home' | 'away'): VisualPlayer => ({
      id: p.id,
      name: p.name,
      number: num,
      team,
      x: team === 'home' ? 40 : 60,
      y: 35,
      vx: 0,
      vy: 0,
      targetX: team === 'home' ? 40 : 60,
      targetY: 35,
      speed: 4.5 + (p.attributes.speed / 99) * 4.0,
      isCarrier: false,
      state: 'idle',
      stats: {
        playerId: p.id,
        rating: 6.5,
        tries: 0,
        conversions: 0,
        penalties: 0,
        tacklesMade: 0,
        tacklesMissed: 0,
        turnoversWon: 0,
        metresCarried: 0,
        carries: 0,
        yellowCard: false,
        redCard: false,
        injured: false
      }
    });

    for (let num = 1; num <= 15; num++) {
      const hId = homeLineup[num];
      const hPlayer = homeSquad.find(p => p.id === hId) || homeSquad[num - 1] || homeSquad[0];
      if (hPlayer) {
        this.homePlayers.push(createVisual(hPlayer, num, 'home'));
      }

      const aId = awayLineup[num];
      const aPlayer = awaySquad.find(p => p.id === aId) || awaySquad[num - 1] || awaySquad[0];
      if (aPlayer) {
        this.awayPlayers.push(createVisual(aPlayer, num, 'away'));
      }
    }
  }

  public setOnUpdate(cb: (engine: RugbyMatchEngine) => void) {
    this.onUpdateCallback = cb;
  }

  public play() {
    this.state.isPaused = false;
    soundFx.playWhistle('short');
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  public pause() {
    this.state.isPaused = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public setSpeed(mult: number) {
    this.state.speedMultiplier = mult;
  }

  public toggleHighlights(enabled: boolean) {
    this.state.highlightsOnly = enabled;
  }

  private loop = (timestamp: number) => {
    if (this.state.isPaused) return;

    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    const dt = Math.min(rawDt, 0.05) * this.state.speedMultiplier;

    this.update(dt);

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this);
    }

    if (this.state.phase !== 'FULL_TIME') {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  };

  private addCommentary(msg: string) {
    this.state.commentary.unshift(`[${Math.floor(this.state.matchMinute)}'] ${msg}`);
    if (this.state.commentary.length > 25) {
      this.state.commentary.pop();
    }
  }

  private addEvent(
    type: import('../types/rugby').MatchEventType,
    description: string,
    teamId: string,
    playerId?: string,
    isRivalryEvent?: boolean
  ) {
    const isRivalry = isRivalryEvent ?? (this.state.isRivalryMatch && (type.startsWith('RIVALRY_') || Math.random() < 0.25));
    const evt: MatchEvent = {
      minute: Math.floor(this.state.matchMinute),
      type,
      description,
      teamId,
      playerId,
      scoreHome: this.state.homeScore,
      scoreAway: this.state.awayScore,
      pitchX: this.ball.x,
      pitchY: this.ball.y,
      isRivalryEvent: isRivalry
    };
    this.state.events.unshift(evt);
    this.addCommentary(description);
  }

  public setupKickoff(team: 'home' | 'away') {
    this.state.phase = 'KICK_OFF';
    this.state.possessionTeam = team;
    this.state.phaseTimer = 2.0;

    // Reset ball to halfway
    this.ball = {
      x: 50,
      y: 35,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      carrierId: null,
      state: 'placed_for_kick'
    };

    // Position players on their halves
    this.homePlayers.forEach(p => {
      p.state = 'idle';
      p.isCarrier = false;
      const xBase = 50 - 5 - (p.number > 8 ? 15 : 5);
      const ySpread = 10 + (p.number * 3.5);
      p.targetX = Math.max(15, Math.min(48, xBase + (Math.random() * 6 - 3)));
      p.targetY = Math.max(10, Math.min(60, ySpread));
    });

    this.awayPlayers.forEach(p => {
      p.state = 'idle';
      p.isCarrier = false;
      const xBase = 50 + 5 + (p.number > 8 ? 15 : 5);
      const ySpread = 10 + (p.number * 3.5);
      p.targetX = Math.max(52, Math.min(85, xBase + (Math.random() * 6 - 3)));
      p.targetY = Math.max(10, Math.min(60, ySpread));
    });

    // Fly-half takes kick
    const kicker = team === 'home'
      ? this.homePlayers.find(p => p.number === 10) || this.homePlayers[9]
      : this.awayPlayers.find(p => p.number === 10) || this.awayPlayers[9];

    if (kicker) {
      kicker.targetX = team === 'home' ? 49 : 51;
      kicker.targetY = 35;
    }
  }

  private executeKickoff() {
    soundFx.playKick();
    const team = this.state.possessionTeam;
    const destX = team === 'home' ? 75 + (Math.random() * 15 - 5) : 25 - (Math.random() * 15 - 5);
    const destY = 20 + Math.random() * 30;

    this.ball.state = 'kicked';
    this.ball.z = 8;
    this.ball.targetX = destX;
    this.ball.targetY = destY;

    this.addEvent('KICK_OFF', `${team === 'home' ? this.homeClub.shortName : this.awayClub.shortName} kicks off deep into the opposition 22!`, team === 'home' ? this.homeClub.id : this.awayClub.id);

    this.state.phase = 'OPEN_PLAY';
    this.state.phaseTimer = 2.0;

    // Opponent gathers
    const receivingTeam = team === 'home' ? 'away' : 'home';
    this.state.possessionTeam = receivingTeam;
    const receiver = receivingTeam === 'away'
      ? this.awayPlayers.find(p => p.number === 15) || this.awayPlayers[14]
      : this.homePlayers.find(p => p.number === 15) || this.homePlayers[14];

    if (receiver) {
      receiver.targetX = destX;
      receiver.targetY = destY;
      setTimeout(() => {
        this.giveBallToPlayer(receiver);
      }, 900);
    }
  }

  private giveBallToPlayer(player: VisualPlayer) {
    this.ball.carrierId = player.id;
    this.ball.state = 'carried';
    this.ball.z = 0;
    this.ball.x = player.x;
    this.ball.y = player.y;

    this.homePlayers.forEach(p => p.isCarrier = (p.id === player.id));
    this.awayPlayers.forEach(p => p.isCarrier = (p.id === player.id));

    player.state = 'carrying';
    player.stats.carries++;
  }

  private update(dt: number) {
    // Advance match minute (80 minutes in ~3-4 minutes of normal simulation)
    this.state.matchMinute += (dt * 0.45);

    // Sin-bin timers check
    [...this.homePlayers, ...this.awayPlayers].forEach(p => {
      if (p.sinBinTimer && p.sinBinTimer > 0) {
        p.sinBinTimer -= (dt * 0.45);
        if (p.sinBinTimer <= 0) {
          p.sinBinTimer = undefined;
          p.state = 'idle';
          this.addCommentary(`${p.name} returns to the pitch after serving 10 minutes in the sin bin.`);
        }
      }
    });

    // Check Half-Time / Full-Time
    if (this.state.matchMinute >= 40 && this.state.matchMinute < 40.5 && this.state.phase !== 'HALF_TIME' && this.state.phase !== 'CONVERSION') {
      this.state.phase = 'HALF_TIME';
      this.state.isPaused = true;
      soundFx.playWhistle('double');
      this.addEvent('HALF_TIME', `Half-time whistle blows! Score: ${this.homeClub.shortName} ${this.state.homeScore} - ${this.state.awayScore} ${this.awayClub.shortName}`, '');
      return;
    }

    if (this.state.matchMinute >= 80 && this.state.phase !== 'FULL_TIME' && this.state.phase !== 'CONVERSION' && this.state.phase !== 'PENALTY_KICK') {
      this.state.phase = 'FULL_TIME';
      this.state.isPaused = true;
      soundFx.playWhistle('long');
      this.addEvent('FULL_TIME', `Full-time! Final Score: ${this.homeClub.shortName} ${this.state.homeScore} - ${this.state.awayScore} ${this.awayClub.shortName}`, '');
      return;
    }

    // Step current phase
    this.stepPhase(dt);

    // Update physical positions of players & ball
    this.updatePhysics(dt);

    // Update match tension dynamically
    this.updateMatchTension();

    // Check for unique rivalry events during matchplay
    if (this.state.isRivalryMatch) {
      this.checkRivalryTriggers();
    }

    // Update territory & possession estimates based on ball position and carrier
    const isHomeTerritory = this.ball.x > 50;
    this.state.territory.home = Math.round(this.state.territory.home * 0.995 + (isHomeTerritory ? 1 : 0) * 0.5);
    this.state.territory.away = 100 - this.state.territory.home;

    const isHomePoss = this.state.possessionTeam === 'home';
    this.state.possession.home = Math.round(this.state.possession.home * 0.995 + (isHomePoss ? 1 : 0) * 0.5);
    this.state.possession.away = 100 - this.state.possession.home;
  }

  private updateMatchTension() {
    const isRivalry = this.state.isRivalryMatch;
    const baseTension = isRivalry ? 72 : 38;
    const minute = this.state.matchMinute;

    const scoreDiff = Math.abs(this.state.homeScore - this.state.awayScore);
    let closenessFactor = 0;
    if (scoreDiff <= 3) closenessFactor = 22;
    else if (scoreDiff <= 7) closenessFactor = 16;
    else if (scoreDiff <= 14) closenessFactor = 8;
    else closenessFactor = -4;

    let lateMatchFactor = 0;
    if (minute >= 65 && scoreDiff <= 7) {
      lateMatchFactor = isRivalry ? 18 : 12;
    } else if (minute >= 40 && scoreDiff <= 7) {
      lateMatchFactor = 8;
    }

    const calculated = baseTension + closenessFactor + lateMatchFactor;
    this.state.matchTension = Math.max(20, Math.min(100, Math.round(calculated)));
  }

  private checkRivalryTriggers() {
    const currentMin = Math.floor(this.state.matchMinute);
    // Don't trigger rivalry events too close to each other (at least 12 minutes apart)
    if (currentMin - this.lastRivalryEventMinute < 12 || currentMin < 6 || currentMin > 78) {
      return;
    }

    // Probability check when in open play or ruck
    if ((this.state.phase === 'OPEN_PLAY' || this.state.phase === 'RUCK') && Math.random() < 0.09) {
      this.triggerRivalryEvent();
    }
  }

  private triggerRivalryEvent() {
    this.lastRivalryEventMinute = Math.floor(this.state.matchMinute);
    const rivalry = this.state.activeRivalry;
    const rivalryName = rivalry ? rivalry.name : 'Derby';

    const events = [
      {
        type: 'RIVALRY_SCUFFLE' as const,
        fn: () => {
          soundFx.playWhistle('short');
          soundFx.playTackle();
          this.state.matchTension = Math.min(100, this.state.matchTension + 12);
          this.addEvent(
            'RIVALRY_SCUFFLE',
            `🔥 [${rivalryName.toUpperCase()}] Tempers boil over at the ruck! Front rows clashing in fierce shoving. The referee calls over both captains for a stern lecture!`,
            this.homeClub.id,
            undefined,
            true
          );
        }
      },
      {
        type: 'RIVALRY_BIG_HIT' as const,
        fn: () => {
          soundFx.playTackle();
          soundFx.playCrowdCheer();
          this.state.matchTension = Math.min(100, this.state.matchTension + 8);
          const carrier = this.ball.carrierId ? [...this.homePlayers, ...this.awayPlayers].find(p => p.id === this.ball.carrierId) : null;
          const runnerName = carrier ? carrier.name : 'the ball carrier';
          this.addEvent(
            'RIVALRY_BIG_HIT',
            `💥 [DERBY IMPACT] Tremendous bone-crunching collision on ${runnerName}! The derby crowd roars as collisions reach fever pitch!`,
            this.state.possessionTeam === 'home' ? this.awayClub.id : this.homeClub.id,
            undefined,
            true
          );
        }
      },
      {
        type: 'RIVALRY_DISPUTE' as const,
        fn: () => {
          soundFx.playWhistle('short');
          this.state.matchTension = Math.min(100, this.state.matchTension + 7);
          this.addEvent(
            'RIVALRY_DISPUTE',
            `⚡ [DERBY DRAMA] Hostile confrontation with the assistant referee over a lineout call! Deafening jeers from the supporters!`,
            this.homeClub.id,
            undefined,
            true
          );
        }
      },
      {
        type: 'RIVALRY_HEROIC_TURNOVER' as const,
        fn: () => {
          soundFx.playCrowdCheer();
          this.state.turnovers[this.state.possessionTeam === 'home' ? 'away' : 'home']++;
          this.state.matchTension = Math.min(100, this.state.matchTension + 10);
          this.addEvent(
            'RIVALRY_HEROIC_TURNOVER',
            `🛡️ [CLUTCH DERBY STAND] Incredible turnover jackal penalty won on the 5-metre line! Unmatched desperation and heart!`,
            this.state.possessionTeam === 'home' ? this.awayClub.id : this.homeClub.id,
            undefined,
            true
          );
        }
      }
    ];

    const chosen = events[Math.floor(Math.random() * events.length)];
    chosen.fn();
  }

  private stepPhase(dt: number) {
    this.state.phaseTimer -= dt;

    if (this.state.phase === 'KICK_OFF') {
      if (this.state.phaseTimer <= 0) {
        this.executeKickoff();
      }
      return;
    }

    if (this.state.phase === 'RUCK') {
      if (this.state.phaseTimer <= 0) {
        this.resolveRuck();
      }
      return;
    }

    if (this.state.phase === 'SCRUM') {
      if (this.state.phaseTimer <= 0) {
        this.resolveScrum();
      }
      return;
    }

    if (this.state.phase === 'LINEOUT') {
      if (this.state.phaseTimer <= 0) {
        this.resolveLineout();
      }
      return;
    }

    if (this.state.phase === 'CONVERSION') {
      if (this.state.phaseTimer <= 0) {
        this.resolveConversion();
      }
      return;
    }

    if (this.state.phase === 'PENALTY_KICK') {
      if (this.state.phaseTimer <= 0) {
        this.resolvePenaltyKick();
      }
      return;
    }

    if (this.state.phase === 'TRY_SCORED') {
      if (this.state.phaseTimer <= 0) {
        this.setupConversion();
      }
      return;
    }

    if (this.state.phase === 'OPEN_PLAY') {
      this.stepOpenPlay(dt);
    }
  }

  private stepOpenPlay(dt: number) {
    const carrier = [...this.homePlayers, ...this.awayPlayers].find(p => p.id === this.ball.carrierId);

    if (!carrier) {
      // Loose ball or transition - pick up ball
      const closestPlayer = this.getClosestPlayer(this.ball.x, this.ball.y);
      if (closestPlayer && Math.hypot(closestPlayer.x - this.ball.x, closestPlayer.y - this.ball.y) < 2.5) {
        this.giveBallToPlayer(closestPlayer);
        this.state.possessionTeam = closestPlayer.team;
      }
      return;
    }

    const attackingHome = carrier.team === 'home';
    const goalLineX = attackingHome ? 100 : 0;
    const direction = attackingHome ? 1 : -1;

    // Check for Try scored
    if ((attackingHome && carrier.x >= 98) || (!attackingHome && carrier.x <= 2)) {
      this.scoreTry(carrier);
      return;
    }

    // Ball carrier movement
    carrier.targetX = carrier.x + (direction * 8);
    // Slight evasion zig-zag
    carrier.targetY = Math.max(10, Math.min(60, carrier.y + (Math.random() * 6 - 3)));
    carrier.stats.metresCarried += (dt * 3.5);

    // Defenders close in
    const defenders = attackingHome ? this.awayPlayers : this.homePlayers;
    const tacklers = defenders.filter(d => d.state !== 'sin_bin');

    let closestDist = 999;
    let primaryTackler: VisualPlayer | null = null;

    tacklers.forEach(d => {
      const dist = Math.hypot(d.x - carrier.x, d.y - carrier.y);
      if (dist < closestDist) {
        closestDist = dist;
        primaryTackler = d;
      }
      // Defensive positioning
      d.targetX = carrier.x + (direction * (2 + Math.random() * 4));
      d.targetY = carrier.y + (Math.random() * 8 - 4);
    });

    // Attacking support runners position in depth behind carrier
    const teammates = (attackingHome ? this.homePlayers : this.awayPlayers).filter(p => p.id !== carrier.id);
    teammates.forEach(p => {
      const depth = direction * (p.number > 8 ? -6 : -3);
      const width = (p.number % 2 === 0 ? 1 : -1) * ((p.number * 2.5) % 18);
      p.targetX = carrier.x + depth;
      p.targetY = Math.max(10, Math.min(60, carrier.y + width));
    });

    // Tackle check
    if (primaryTackler && closestDist < 1.8) {
      this.initiateTackle(carrier, primaryTackler);
      return;
    }

    // Tactical choice: Offload, Pass, or Kick
    if (Math.random() < 0.04) {
      this.attemptPassOrKick(carrier);
    }
  }

  private attemptPassOrKick(carrier: VisualPlayer) {
    const attackingHome = carrier.team === 'home';
    const tactics = attackingHome ? this.homeTactics : this.awayTactics;

    // Check if tactical kick
    const kickChance = tactics.kickFrequency === 'HIGH' ? 0.40 : tactics.kickFrequency === 'MEDIUM' ? 0.20 : 0.08;
    const canKick = carrier.number === 9 || carrier.number === 10 || carrier.number === 15;

    if (canKick && Math.random() < kickChance) {
      this.executeTacticalKick(carrier);
      return;
    }

    // Normal pass to support runner
    const teammates = (attackingHome ? this.homePlayers : this.awayPlayers).filter(p => p.id !== carrier.id && p.state !== 'sin_bin');
    const direction = attackingHome ? 1 : -1;

    // Find legally positioned support behind ball
    const legalReceivers = teammates.filter(p => (attackingHome ? p.x <= carrier.x + 1 : p.x >= carrier.x - 1));

    if (legalReceivers.length > 0) {
      const target = legalReceivers[Math.floor(Math.random() * legalReceivers.length)];
      // Check for knock-on or forward pass
      if (Math.random() < 0.04) {
        this.callScrum(attackingHome ? 'away' : 'home', 'Knock-on in contact!');
        return;
      }

      this.ball.carrierId = null;
      this.ball.state = 'passed';
      this.ball.targetX = target.x;
      this.ball.targetY = target.y;

      setTimeout(() => {
        this.giveBallToPlayer(target);
      }, 350);
    }
  }

  private executeTacticalKick(carrier: VisualPlayer) {
    soundFx.playKick();
    const attackingHome = carrier.team === 'home';
    const direction = attackingHome ? 1 : -1;
    const kickDistance = 25 + Math.random() * 25;
    const targetX = Math.max(5, Math.min(95, carrier.x + (direction * kickDistance)));
    const targetY = Math.random() < 0.5 ? 8 : 62; // Touchline or deep

    this.ball.carrierId = null;
    this.ball.state = 'kicked';
    this.ball.z = 6;
    this.ball.targetX = targetX;
    this.ball.targetY = targetY;

    // 50-22 rule possibility: kicked from own half, bounces into touch in opposition 22
    const insideOwnHalf = attackingHome ? carrier.x < 50 : carrier.x > 50;
    const bouncesInOpp22 = attackingHome ? targetX > 78 : targetX < 22;

    if (insideOwnHalf && bouncesInOpp22 && (targetY <= 5 || targetY >= 65)) {
      this.addEvent('LINE_BREAK', `Sensational 50-22 kick! ${carrier.name} pins the opposition deep! Attacking lineout!`, carrier.team === 'home' ? this.homeClub.id : this.awayClub.id, carrier.id);
      this.callLineout(carrier.team, targetX, targetY <= 5 ? 5 : 65);
      return;
    }

    this.addCommentary(`${carrier.name} puts boot to ball, kicking for territory!`);

    setTimeout(() => {
      // Find who gathers
      const defenders = attackingHome ? this.awayPlayers : this.homePlayers;
      const gatherer = defenders.find(p => p.number === 15) || defenders[0];
      if (gatherer) {
        this.giveBallToPlayer(gatherer);
        this.state.possessionTeam = gatherer.team;
      }
    }, 1100);
  }

  private initiateTackle(carrier: VisualPlayer, tackler: VisualPlayer) {
    soundFx.playTackle();
    tackler.stats.tacklesMade++;

    // High tackle / penalty / card check
    if (Math.random() < 0.05) {
      if (Math.random() < 0.35) {
        // Yellow Card!
        tackler.stats.yellowCard = true;
        tackler.state = 'sin_bin';
        tackler.sinBinTimer = 10;
        this.addEvent('YELLOW_CARD', `Yellow Card! ${tackler.name} sent to the sin bin for a dangerous high tackle! 10 minutes.`, tackler.team === 'home' ? this.homeClub.id : this.awayClub.id, tackler.id);
      } else {
        this.addEvent('PENALTY_CONCEDED', `Penalty awarded for not releasing the tackled player!`, carrier.team === 'home' ? this.homeClub.id : this.awayClub.id);
      }
      this.handlePenaltyAwarded(carrier.team);
      return;
    }

    // Form Ruck
    carrier.state = 'rucking';
    tackler.state = 'rucking';
    this.state.phase = 'RUCK';
    this.state.phaseTimer = 1.4 + Math.random() * 1.8;
    this.state.phaseCount++;

    // Move nearest forwards into ruck contest
    const attTeam = carrier.team === 'home' ? this.homePlayers : this.awayPlayers;
    const defTeam = carrier.team === 'home' ? this.awayPlayers : this.homePlayers;

    attTeam.filter(p => p.number >= 1 && p.number <= 8).slice(0, 3).forEach(f => {
      f.targetX = carrier.x;
      f.targetY = carrier.y + (Math.random() * 2 - 1);
      f.state = 'rucking';
    });

    defTeam.filter(p => p.number >= 1 && p.number <= 8).slice(0, 2).forEach(f => {
      f.targetX = carrier.x + (carrier.team === 'home' ? 1 : -1);
      f.targetY = carrier.y + (Math.random() * 2 - 1);
      f.state = 'rucking';
    });
  }

  private resolveRuck() {
    const attackingHome = this.state.possessionTeam === 'home';
    const tactics = attackingHome ? this.homeTactics : this.awayTactics;

    // Turnover calculation
    const turnoverChance = tactics.breakdownCommitment === 'AGGRESSIVE' ? 0.22 : 0.12;

    if (Math.random() < turnoverChance) {
      // Turnover won!
      const winningTeam = attackingHome ? 'away' : 'home';
      this.state.turnovers[winningTeam]++;
      this.state.possessionTeam = winningTeam;

      const turnoverPlayer = (winningTeam === 'home' ? this.homePlayers : this.awayPlayers).find(p => p.number === 7 || p.number === 6) || this.homePlayers[0];
      turnoverPlayer.stats.turnoversWon++;

      this.addEvent('TURNOVER', `Jackal turnover! Great work on the ground by ${turnoverPlayer.name} to steal the ball!`, winningTeam === 'home' ? this.homeClub.id : this.awayClub.id, turnoverPlayer.id);
      this.giveBallToPlayer(turnoverPlayer);
      this.resetPlayerStates();
      this.state.phase = 'OPEN_PLAY';
    } else {
      // Ball retained, cleared by Scrum-Half (9)
      this.state.rucksWon[attackingHome ? 'home' : 'away']++;
      const sh = (attackingHome ? this.homePlayers : this.awayPlayers).find(p => p.number === 9);
      if (sh) {
        this.giveBallToPlayer(sh);
      }
      this.resetPlayerStates();
      this.state.phase = 'OPEN_PLAY';
    }
  }

  private handlePenaltyAwarded(awardedTo: 'home' | 'away') {
    this.state.possessionTeam = awardedTo;
    const tactics = awardedTo === 'home' ? this.homeTactics : this.awayTactics;
    const isInsideKickingRange = awardedTo === 'home' ? this.ball.x >= 55 : this.ball.x <= 45;

    if (tactics.penaltyChoice === 'POSTS' || (isInsideKickingRange && tactics.penaltyChoice !== 'CORNER_LINEOUT')) {
      // Shot at goal
      this.setupPenaltyKick(awardedTo);
    } else if (tactics.penaltyChoice === 'CORNER_LINEOUT') {
      // Kick to corner
      const touchX = awardedTo === 'home' ? Math.min(95, this.ball.x + 30) : Math.max(5, this.ball.x - 30);
      this.callLineout(awardedTo, touchX, 5);
    } else {
      // Scrum option
      this.callScrum(awardedTo, 'Penalty option - attacking scrum chosen!');
    }
  }

  public callScrum(awardedTo: 'home' | 'away', reason: string) {
    this.state.phase = 'SCRUM';
    this.state.phaseTimer = 2.8;
    this.state.possessionTeam = awardedTo;

    this.addEvent('SCRUM', `${reason} Scrum awarded to ${awardedTo === 'home' ? this.homeClub.shortName : this.awayClub.shortName}.`, awardedTo === 'home' ? this.homeClub.id : this.awayClub.id);

    // Form packs of 8
    const scrumX = Math.max(15, Math.min(85, this.ball.x));
    const scrumY = Math.max(15, Math.min(55, this.ball.y));
    this.ball.x = scrumX;
    this.ball.y = scrumY;

    this.homePlayers.filter(p => p.number <= 8).forEach((p, idx) => {
      p.state = 'scrum';
      p.targetX = scrumX - 1.5 - Math.floor(idx / 3) * 1.5;
      p.targetY = scrumY + (idx % 3 - 1) * 1.5;
    });

    this.awayPlayers.filter(p => p.number <= 8).forEach((p, idx) => {
      p.state = 'scrum';
      p.targetX = scrumX + 1.5 + Math.floor(idx / 3) * 1.5;
      p.targetY = scrumY + (idx % 3 - 1) * 1.5;
    });
  }

  private resolveScrum() {
    const feedTeam = this.state.possessionTeam;
    this.state.scrumsWon[feedTeam]++;

    // Scrum half feeds and clears
    const sh = (feedTeam === 'home' ? this.homePlayers : this.awayPlayers).find(p => p.number === 9) || this.homePlayers[8];
    this.giveBallToPlayer(sh);
    this.resetPlayerStates();
    this.state.phase = 'OPEN_PLAY';
    this.addCommentary(`${sh.name} clears cleanly from the base of the solid scrum!`);
  }

  public callLineout(awardedTo: 'home' | 'away', x: number, y: number) {
    this.state.phase = 'LINEOUT';
    this.state.phaseTimer = 2.5;
    this.state.possessionTeam = awardedTo;
    this.ball.x = x;
    this.ball.y = y;

    this.addEvent('LINEOUT', `Lineout to ${awardedTo === 'home' ? this.homeClub.shortName : this.awayClub.shortName} on the ${Math.round(x)}m mark.`, awardedTo === 'home' ? this.homeClub.id : this.awayClub.id);

    // Form lineout queue
    const hooker = (awardedTo === 'home' ? this.homePlayers : this.awayPlayers).find(p => p.number === 2);
    if (hooker) {
      hooker.targetX = x;
      hooker.targetY = y;
      hooker.state = 'lineout';
    }

    [...this.homePlayers, ...this.awayPlayers].filter(p => [4, 5, 6, 7].includes(p.number)).forEach((p, idx) => {
      p.state = 'lineout';
      p.targetX = x + (idx % 2 === 0 ? 0.5 : -0.5);
      p.targetY = y > 35 ? y - 4 - (idx * 2) : y + 4 + (idx * 2);
    });
  }

  private resolveLineout() {
    const throwTeam = this.state.possessionTeam;
    const lock = (throwTeam === 'home' ? this.homePlayers : this.awayPlayers).find(p => p.number === 5 || p.number === 4) || this.homePlayers[0];

    this.addCommentary(`Great take in the air by ${lock.name} at the front of the lineout!`);
    const sh = (throwTeam === 'home' ? this.homePlayers : this.awayPlayers).find(p => p.number === 9) || this.homePlayers[8];
    this.giveBallToPlayer(sh);
    this.resetPlayerStates();
    this.state.phase = 'OPEN_PLAY';
  }

  private scoreTry(scorer: VisualPlayer) {
    soundFx.playCrowdCheer();
    soundFx.playWhistle('short');

    const isHome = scorer.team === 'home';
    if (isHome) {
      this.state.homeScore += 5;
      this.state.homeTries++;
    } else {
      this.state.awayScore += 5;
      this.state.awayTries++;
    }

    scorer.stats.tries++;
    scorer.stats.rating = Math.min(10.0, scorer.stats.rating + 1.2);
    scorer.state = 'celebrating';

    this.addEvent('TRY', `TRY! ${scorer.name} dives over the line for a sensational try! (5 pts)`, scorer.team === 'home' ? this.homeClub.id : this.awayClub.id, scorer.id);

    this.state.phase = 'TRY_SCORED';
    this.state.phaseTimer = 2.0;
  }

  private setupConversion() {
    this.state.phase = 'CONVERSION';
    this.state.phaseTimer = 3.0;

    const kickerTeam = this.state.possessionTeam;
    const kicker = (kickerTeam === 'home' ? this.homePlayers : this.awayPlayers).find(p => p.number === 10) || this.homePlayers[9];

    // Place tee at suitable distance
    const teeX = kickerTeam === 'home' ? 82 : 18;
    const teeY = 35;
    this.ball = {
      x: teeX,
      y: teeY,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      carrierId: null,
      state: 'placed_for_kick'
    };

    kicker.targetX = kickerTeam === 'home' ? teeX - 3 : teeX + 3;
    kicker.targetY = teeY;
    kicker.state = 'kicking';

    this.addCommentary(`${kicker.name} lines up the conversion kick...`);
  }

  private resolveConversion() {
    soundFx.playKick();
    const kickerTeam = this.state.possessionTeam;
    const kicker = (kickerTeam === 'home' ? this.homePlayers : this.awayPlayers).find(p => p.number === 10) || this.homePlayers[9];

    // Conversion probability based on kicker attribute (typically 75-88%)
    const success = Math.random() < 0.82;

    if (success) {
      soundFx.playCrowdCheer();
      if (kickerTeam === 'home') {
        this.state.homeScore += 2;
      } else {
        this.state.awayScore += 2;
      }
      kicker.stats.conversions++;
      this.addEvent('CONVERSION_SUCCESS', `Conversion is GOOD! Right through the uprights by ${kicker.name}! (+2 pts)`, kickerTeam === 'home' ? this.homeClub.id : this.awayClub.id, kicker.id);
    } else {
      this.addEvent('CONVERSION_MISS', `Conversion missed! The kick drifts wide of the posts.`, kickerTeam === 'home' ? this.homeClub.id : this.awayClub.id, kicker.id);
    }

    // Restart from halfway with non-scoring team kicking off
    this.setupKickoff(kickerTeam === 'home' ? 'away' : 'home');
  }

  private setupPenaltyKick(team: 'home' | 'away') {
    this.state.phase = 'PENALTY_KICK';
    this.state.phaseTimer = 2.8;

    const kicker = (team === 'home' ? this.homePlayers : this.awayPlayers).find(p => p.number === 10) || this.homePlayers[9];
    this.ball.state = 'placed_for_kick';
    kicker.state = 'kicking';
    this.addCommentary(`${kicker.name} steps up to kick the penalty at goal...`);
  }

  private resolvePenaltyKick() {
    soundFx.playKick();
    const kickerTeam = this.state.possessionTeam;
    const kicker = (kickerTeam === 'home' ? this.homePlayers : this.awayPlayers).find(p => p.number === 10) || this.homePlayers[9];
    const success = Math.random() < 0.78;

    if (success) {
      soundFx.playCrowdCheer();
      if (kickerTeam === 'home') {
        this.state.homeScore += 3;
      } else {
        this.state.awayScore += 3;
      }
      kicker.stats.penalties++;
      this.addEvent('PENALTY_GOAL', `PENALTY GOAL! Clean strike by ${kicker.name} sails over the crossbar! (+3 pts)`, kickerTeam === 'home' ? this.homeClub.id : this.awayClub.id, kicker.id);
      this.setupKickoff(kickerTeam === 'home' ? 'away' : 'home');
    } else {
      this.addEvent('PENALTY_MISS', `Penalty missed! Pushed wide left. 22m dropout for defending side.`, kickerTeam === 'home' ? this.homeClub.id : this.awayClub.id, kicker.id);
      this.setupKickoff(kickerTeam === 'home' ? 'away' : 'home');
    }
  }

  private resetPlayerStates() {
    [...this.homePlayers, ...this.awayPlayers].forEach(p => {
      if (p.state !== 'sin_bin') {
        p.state = 'idle';
      }
    });
  }

  private getClosestPlayer(x: number, y: number): VisualPlayer | null {
    let bestDist = 999;
    let chosen: VisualPlayer | null = null;
    [...this.homePlayers, ...this.awayPlayers].forEach(p => {
      if (p.state === 'sin_bin') return;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestDist) {
        bestDist = d;
        chosen = p;
      }
    });
    return chosen;
  }

  private updatePhysics(dt: number) {
    const allPlayers = [...this.homePlayers, ...this.awayPlayers];

    allPlayers.forEach(p => {
      if (p.state === 'sin_bin') {
        p.x = -15; // Off pitch
        p.y = 35;
        return;
      }

      // Smooth steering toward target
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.4) {
        const step = Math.min(dist, p.speed * dt);
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }

      // Constrain within pitch boundaries
      p.x = Math.max(0, Math.min(100, p.x));
      p.y = Math.max(0, Math.min(70, p.y));
    });

    // Ball physics
    if (this.ball.carrierId) {
      const carrier = allPlayers.find(p => p.id === this.ball.carrierId);
      if (carrier) {
        this.ball.x = carrier.x;
        this.ball.y = carrier.y;
        this.ball.z = 0;
      }
    } else if (this.ball.state === 'kicked' || this.ball.state === 'passed') {
      if (this.ball.targetX !== undefined && this.ball.targetY !== undefined) {
        const dx = this.ball.targetX - this.ball.x;
        const dy = this.ball.targetY - this.ball.y;
        const dist = Math.hypot(dx, dy);
        const ballSpeed = this.ball.state === 'kicked' ? 32 : 18;

        if (dist > 0.8) {
          this.ball.x += (dx / dist) * ballSpeed * dt;
          this.ball.y += (dy / dist) * ballSpeed * dt;
          // Arc trajectory for height
          this.ball.z = Math.max(0, Math.sin((1 - dist / 40) * Math.PI) * 7);
        } else {
          this.ball.z = 0;
          this.ball.state = 'loose';
        }
      }
    }
  }

  // Fast forward / instant sim to completion
  public instantSimulateToEnd(): Fixture['result'] {
    while (this.state.matchMinute < 80) {
      // Step chunks of 30 seconds
      this.state.matchMinute += 0.5;

      if (this.state.matchMinute >= 40 && this.state.matchMinute <= 40.5) {
        this.state.phase = 'OPEN_PLAY';
      }

      // Random scoring events in statistical window
      if (Math.random() < 0.045) {
        const homeFavored = this.homeClub.reputation >= this.awayClub.reputation;
        const isHome = Math.random() < (homeFavored ? 0.6 : 0.45);
        const team = isHome ? 'home' : 'away';
        const players = isHome ? this.homePlayers : this.awayPlayers;
        const scorer = players[Math.floor(Math.random() * players.length)];

        if (Math.random() < 0.65) {
          // Try
          if (isHome) {
            this.state.homeScore += 5;
            this.state.homeTries++;
          } else {
            this.state.awayScore += 5;
            this.state.awayTries++;
          }
          scorer.stats.tries++;
          this.addEvent('TRY', `TRY! ${scorer.name} powers across the whitewash!`, isHome ? this.homeClub.id : this.awayClub.id, scorer.id);

          // Conversion
          if (Math.random() < 0.80) {
            const kicker = players.find(p => p.number === 10) || players[0];
            if (isHome) this.state.homeScore += 2;
            else this.state.awayScore += 2;
            kicker.stats.conversions++;
            this.addEvent('CONVERSION_SUCCESS', `Conversion added by ${kicker.name}!`, isHome ? this.homeClub.id : this.awayClub.id, kicker.id);
          }
        } else {
          // Penalty Goal
          const kicker = players.find(p => p.number === 10) || players[0];
          if (isHome) this.state.homeScore += 3;
          else this.state.awayScore += 3;
          kicker.stats.penalties++;
          this.addEvent('PENALTY_GOAL', `Penalty kick successfully slotted by ${kicker.name}!`, isHome ? this.homeClub.id : this.awayClub.id, kicker.id);
        }
      }

      // Unique rivalry events in instant sim
      if (this.state.isRivalryMatch) {
        if (Math.abs(this.state.matchMinute - 24) < 0.3) {
          this.triggerRivalryEvent();
        } else if (Math.abs(this.state.matchMinute - 56) < 0.3) {
          this.triggerRivalryEvent();
        } else if (Math.abs(this.state.matchMinute - 73) < 0.3 && Math.abs(this.state.homeScore - this.state.awayScore) <= 7) {
          this.triggerRivalryEvent();
        }
      }
    }

    this.updateMatchTension();
    this.state.phase = 'FULL_TIME';
    this.state.matchMinute = 80;

    const homeStatsMap: Record<string, InMatchPlayerStats> = {};
    const awayStatsMap: Record<string, InMatchPlayerStats> = {};

    this.homePlayers.forEach(p => {
      homeStatsMap[p.id] = {
        ...p.stats,
        rating: Math.min(10.0, Math.max(5.0, Number((6.2 + Math.random() * 2.2 + (p.stats.tries * 1.0)).toFixed(1))))
      };
    });

    this.awayPlayers.forEach(p => {
      awayStatsMap[p.id] = {
        ...p.stats,
        rating: Math.min(10.0, Math.max(5.0, Number((6.2 + Math.random() * 2.2 + (p.stats.tries * 1.0)).toFixed(1))))
      };
    });

    return {
      homeScore: this.state.homeScore,
      awayScore: this.state.awayScore,
      homeTries: this.state.homeTries,
      awayTries: this.state.awayTries,
      homeConversions: Math.floor((this.state.homeScore - (this.state.homeTries * 5)) / 2),
      awayConversions: Math.floor((this.state.awayScore - (this.state.awayTries * 5)) / 2),
      homePenalties: Math.floor(Math.random() * 3),
      awayPenalties: Math.floor(Math.random() * 3),
      homeDropGoals: 0,
      awayDropGoals: 0,
      homeTryScorers: this.homePlayers.filter(p => p.stats.tries > 0).map(p => p.name),
      awayTryScorers: this.awayPlayers.filter(p => p.stats.tries > 0).map(p => p.name),
      events: this.state.events,
      homePlayerStats: homeStatsMap,
      awayPlayerStats: awayStatsMap
    };
  }

  public cleanup() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
