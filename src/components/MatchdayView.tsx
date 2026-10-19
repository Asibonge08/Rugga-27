import React, { useState, useEffect, useRef } from 'react';
import { RugbyMatchEngine } from '../services/matchEngine';
import { MatchPitchCanvas } from './MatchPitchCanvas';
import { Club, Player, TacticsConfig, Fixture, PenaltyDecisionOption } from '../types/rugby';
import { soundFx } from '../services/soundFx';
import { getRivalry } from '../data/rugbyRivalries';
import { getPositionShort, JERSEY_TO_POSITION } from '../data/rugbyDatabase';
import { checkPositionalEligibility } from '../services/playerRatingService';
import { SubstitutionService } from '../services/substitutionService';
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
  Heart,
  Target,
  AlertTriangle,
  Activity,
  ArrowRightLeft,
  X,
  Sparkles,
  Clock,
  Compass,
  CornerDownRight,
  RotateCcw
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

  // Interactive Substitution Staging & Swap State
  const [selectedOffJersey, setSelectedOffJersey] = useState<number | null>(null);
  const [selectedBenchPlayerId, setSelectedBenchPlayerId] = useState<string | null>(null);
  const [subToast, setSubToast] = useState<string | null>(null);
  const [injuryBenchPickerOpen, setInjuryBenchPickerOpen] = useState<boolean>(false);
  const [selectedPenaltyKickerId, setSelectedPenaltyKickerId] = useState<string | null>(null);

  // Initialize engine once on mount
  useEffect(() => {
    // Generate legal AI lineup omitting any injured squad members
    const generateLineup = (squad: Player[]) => {
      const healthySquad = squad.filter(p => !p.injury);
      const lineup: Record<number, string> = {};
      for (let i = 1; i <= 15; i++) {
        if (healthySquad[i - 1]) lineup[i] = healthySquad[i - 1].id;
      }
      return lineup;
    };

    // Sanitize user lineup: auto-replace any injured players with healthy reserves
    const sanitizeLineup = (lineup: Record<number, string>, squad: Player[]) => {
      const sanitized = { ...lineup };
      const healthySquad = squad.filter(p => !p.injury);
      const picked = new Set(Object.values(sanitized));

      Object.entries(sanitized).forEach(([jerseyStr, pid]) => {
        const p = squad.find(x => x.id === pid);
        if (p && p.injury) {
          picked.delete(p.id);
          const replacement = healthySquad.find(c => !picked.has(c.id));
          if (replacement) {
            sanitized[Number(jerseyStr)] = replacement.id;
            picked.add(replacement.id);
          }
        }
      });
      return sanitized;
    };

    const homeLineup = homeClub.id === userClubId
      ? sanitizeLineup(userLineup.startingXV, homeSquad)
      : generateLineup(homeSquad);
    const awayLineup = awayClub.id === userClubId
      ? sanitizeLineup(userLineup.startingXV, awaySquad)
      : generateLineup(awaySquad);

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
      awayLineup,
      userClubId
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

  // Stage or apply in-game substitution via engine
  const handleStageSubstitution = (onPitchJersey: number, benchPlayerId: string) => {
    if (!engine) return;
    soundFx.playClick();
    const res = engine.stageSubstitution(onPitchJersey, benchPlayerId);
    setSubToast(res.message);
    setSelectedOffJersey(null);
    setSelectedBenchPlayerId(null);
    setMatchState({ ...engine.state });
    setTimeout(() => setSubToast(null), 4000);
  };

  const handleCancelQueuedSub = (subId: string) => {
    if (!engine) return;
    soundFx.playClick();
    engine.cancelQueuedSubstitution(subId);
    setMatchState({ ...engine.state });
  };

  const isHome = homeClub.id === userClubId;
  const userPitchPlayers = engine ? (isHome ? engine.homePlayers : engine.awayPlayers) : [];
  const userFullSquad = isHome ? homeSquad : awaySquad;
  const userBenchPlayers = userFullSquad.filter(
    p => Object.values(userLineup.bench).includes(p.id)
  );

  const activeOnPitchIds = userPitchPlayers.map(p => p.id);
  const queuedSubstitutions = matchState?.queuedSubstitutions || [];
  const pendingPenaltyDecision = matchState?.pendingPenaltyDecision;
  const pendingLiveInjury = matchState?.pendingLiveInjury;
  const subsUsed = matchState?.substitutionsUsedCount ?? 0;

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification for Substitution Actions */}
      {subToast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-950 border border-emerald-500/80 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl animate-in fade-in flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{subToast}</span>
        </div>
      )}

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
              URC Round {fixture.round} · Substitutions ({subsUsed}/8)
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

      {/* STOPPAGE-BASED SUBSTITUTION STAGING BANNER */}
      {queuedSubstitutions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/90 via-neutral-900 to-amber-950/90 border border-amber-500/70 p-3 sm:p-3.5 rounded-2xl shadow-xl animate-in fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-amber-300 block">
                📋 Queued Substitution{queuedSubstitutions.length > 1 ? 's' : ''} (Coming on at next stoppage)
              </span>
              <div className="flex flex-wrap gap-2 text-xs text-neutral-200 mt-1">
                {queuedSubstitutions.map(sub => (
                  <span key={sub.id} className="bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center space-x-2">
                    <span className="font-semibold text-emerald-300">{sub.onPlayerName}</span>
                    <span className="text-neutral-400">for</span>
                    <span className="text-neutral-300 font-medium">#{sub.onPitchJersey} {sub.offPlayerName}</span>
                    <button
                      onClick={() => handleCancelQueuedSub(sub.id)}
                      className="ml-1 text-red-400 hover:text-red-300 font-bold text-[10px] uppercase underline cursor-pointer"
                      title="Cancel pending substitution"
                    >
                      Cancel
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="text-[11px] text-neutral-400 sm:text-right shrink-0">
            Applied at lineout, scrum, penalty, or try restart
          </span>
        </div>
      )}

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
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'subs'
                ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Substitutions ({subsUsed}/8)</span>
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

          {/* INTERACTIVE BENCH-TO-PITCH SUBSTITUTIONS TAB */}
          {activeTab === 'subs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800 text-xs">
                <div>
                  <span className="font-heading font-bold text-white text-sm">
                    Interactive Matchday Bench & Tactical Swaps
                  </span>
                  <p className="text-neutral-400 text-[11px]">
                    Tap an on-field player to take off, then pick a compatible bench player to come on.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 font-mono-numbers text-neutral-300 font-bold">
                  Replacements Used: <strong className="text-emerald-400">{subsUsed}/8</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. ON PITCH STARTING PLAYERS (TAP TO TAKE OFF) */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                    <span>1. Active Starting XV (On Field)</span>
                    <span className="text-[10px] text-neutral-500">Tap to select off-player</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {userPitchPlayers.map(p => {
                      const isSelected = selectedOffJersey === p.number;
                      const energy = p.energy || 95;
                      const fatigue = p.stats.tacklesMade * 2 + p.stats.carries * 2;
                      const isStruggling = p.strugglingPlayingOn || p.isInjuredInMatch;

                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedOffJersey(isSelected ? null : p.number);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-amber-500 bg-amber-950/60 ring-2 ring-amber-500 text-white'
                              : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700 text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center font-heading font-black text-[11px] text-white">
                                {p.number}
                              </span>
                              <div>
                                <div className="font-heading font-bold text-xs truncate max-w-[130px]">{p.name}</div>
                                <div className="text-[10px] text-neutral-400">
                                  {getPositionShort(p.primaryPosition)} · OVR {p.effectiveOverall}
                                </div>
                              </div>
                            </div>
                            {isSelected ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-heading font-black">
                                TAKE OFF
                              </span>
                            ) : isStruggling ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-bold animate-pulse">
                                INJURED
                              </span>
                            ) : null}
                          </div>

                          {/* Dynamic Energy Bar */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[9px] font-mono-numbers">
                              <span className="text-neutral-400">Energy</span>
                              <span className={energy > 65 ? 'text-emerald-400' : energy > 35 ? 'text-amber-400' : 'text-red-400'}>
                                {Math.round(energy)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  energy > 65 ? 'bg-emerald-500' : energy > 35 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${energy}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. AVAILABLE BENCH PLAYERS (16–23) */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                    <span>2. Available Bench Replacements (16–23)</span>
                    <span className="text-[10px] text-neutral-500">
                      {selectedOffJersey ? `Replacing #${selectedOffJersey}` : 'Select player above first'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {userBenchPlayers.map((benchP, idx) => {
                      const benchJersey = 16 + idx;
                      const isAlreadyOnPitch = activeOnPitchIds.includes(benchP.id);
                      const targetPos = selectedOffJersey ? JERSEY_TO_POSITION[selectedOffJersey] : undefined;
                      const eligibility = targetPos ? checkPositionalEligibility(benchP, targetPos) : null;
                      const isSelected = selectedBenchPlayerId === benchP.id;

                      let compatibilityBadge = 'BENCH RESERVE';
                      let badgeColor = 'bg-neutral-800 text-neutral-300';

                      if (eligibility) {
                        if (eligibility.isPrimary) {
                          compatibilityBadge = `BENCH – CAN PLAY ${getPositionShort(targetPos)}`;
                          badgeColor = 'bg-emerald-950 text-emerald-300 border border-emerald-500/50';
                        } else if (eligibility.isSecondary) {
                          compatibilityBadge = `BENCH – SECONDARY ${getPositionShort(targetPos)}`;
                          badgeColor = 'bg-teal-950 text-teal-300 border border-teal-500/50';
                        } else if (eligibility.isHybrid) {
                          compatibilityBadge = 'APPROVED HYBRID COVER';
                          badgeColor = 'bg-amber-950 text-amber-300 border border-amber-500/50';
                        } else if (eligibility.eligible) {
                          compatibilityBadge = 'EMERGENCY COVER';
                          badgeColor = 'bg-yellow-950 text-yellow-300 border border-yellow-500/50';
                        } else {
                          compatibilityBadge = 'OUT OF POSITION';
                          badgeColor = 'bg-red-950 text-red-300 border border-red-700';
                        }
                      }

                      return (
                        <div
                          key={benchP.id}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-950/50 ring-2 ring-emerald-500'
                              : isAlreadyOnPitch
                              ? 'border-neutral-800 bg-neutral-950/40 opacity-50'
                              : 'border-neutral-800 bg-neutral-950/80 hover:border-neutral-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="w-5 h-5 rounded-full bg-neutral-800 text-emerald-400 font-bold flex items-center justify-center font-mono-numbers text-[10px]">
                                  {benchJersey}
                                </span>
                                <div>
                                  <div className="font-heading font-bold text-xs text-white truncate max-w-[130px]">
                                    {benchP.name}
                                  </div>
                                  <div className="text-[10px] text-neutral-400">
                                    {getPositionShort(benchP.primaryPosition)} · OVR {benchP.overall} · Fit {benchP.fitness}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Position Compatibility Tag */}
                            {selectedOffJersey && (
                              <div className="mt-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide inline-block ${badgeColor}`}>
                                  {compatibilityBadge}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            disabled={isAlreadyOnPitch || subsUsed >= 8 || !selectedOffJersey}
                            onClick={() => {
                              if (!selectedOffJersey) return;
                              handleStageSubstitution(selectedOffJersey, benchP.id);
                            }}
                            className={`w-full mt-2 py-1.5 px-2 rounded-lg font-heading font-black text-[11px] tracking-wide flex items-center justify-center space-x-1 transition-all ${
                              isAlreadyOnPitch || subsUsed >= 8 || !selectedOffJersey
                                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md'
                            }`}
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>
                              {selectedOffJersey ? `Sub on for #${selectedOffJersey}` : 'Select Player to Take Off'}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIVE MID-MATCH INJURY PROMPTS MODAL */}
      {pendingLiveInjury && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-neutral-900 border-2 border-red-500/80 rounded-2xl p-6 text-neutral-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 pb-3 border-b border-neutral-800 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-heading font-black uppercase tracking-wider text-red-400 block">
                  🚨 Mid-Match Medical Alert
                </span>
                <h3 className="font-heading font-bold text-lg text-white">
                  Player Injury Sustained in Collision
                </h3>
              </div>
            </div>

            {/* Injured Player Card */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 mb-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-heading font-bold text-sm text-white">
                    #{pendingLiveInjury.jerseyNumber} {pendingLiveInjury.injuredPlayerName}
                  </div>
                  <div className="text-neutral-400 text-[11px] mt-0.5">
                    Assessed: <strong className="text-red-400">{pendingLiveInjury.injuryName}</strong> ({pendingLiveInjury.severity} severity)
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-700 font-mono-numbers font-bold text-[10px]">
                  Out ~{pendingLiveInjury.durationWeeks} wks
                </span>
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                {pendingLiveInjury.description}
              </p>
            </div>

            {/* Bench Selector if user chooses someone else */}
            {injuryBenchPickerOpen ? (
              <div className="space-y-2 mb-4">
                <div className="text-xs font-semibold text-neutral-300 flex justify-between">
                  <span>Select Replacement from Bench:</span>
                  <button
                    onClick={() => setInjuryBenchPickerOpen(false)}
                    className="text-neutral-400 hover:text-white underline text-[10px] cursor-pointer"
                  >
                    Back
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {userBenchPlayers
                    .filter(b => !activeOnPitchIds.includes(b.id) && !b.injury)
                    .map(b => (
                      <button
                        key={b.id}
                        onClick={() => {
                          engine?.resolveLiveInjuryDecision('SUB_BENCH', b.id);
                          setInjuryBenchPickerOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500 text-left cursor-pointer transition-all text-xs"
                      >
                        <div className="font-bold text-white">{b.name}</div>
                        <div className="text-[10px] text-neutral-400">
                          {getPositionShort(b.primaryPosition)} · OVR {b.overall}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              /* Three Action Controls */
              <div className="space-y-2.5">
                {pendingLiveInjury.recommendedSub ? (
                  <button
                    onClick={() => engine?.resolveLiveInjuryDecision('SUB_RECOMMENDED')}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Bring on {pendingLiveInjury.recommendedSub.name} ({getPositionShort(pendingLiveInjury.recommendedSub.position as any)} · OVR {pendingLiveInjury.recommendedSub.overall})
                    </span>
                  </button>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInjuryBenchPickerOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-heading font-bold text-xs tracking-wider cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Choose someone else</span>
                  </button>

                  <button
                    onClick={() => engine?.resolveLiveInjuryDecision('PLAY_ON')}
                    className="py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-700/60 font-heading font-bold text-xs tracking-wider cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Play on (Reduced pace)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INTERACTIVE PENALTY DECISIONS MODAL */}
      {pendingPenaltyDecision && pendingPenaltyDecision.isUserTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-xl bg-neutral-900 border-2 border-amber-500/80 rounded-2xl p-6 text-neutral-100 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-heading font-black uppercase tracking-wider text-amber-400 block">
                    🚨 PENALTY AWARDED
                  </span>
                  <h3 className="font-heading font-bold text-lg text-white">
                    Coach’s Restart Decision
                  </h3>
                </div>
              </div>

              {/* Auto for this match toggle */}
              <button
                onClick={() => {
                  if (engine) {
                    engine.state.autoDecidePenalties = true;
                    engine.executePenaltyDecision(pendingPenaltyDecision.recommendedChoice);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1"
                title="Automatically decide all penalties for the remainder of this match"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Auto for this match</span>
              </button>
            </div>

            {/* Position & Distance Context */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 mb-4 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-neutral-400">Mark:</span>{' '}
                <strong className="text-white">{pendingPenaltyDecision.distanceToPostsMetres}m to posts</strong> ·{' '}
                <span className="text-amber-400 font-semibold">{pendingPenaltyDecision.angleDescription}</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                {pendingPenaltyDecision.reason}
              </div>
            </div>

            {/* Kicker Selector for Posts Option */}
            {(() => {
              const activeKicker = pendingPenaltyDecision.availableKickers.find(
                k => k.playerId === (selectedPenaltyKickerId || pendingPenaltyDecision.availableKickers[0]?.playerId)
              ) || pendingPenaltyDecision.availableKickers[0];

              return (
                <div className="space-y-3">
                  {/* Option 1: Take the points (Kick for goal) */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 hover:border-emerald-500/50 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-heading font-black text-sm text-white flex items-center space-x-1.5">
                          <span>1. Take the points (Kick for Goal)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            3 points · {activeKicker?.successChance}% chance
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Kicker: #{activeKicker?.number} {activeKicker?.name} (Kicking {activeKicker?.kickingAttr} · Morale {activeKicker?.morale}%)
                        </div>
                      </div>

                      {/* Switch kicker candidates dropdown */}
                      {pendingPenaltyDecision.availableKickers.length > 1 && (
                        <select
                          value={activeKicker?.playerId}
                          onChange={(e) => setSelectedPenaltyKickerId(e.target.value)}
                          className="bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded-lg p-1.5 focus:outline-none focus:border-emerald-500"
                        >
                          {pendingPenaltyDecision.availableKickers.map(k => (
                            <option key={k.playerId} value={k.playerId}>
                              #{k.number} {k.name} ({k.successChance}%)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <button
                      onClick={() => engine?.executePenaltyDecision('POSTS', activeKicker?.playerId)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Target className="w-4 h-4" />
                      <span>Kick for Goal ({activeKicker?.successChance}% Success Probability)</span>
                    </button>
                  </div>

                  {/* 3 Other Tactical Choices in Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Option 2: Kick to corner */}
                    <button
                      onClick={() => engine?.executePenaltyDecision('CORNER_LINEOUT')}
                      className="p-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-amber-500 hover:bg-neutral-900 text-left cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-heading font-black text-xs text-white">2. Kick to Corner</div>
                        <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
                          Boot penalty into touch for 5m attacking lineout & maul.
                        </p>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold mt-2 flex items-center space-x-0.5">
                        <span>Target 7 Points</span>
                        <ChevronDown className="w-3 h-3 -rotate-90" />
                      </span>
                    </button>

                    {/* Option 3: Quick tap */}
                    <button
                      onClick={() => engine?.executePenaltyDecision('TAP_AND_GO')}
                      className="p-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-amber-500 hover:bg-neutral-900 text-left cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-heading font-black text-xs text-white">3. Quick Tap & Go</div>
                        <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
                          Play fast · defence forced back 10m.
                        </p>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold mt-2 flex items-center space-x-0.5">
                        <span>Fast Attack</span>
                        <Zap className="w-3 h-3 fill-current" />
                      </span>
                    </button>

                    {/* Option 4: Scrum */}
                    <button
                      onClick={() => engine?.executePenaltyDecision('SCRUM')}
                      className="p-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-amber-500 hover:bg-neutral-900 text-left cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-heading font-black text-xs text-white">4. Attacking Scrum</div>
                        <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
                          Back your forward pack to push for pushover try or penalty try.
                        </p>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold mt-2 flex items-center space-x-0.5">
                        <span>Back Your Pack</span>
                        <Shield className="w-3 h-3" />
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

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
