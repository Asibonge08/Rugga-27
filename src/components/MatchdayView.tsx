import React, { useState, useEffect, useRef } from 'react';
import { RugbyMatchEngine } from '../services/matchEngine';
import { MatchPitchCanvas } from './MatchPitchCanvas';
import { Club, Player, TacticsConfig, Fixture } from '../types/rugby';
import { soundFx } from '../services/soundFx';
import { getRivalry } from '../data/rugbyRivalries';
import {
  Play,
  Pause,
  FastForward,
  SkipForward,
  Volume2,
  VolumeX,
  Shield,
  Users,
  BarChart3,
  ChevronDown,
  CheckCircle2,
  Flame,
  Zap,
  Trophy,
  Swords,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchdayViewProps {
  fixture: Fixture;
  homeClub: Club;
  awayClub: Club;
  homeSquad: Player[];
  awaySquad: Player[];
  userClubId: string;
  userTactics: TacticsConfig;
  userLineup: { startingXV: Record<number, string>; bench: Record<number, string> };
  onFinishMatch: (result: Fixture['result']) => void;
  onExit: () => void;
}

export const MatchdayView: React.FC<MatchdayViewProps> = ({
  fixture,
  homeClub,
  awayClub,
  homeSquad,
  awaySquad,
  userClubId,
  userTactics,
  userLineup,
  onFinishMatch,
  onExit
}) => {
  const [engine, setEngine] = useState<RugbyMatchEngine | null>(null);
  const [matchState, setMatchState] = useState<any>(null);
  const activeRivalry = getRivalry(homeClub.id, awayClub.id);
  const matchTension = matchState?.matchTension ?? (activeRivalry ? 78 : 42);
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMuted());
  const [speed, setSpeed] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'commentary' | 'stats' | 'tactics' | 'subs'>('commentary');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showFullTimeModal, setShowFullTimeModal] = useState<boolean>(false);
  const [finalResult, setFinalResult] = useState<Fixture['result'] | null>(null);
  const commentaryEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize engine once on mount
  useEffect(() => {
    // Generate AI lineup for away or non-user club
    const generateLineup = (squad: Player[]) => {
      const lineup: Record<number, string> = {};
      for (let i = 1; i <= 15; i++) {
        if (squad[i - 1]) lineup[i] = squad[i - 1].id;
      }
      return lineup;
    };

    const homeLineup = homeClub.id === userClubId ? userLineup.startingXV : generateLineup(homeSquad);
    const awayLineup = awayClub.id === userClubId ? userLineup.startingXV : generateLineup(awaySquad);

    const defaultAITactics: TacticsConfig = {
      attackingStyle: 'BALANCED',
      defensiveStyle: 'BLITZ_RUSH',
      penaltyChoice: 'POSTS',
      tempo: 'CONTROLLED',
      kickFrequency: 'MEDIUM',
      breakdownCommitment: 'BALANCED'
    };

    const newEngine = new RugbyMatchEngine(
      homeClub,
      awayClub,
      homeSquad,
      awaySquad,
      homeClub.id === userClubId ? userTactics : defaultAITactics,
      awayClub.id === userClubId ? userTactics : defaultAITactics,
      homeLineup,
      awayLineup
    );

    newEngine.setOnUpdate((eng) => {
      setMatchState({ ...eng.state });
      if (eng.state.phase === 'FULL_TIME' && !showFullTimeModal) {
        handleMatchCompletion(eng);
      }
    });

    setEngine(newEngine);
    setMatchState({ ...newEngine.state });

    // Auto play kickoff after 800ms
    const timer = setTimeout(() => {
      newEngine.play();
    }, 800);

    return () => {
      clearTimeout(timer);
      newEngine.cleanup();
    };
  }, []);

  const handleMatchCompletion = (eng: RugbyMatchEngine) => {
    const res = eng.instantSimulateToEnd();
    setFinalResult(res);
    setShowFullTimeModal(true);

    if (res) {
      const userWon = (homeClub.id === userClubId && res.homeScore > res.awayScore) ||
                       (awayClub.id === userClubId && res.awayScore > res.homeScore);
      if (userWon) {
        soundFx.playCrowdCheer();
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
      }
    }
  };

  const togglePlayPause = () => {
    if (!engine) return;
    if (engine.state.isPaused) {
      engine.play();
    } else {
      engine.pause();
    }
    setMatchState({ ...engine.state });
  };

  const handleSpeedChange = (mult: number) => {
    if (!engine) return;
    engine.setSpeed(mult);
    setSpeed(mult);
    setMatchState({ ...engine.state });
  };

  const handleInstantSim = () => {
    if (!engine) return;
    engine.pause();
    const res = engine.instantSimulateToEnd();
    setFinalResult(res);
    setMatchState({ ...engine.state });
    setShowFullTimeModal(true);
  };

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFx.playClick();
  };

  const handleUpdateInMatchTactics = (style: TacticsConfig['attackingStyle'], def: TacticsConfig['defensiveStyle'], kick: TacticsConfig['kickFrequency']) => {
    if (!engine) return;
    if (homeClub.id === userClubId) {
      engine.homeTactics.attackingStyle = style;
      engine.homeTactics.defensiveStyle = def;
      engine.homeTactics.kickFrequency = kick;
    } else {
      engine.awayTactics.attackingStyle = style;
      engine.awayTactics.defensiveStyle = def;
      engine.awayTactics.kickFrequency = kick;
    }
    soundFx.playClick();
  };

  const handleSubstitutePlayer = (onPitchJersey: number, benchPlayerId: string) => {
    if (!engine) return;
    const isHome = homeClub.id === userClubId;
    const players = isHome ? engine.homePlayers : engine.awayPlayers;
    const squad = isHome ? homeSquad : awaySquad;

    const targetIdx = players.findIndex(p => p.number === onPitchJersey);
    const subPlayer = squad.find(p => p.id === benchPlayerId);

    if (targetIdx !== -1 && subPlayer) {
      const oldPlayerName = players[targetIdx].name;
      players[targetIdx] = {
        id: subPlayer.id,
        name: subPlayer.name,
        number: onPitchJersey,
        team: isHome ? 'home' : 'away',
        x: players[targetIdx].x,
        y: players[targetIdx].y,
        vx: 0,
        vy: 0,
        targetX: players[targetIdx].x,
        targetY: players[targetIdx].y,
        speed: 4.5 + (subPlayer.attributes.speed / 99) * 4.0,
        isCarrier: false,
        state: 'idle',
        stats: {
          playerId: subPlayer.id,
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
      };

      soundFx.playWhistle('short');
      setMatchState({ ...engine.state });
    }
  };

  const userBenchPlayers = (homeClub.id === userClubId ? homeSquad : awaySquad).filter(
    p => Object.values(userLineup.bench).includes(p.id)
  );

  return (
    <div className="space-y-4 pb-12">
      {/* Top Match Scoreboard Banner */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 p-4 sm:p-5 shadow-2xl ${
        activeRivalry ? 'border-2 border-amber-500/50 shadow-amber-950/30' : 'border border-neutral-800'
      }`}>
        {/* Derby Climax Banner if Rivalry */}
        {activeRivalry && (
          <div className="mb-3 -mt-1 -mx-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-950/90 via-amber-950/80 to-red-950/90 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-heading font-black tracking-wider uppercase bg-red-600 text-white flex items-center space-x-1 shadow-sm">
                <Flame className="w-2.5 h-2.5 fill-current animate-pulse" />
                <span>DERBY CLASH</span>
              </span>
              <span className="font-heading font-bold text-amber-300">
                {activeRivalry.name}
              </span>
            </div>
            {activeRivalry.trophyName && (
              <span className="text-[11px] text-amber-300 flex items-center space-x-1 font-medium bg-black/40 px-2 py-0.5 rounded-md border border-amber-500/30">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>{activeRivalry.trophyName}</span>
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 items-center">
          {/* Home Team */}
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl border-2 border-white/20 shadow-md flex items-center justify-center font-heading font-black text-sm sm:text-xl text-white shrink-0"
              style={{ backgroundColor: homeClub.primaryColor }}
            >
              {homeClub.shortName.substring(0, 3).toUpperCase()}
            </div>
            <div>
              <div className="font-heading font-bold text-sm sm:text-lg text-white truncate">{homeClub.name}</div>
              <div className="text-[11px] text-neutral-400 font-mono-numbers">
                Tries: {matchState?.homeTries || 0} {matchState?.homeTries >= 4 ? '⭐ TBP' : ''}
              </div>
            </div>
          </div>

          {/* Central Score & Clock Cluster */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-emerald-400 font-mono-numbers font-bold mb-1 border border-neutral-700">
              {matchState ? `${Math.floor(matchState.matchMinute)}'` : "0'"} · {matchState?.phase.replace('_', ' ')}
            </div>
            <div className="font-heading font-black text-2xl sm:text-4xl text-white tracking-widest font-mono-numbers">
              {matchState?.homeScore ?? 0} - {matchState?.awayScore ?? 0}
            </div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">
              URC Round {fixture.round}
            </span>

            {/* Live Match Tension Bar */}
            <div className="w-full max-w-[190px] mt-2">
              <div className="flex items-center justify-between text-[10px] font-mono-numbers mb-0.5">
                <span className="flex items-center space-x-1 text-neutral-400">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  <span>Tension</span>
                </span>
                <span className={`font-bold ${
                  matchTension >= 85 ? 'text-red-400 animate-pulse' : matchTension >= 65 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {matchTension}% {matchTension >= 85 ? '🔥 Boiling' : matchTension >= 65 ? '⚡ High' : 'Normal'}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${matchTension}%`,
                    backgroundColor: matchTension >= 85 ? '#ef4444' : matchTension >= 65 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-end space-x-3 text-right">
            <div>
              <div className="font-heading font-bold text-sm sm:text-lg text-white truncate">{awayClub.name}</div>
              <div className="text-[11px] text-neutral-400 font-mono-numbers">
                Tries: {matchState?.awayTries || 0} {matchState?.awayTries >= 4 ? '⭐ TBP' : ''}
              </div>
            </div>
            <div
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl border-2 border-white/20 shadow-md flex items-center justify-center font-heading font-black text-sm sm:text-xl text-white shrink-0"
              style={{ backgroundColor: awayClub.primaryColor }}
            >
              {awayClub.shortName.substring(0, 3).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* 2D Canvas Match Pitch Viewport */}
      <div className="relative">
        <MatchPitchCanvas
          engine={engine}
          onSelectPlayer={(pid) => setSelectedPlayerId(pid)}
        />

        {/* Floating Controls Overlay Bar */}
        <div className="absolute top-3 right-3 flex items-center space-x-2 bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800/80 shadow-lg text-xs z-20">
          <button
            onClick={togglePlayPause}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer"
            title="Play / Pause"
          >
            {matchState?.isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-neutral-700" />

          {/* Speed Buttons */}
          <div className="flex space-x-1">
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-0.5 rounded font-mono-numbers text-xs font-bold transition-all cursor-pointer ${
                  speed === s ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-neutral-700" />

          <button
            onClick={handleInstantSim}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-all cursor-pointer flex items-center space-x-1"
            title="Skip to Full-Time"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono-numbers">Sim End</span>
          </button>

          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all cursor-pointer"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Match Control Panels: Commentary, Live Stats, In-Match Tactics, Substitutions */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 overflow-x-auto scrollbar-none text-xs font-semibold">
          <button
            onClick={() => setActiveTab('commentary')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'commentary'
                ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Live Commentary
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Match Statistics
          </button>
          <button
            onClick={() => setActiveTab('tactics')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tactics'
                ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Tactical Adjustments
          </button>
          <button
            onClick={() => setActiveTab('subs')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'subs'
                ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Substitutions Bench
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {/* Commentary Feed */}
          {activeTab === 'commentary' && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {matchState?.commentary?.map((item: string, idx: number) => {
                const isRivalryFlash = item.includes('[DERBY') || item.includes('RIVALRY') || item.includes('FLASHPOINT') || item.includes('[CLUTCH');
                const isTry = item.includes('TRY!');
                const isPenalty = item.includes('PENALTY');
                const isCard = item.includes('Card!') || item.includes('sin bin');
                const isTurnover = item.includes('turnover');

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs leading-relaxed transition-all ${
                      isRivalryFlash
                        ? 'bg-gradient-to-r from-red-950/70 via-amber-950/50 to-neutral-900 border-amber-500/80 text-amber-200 font-semibold shadow-md ring-1 ring-amber-500/30'
                        : isTry
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-semibold shadow-md'
                        : isPenalty
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                        : isCard
                        ? 'bg-yellow-950/40 border-yellow-500/60 text-yellow-300 font-bold'
                        : isTurnover
                        ? 'bg-blue-950/30 border-blue-500/40 text-blue-200'
                        : 'bg-neutral-950/50 border-neutral-800/80 text-neutral-300'
                    }`}
                  >
                    {isRivalryFlash && (
                      <span className="inline-block mr-1 text-red-400 animate-pulse font-bold">⚡</span>
                    )}
                    {item}
                  </div>
                );
              })}
              <div ref={commentaryEndRef} />
            </div>
          )}

          {/* Live Statistics Tab */}
          {activeTab === 'stats' && matchState && (
            <div className="space-y-4 max-w-2xl mx-auto text-xs">
              {/* Possession Bar */}
              <div>
                <div className="flex justify-between mb-1 text-neutral-300 font-mono-numbers">
                  <span>{homeClub.shortName} {matchState.possession.home}%</span>
                  <span className="text-neutral-400 uppercase font-semibold">Possession</span>
                  <span>{matchState.possession.away}% {awayClub.shortName}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${matchState.possession.home}%` }} />
                  <div className="h-full bg-blue-500" style={{ width: `${matchState.possession.away}%` }} />
                </div>
              </div>

              {/* Territory Bar */}
              <div>
                <div className="flex justify-between mb-1 text-neutral-300 font-mono-numbers">
                  <span>{homeClub.shortName} {matchState.territory.home}%</span>
                  <span className="text-neutral-400 uppercase font-semibold">Territory</span>
                  <span>{matchState.territory.away}% {awayClub.shortName}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${matchState.territory.home}%` }} />
                  <div className="h-full bg-blue-500" style={{ width: `${matchState.territory.away}%` }} />
                </div>
              </div>

              {/* Stat Rows */}
              <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-neutral-800 text-center font-mono-numbers">
                <div className="text-left font-bold text-neutral-200">{matchState.rucksWon.home}</div>
                <div className="text-neutral-400 uppercase font-sans text-[11px]">Rucks Won</div>
                <div className="text-right font-bold text-neutral-200">{matchState.rucksWon.away}</div>

                <div className="text-left font-bold text-neutral-200">{matchState.scrumsWon.home}</div>
                <div className="text-neutral-400 uppercase font-sans text-[11px]">Scrums Won</div>
                <div className="text-right font-bold text-neutral-200">{matchState.scrumsWon.away}</div>

                <div className="text-left font-bold text-neutral-200">{matchState.turnovers.home}</div>
                <div className="text-neutral-400 uppercase font-sans text-[11px]">Turnovers Won</div>
                <div className="text-right font-bold text-neutral-200">{matchState.turnovers.away}</div>
              </div>
            </div>
          )}

          {/* In-Match Tactics Tab */}
          {activeTab === 'tactics' && (
            <div className="max-w-2xl mx-auto space-y-4 text-xs">
              <p className="text-neutral-400 mb-2">
                Shift your team’s instructions live to exploit gaps or withstand opposition pressure.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Attacking Pattern
                  </label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 text-xs focus:outline-none focus:border-emerald-500"
                    onChange={(e) => handleUpdateInMatchTactics(e.target.value as any, 'BLITZ_RUSH', 'MEDIUM')}
                  >
                    <option value="BALANCED">Balanced Pattern</option>
                    <option value="WIDE_SPREAD">Wide Rugby (Edge to Edge)</option>
                    <option value="FORWARD_PACK">Forward Pack Pick & Go</option>
                    <option value="TERRITORY_KICK">Territory Kick & Pressure</option>
                    <option value="COUNTER_ATTACK">Counter-Attack from Deep</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Defensive Shape
                  </label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 text-xs focus:outline-none focus:border-emerald-500"
                    onChange={(e) => handleUpdateInMatchTactics('BALANCED', e.target.value as any, 'MEDIUM')}
                  >
                    <option value="BLITZ_RUSH">Blitz / Rush Defence</option>
                    <option value="DRIFT">Drift Defence (Force Touch)</option>
                    <option value="BALANCED_LINE">Balanced Connected Line</option>
                    <option value="HEAVY_BREAKDOWN">Aggressive Jackal Contest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Kicking Ambition
                  </label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 text-xs focus:outline-none focus:border-emerald-500"
                    onChange={(e) => handleUpdateInMatchTactics('BALANCED', 'BLITZ_RUSH', e.target.value as any)}
                  >
                    <option value="MEDIUM">Medium Frequency</option>
                    <option value="HIGH">High (Box Kicks & 50-22s)</option>
                    <option value="LOW">Low (Run Through Hands)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Substitutions Tab */}
          {activeTab === 'subs' && (
            <div className="max-w-2xl mx-auto space-y-3 text-xs">
              <span className="text-neutral-400 block mb-2">
                Deploy your replacements (Jerseys 16–23) to bring on fresh legs and tactical impact.
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {userBenchPlayers.map((benchP, idx) => {
                  const benchJersey = 16 + idx;
                  return (
                    <div
                      key={benchP.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-neutral-800 text-emerald-400 font-bold flex items-center justify-center font-mono-numbers text-[10px]">
                          {benchJersey}
                        </span>
                        <div>
                          <div className="font-semibold text-neutral-200">{benchP.name}</div>
                          <div className="text-[10px] text-neutral-400">{benchP.primaryPosition} · Fit {benchP.fitness}%</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Quick swap into corresponding starting spot
                          const targetJersey = idx < 3 ? (idx + 1) : idx < 5 ? (idx + 2) : 10;
                          handleSubstitutePlayer(targetJersey, benchP.id);
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[10px] cursor-pointer"
                      >
                        Sub In
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Time Match Report Modal */}
      {showFullTimeModal && finalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-100 shadow-2xl animate-in fade-in duration-200">
            <div className="text-center pb-4 border-b border-neutral-800 mb-5">
              <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
                Full Time · Official Match Result
              </div>
              <h2 className="font-heading font-black text-3xl sm:text-4xl text-white font-mono-numbers">
                {finalResult.homeScore} - {finalResult.awayScore}
              </h2>
              <div className="text-sm text-neutral-300 mt-1">
                {homeClub.name} vs {awayClub.name}
              </div>
            </div>

            {/* Try Scorers List */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-4 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
              <div>
                <div className="font-semibold text-emerald-400 mb-1">
                  {homeClub.shortName} Tries ({finalResult.homeTries})
                </div>
                {finalResult.homeTryScorers.length > 0 ? (
                  finalResult.homeTryScorers.map((name, i) => <div key={i} className="text-neutral-300">🏉 {name}</div>)
                ) : (
                  <div className="text-neutral-500">None</div>
                )}
              </div>
              <div>
                <div className="font-semibold text-blue-400 mb-1">
                  {awayClub.shortName} Tries ({finalResult.awayTries})
                </div>
                {finalResult.awayTryScorers.length > 0 ? (
                  finalResult.awayTryScorers.map((name, i) => <div key={i} className="text-neutral-300">🏉 {name}</div>)
                ) : (
                  <div className="text-neutral-500">None</div>
                )}
              </div>
            </div>

            {/* Derby Climax Result Summary */}
            {activeRivalry && (
              <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-red-950/80 via-amber-950/60 to-neutral-900 border border-amber-500/50 text-center">
                <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  <Flame className="w-3.5 h-3.5 fill-current text-red-500" />
                  <span>{activeRivalry.name} Decided</span>
                </div>
                {(() => {
                  const isUserHome = homeClub.id === userClubId;
                  const userScore = isUserHome ? finalResult.homeScore : finalResult.awayScore;
                  const oppScore = isUserHome ? finalResult.awayScore : finalResult.homeScore;
                  const userWon = userScore > oppScore;
                  const isDraw = userScore === oppScore;

                  if (userWon) {
                    return (
                      <div>
                        <div className="font-heading font-black text-sm text-emerald-300">
                          🏆 Derby Glory! Bragging rights secured!
                        </div>
                        <div className="text-xs text-neutral-300 mt-1">
                          Fan Satisfaction <span className="text-emerald-400 font-bold">+20%</span> · Board Trust <span className="text-emerald-400 font-bold">+6%</span>
                          {activeRivalry.trophyName && (
                            <span className="block text-[11px] text-amber-300 font-semibold mt-0.5">
                              {activeRivalry.trophyName} claimed for the trophy cabinet!
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  } else if (isDraw) {
                    return (
                      <div className="text-xs text-neutral-300">
                        <div className="font-heading font-bold text-sm text-amber-300">
                          ⚔️ Stalemate in the Derby
                        </div>
                        <div>A brutal draw between two unrelenting rivals.</div>
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        <div className="font-heading font-black text-sm text-rose-400">
                          💔 Bitter Derby Defeat
                        </div>
                        <div className="text-xs text-neutral-300 mt-1">
                          Fan Satisfaction <span className="text-rose-400 font-bold">-20%</span> · Board Trust <span className="text-rose-400 font-bold">-5%</span>
                          <span className="block text-[11px] text-neutral-400 mt-0.5">
                            Supporters are furious after dropping the derby.
                          </span>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* Finish & Advance Season CTA */}
            <button
              onClick={() => {
                soundFx.playWhistle('long');
                onFinishMatch(finalResult);
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-base tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>RETURN TO CLUB DASHBOARD</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
