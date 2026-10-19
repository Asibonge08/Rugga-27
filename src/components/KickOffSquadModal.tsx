import React, { useState, useEffect } from 'react';
import { Club, Player, RugbyPosition, TacticsConfig, FORWARD_POSITIONS, BACK_POSITIONS, getRugbyUnit, isFrontRow } from '../types/rugby';
import { POSITIONS_ORDER, getPositionName, getPositionShort } from '../data/rugbyDatabase';
import { checkPositionalEligibility } from '../services/playerRatingService';
import { getRivalry } from '../data/rugbyRivalries';
import { soundFx } from '../services/soundFx';
import {
  Play,
  X,
  Shield,
  Zap,
  Users,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronRight,
  HelpCircle,
  Trophy,
  Dices,
  Info
} from 'lucide-react';

const JERSEY_TO_POSITION: Record<number, RugbyPosition> = {
  1: 'LH_PROP',
  2: 'HOOKER',
  3: 'TH_PROP',
  4: 'LOCK_4',
  5: 'LOCK_5',
  6: 'BLINDSIDE_FLANKER',
  7: 'OPENSIDE_FLANKER',
  8: 'NUMBER_8',
  9: 'SCRUM_HALF',
  10: 'FLY_HALF',
  11: 'LEFT_WING',
  12: 'INSIDE_CENTRE',
  13: 'OUTSIDE_CENTRE',
  14: 'RIGHT_WING',
  15: 'FULLBACK'
};

interface KickOffSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeClub: Club;
  awayClub: Club;
  userClubId: string;
  allPlayers: Player[];
  onStartMatch: (
    lineup: { startingXV: Record<number, string>; bench: Record<number, string> },
    tactics: TacticsConfig
  ) => void;
}

export const KickOffSquadModal: React.FC<KickOffSquadModalProps> = ({
  isOpen,
  onClose,
  homeClub,
  awayClub,
  userClubId,
  allPlayers,
  onStartMatch
}) => {
  const userClub = userClubId === homeClub.id ? homeClub : awayClub;
  const opponentClub = userClubId === homeClub.id ? awayClub : homeClub;
  const activeRivalry = getRivalry(homeClub.id, awayClub.id);

  const clubPlayers = allPlayers.filter(p => p.clubId === userClub.id);
  const opponentPlayers = allPlayers.filter(p => p.clubId === opponentClub.id);

  const [activeTab, setActiveTab] = useState<'squad' | 'tactics' | 'opponent'>('squad');
  const [startingXV, setStartingXV] = useState<Record<number, string>>({});
  const [bench, setBench] = useState<Record<number, string>>({});
  const [swapTargetJersey, setSwapTargetJersey] = useState<number | null>(null);
  const [swapNotice, setSwapNotice] = useState<string | null>(null);

  // Match Tactics
  const [tactics, setTactics] = useState<TacticsConfig>({
    attackingStyle: 'BALANCED',
    defensiveStyle: 'BLITZ_RUSH',
    penaltyChoice: 'POSTS',
    tempo: 'HIGH_TEMPO',
    kickFrequency: 'MEDIUM',
    breakdownCommitment: 'BALANCED'
  });

  // Auto-pick optimal lineup
  const autoPickLineup = () => {
    soundFx.playClick();
    const newStarting: Record<number, string> = {};
    const newBench: Record<number, string> = {};
    const usedIds = new Set<string>();

    // Step 1: Assign top specialists for Jerseys 1 to 15
    POSITIONS_ORDER.forEach((pos, idx) => {
      const jersey = idx + 1;
      const matching = clubPlayers
        .filter(p => !usedIds.has(p.id) && p.primaryPosition === pos)
        .sort((a, b) => b.overall - a.overall);

      if (matching.length > 0) {
        newStarting[jersey] = matching[0].id;
        usedIds.add(matching[0].id);
      } else {
        // Fallback: check secondary or same unit
        const fallback = clubPlayers
          .filter(p => !usedIds.has(p.id))
          .sort((a, b) => {
            const elA = checkPositionalEligibility(a, pos);
            const elB = checkPositionalEligibility(b, pos);
            if (elA.eligible && !elB.eligible) return -1;
            if (!elA.eligible && elB.eligible) return 1;
            return b.overall - a.overall;
          });
        if (fallback[0]) {
          newStarting[jersey] = fallback[0].id;
          usedIds.add(fallback[0].id);
        }
      }
    });

    // Step 2: Assign Bench 16-23 (8 legal substitutions)
    const remaining = clubPlayers
      .filter(p => !usedIds.has(p.id))
      .sort((a, b) => b.overall - a.overall);

    for (let bJersey = 16; bJersey <= 23; bJersey++) {
      const player = remaining[bJersey - 16];
      if (player) {
        newBench[bJersey] = player.id;
        usedIds.add(player.id);
      }
    }

    setStartingXV(newStarting);
    setBench(newBench);
    setSwapNotice('✓ Lineup auto-picked with optimal position specialists');
    setTimeout(() => setSwapNotice(null), 3000);
  };

  // Initialize optimal lineup on first open or club change
  useEffect(() => {
    if (clubPlayers.length > 0) {
      autoPickLineup();
    }
  }, [userClub.id]);

  if (!isOpen) return null;

  // Formation coordinates on 2D visual board (x% from 0 to 100, y% from 0 to 100)
  const pitchPositions: { jersey: number; role: string; x: number; y: number }[] = [
    // Front Row
    { jersey: 1, role: 'Loosehead Prop', x: 26, y: 78 },
    { jersey: 2, role: 'Hooker', x: 50, y: 80 },
    { jersey: 3, role: 'Tighthead Prop', x: 74, y: 78 },
    // Second Row (Locks)
    { jersey: 4, role: 'Lock (4)', x: 36, y: 65 },
    { jersey: 5, role: 'Lock (5)', x: 64, y: 65 },
    // Back Row (Flankers & No.8)
    { jersey: 6, role: 'Blindside Flanker', x: 20, y: 52 },
    { jersey: 8, role: 'Number 8', x: 50, y: 52 },
    { jersey: 7, role: 'Openside Flanker', x: 80, y: 52 },
    // Halfbacks
    { jersey: 9, role: 'Scrum-Half', x: 38, y: 38 },
    { jersey: 10, role: 'Fly-Half', x: 62, y: 38 },
    // Three-quarters (Centres & Wings)
    { jersey: 11, role: 'Left Wing', x: 14, y: 24 },
    { jersey: 12, role: 'Inside Centre', x: 40, y: 24 },
    { jersey: 13, role: 'Outside Centre', x: 60, y: 24 },
    { jersey: 14, role: 'Right Wing', x: 86, y: 24 },
    // Fullback
    { jersey: 15, role: 'Fullback', x: 50, y: 10 }
  ];

  // Handle swapping player into selected jersey
  const handleSwapPlayer = (newPlayerId: string) => {
    if (swapTargetJersey === null) return;
    const newPlayer = clubPlayers.find(p => p.id === newPlayerId);
    if (!newPlayer) return;

    // Check legality if Starting XV
    if (swapTargetJersey <= 15) {
      const targetPos = JERSEY_TO_POSITION[swapTargetJersey];
      const eligibility = checkPositionalEligibility(newPlayer, targetPos);
      if (!eligibility.eligible) {
        soundFx.playWhistle('short');
        setSwapNotice(eligibility.reason || 'World Rugby Positional Law prohibits this selection.');
        return;
      }
    }

    soundFx.playWhistle('short');

    const newStarting = { ...startingXV };
    const newBench = { ...bench };

    if (swapTargetJersey <= 15) {
      const oldPlayerId = newStarting[swapTargetJersey];
      newStarting[swapTargetJersey] = newPlayerId;

      // Swap if already on bench
      Object.keys(newBench).forEach(k => {
        if (newBench[Number(k)] === newPlayerId && oldPlayerId) {
          newBench[Number(k)] = oldPlayerId;
        }
      });
      // Swap if already in another starting spot
      Object.keys(newStarting).forEach(k => {
        const jNum = Number(k);
        if (jNum !== swapTargetJersey && newStarting[jNum] === newPlayerId && oldPlayerId) {
          newStarting[jNum] = oldPlayerId;
        }
      });
    } else {
      newBench[swapTargetJersey] = newPlayerId;
    }

    setStartingXV(newStarting);
    setBench(newBench);
    setSwapTargetJersey(null);
    setSwapNotice(null);
  };

  // Average starting XV rating
  const startingPlayers = Object.values(startingXV)
    .map(id => clubPlayers.find(p => p.id === id))
    .filter(Boolean) as Player[];
  const avgOvr = startingPlayers.length > 0
    ? (startingPlayers.reduce((sum, p) => sum + p.overall, 0) / startingPlayers.length).toFixed(1)
    : '0';

  const handleLaunch = () => {
    soundFx.playWhistle('long');
    onStartMatch({ startingXV, bench }, tactics);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-6 text-neutral-100 shadow-2xl flex flex-col my-auto max-h-[96vh]">
        {/* Matchup Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-heading font-black text-white text-xs border border-white/20 shadow-md"
              style={{ backgroundColor: userClub.primaryColor }}
            >
              {userClub.shortName}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading font-black text-base text-white">{userClub.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  TEAM SELECTION
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center space-x-2">
                <span>vs {opponentClub.name}</span>
                <span>·</span>
                <span className="text-amber-400 font-mono-numbers font-bold">Starting XV OVR: {avgOvr}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Cancel & Back"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rivalry Banner if active */}
        {activeRivalry && (
          <div className="mb-3 p-2 px-3 rounded-xl bg-gradient-to-r from-red-950/80 via-amber-950/70 to-neutral-950 border border-amber-500/40 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="font-heading font-bold text-amber-300">{activeRivalry.name}</span>
              {activeRivalry.trophyName && (
                <span className="text-amber-200 text-[10px]">({activeRivalry.trophyName})</span>
              )}
            </div>
            <span className="text-[10px] text-neutral-400">Heated Rivalry Match</span>
          </div>
        )}

        {/* Notice Toast */}
        {swapNotice && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs flex items-center space-x-2 animate-in fade-in shrink-0">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{swapNotice}</span>
          </div>
        )}

        {/* View Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-1 rounded-2xl border border-neutral-800 mb-3 shrink-0">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('squad');
            }}
            className={`py-2 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'squad'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Starting XV & Subs</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('tactics');
            }}
            className={`py-2 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'tactics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Match Tactics</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('opponent');
            }}
            className={`py-2 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'opponent'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Opponent ({opponentClub.shortName})</span>
          </button>
        </div>

        {/* TAB 1: SQUAD SELECTION & PITCH */}
        {activeTab === 'squad' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-y-auto pr-1 flex-1 min-h-0">
            {/* Visual Pitch */}
            <div className="lg:col-span-2 relative aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden border border-emerald-950 bg-gradient-to-b from-emerald-950/80 via-neutral-950 to-neutral-950 p-3 shadow-inner">
              {/* Pitch Markings */}
              <div className="absolute inset-0 border-2 border-white/20 m-3 rounded-xl pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
                <div className="absolute top-[25%] left-0 right-0 h-px border-b border-dashed border-white/15" />
                <div className="absolute top-[75%] left-0 right-0 h-px border-b border-dashed border-white/15" />
              </div>

              {/* 15 Positions */}
              {pitchPositions.map(pos => {
                const pid = startingXV[pos.jersey];
                const player = clubPlayers.find(p => p.id === pid);
                const isSelected = swapTargetJersey === pos.jersey;

                return (
                  <div
                    key={pos.jersey}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onClick={() => {
                      soundFx.playClick();
                      setSwapTargetJersey(pos.jersey);
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group transition-transform hover:scale-105 z-10"
                  >
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center font-heading font-black text-xs sm:text-sm text-white shadow-lg transition-all ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-500/30 ring-4 ring-yellow-400/50 scale-110'
                          : player
                          ? 'border-white/40 bg-emerald-700/90 hover:border-emerald-400'
                          : 'border-dashed border-neutral-600 bg-neutral-900/80 text-neutral-500'
                      }`}
                    >
                      {pos.jersey}
                    </div>
                    <div className="mt-0.5 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-neutral-800 text-[9px] font-semibold text-neutral-200 truncate max-w-[85px] sm:max-w-[105px] text-center shadow-md">
                      {player ? player.name.split(' ').pop() : 'Empty'}
                    </div>
                    {player && (
                      <div className="text-[8px] font-mono-numbers text-emerald-400 font-bold">
                        OVR {player.overall}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bench Replacements (16 to 23) */}
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-400">
                    Bench Substitutes (16–23)
                  </span>
                  <span className="text-[10px] text-neutral-400">8 Subs</span>
                </div>

                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {[16, 17, 18, 19, 20, 21, 22, 23].map(bJersey => {
                    const pid = bench[bJersey];
                    const player = clubPlayers.find(p => p.id === pid);
                    const isSelected = swapTargetJersey === bJersey;

                    return (
                      <div
                        key={bJersey}
                        onClick={() => {
                          soundFx.playClick();
                          setSwapTargetJersey(bJersey);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-yellow-400 bg-yellow-500/20'
                            : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-neutral-800 text-neutral-300 font-heading font-black text-[11px] flex items-center justify-center">
                            #{bJersey}
                          </span>
                          <div>
                            <div className="font-semibold text-white truncate max-w-[120px]">
                              {player ? player.name : 'Empty Bench Spot'}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {player ? getPositionShort(player.primaryPosition) : 'Tap to assign'}
                            </div>
                          </div>
                        </div>

                        {player && (
                          <div className="text-right">
                            <span className="text-xs font-mono-numbers text-emerald-400 font-bold">
                              {player.overall}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instructions */}
              <div className="pt-2 text-[10px] text-neutral-400 border-t border-neutral-800/80">
                Tap any starting jersey (1–15) or bench spot to replace or swap players.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATCH TACTICS */}
        {activeTab === 'tactics' && (
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Attacking Philosophy</label>
                <select
                  value={tactics.attackingStyle}
                  onChange={(e) => setTactics({ ...tactics, attackingStyle: e.target.value as any })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="BALANCED">Balanced Distribution (Mix of crash balls & backline width)</option>
                  <option value="WIDE_SPREAD">Expansive / Wide Spread (Fast hands to wingers)</option>
                  <option value="FORWARD_PACK">Forward Pack Domination (Pick-and-drive & rolling mauls)</option>
                  <option value="TERRITORY_KICK">Territory Kicking & Pressure (50:22 & contestable kicks)</option>
                  <option value="COUNTER_ATTACK">Counter-Attack (Dynamic returns from deep)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Defensive Structure</label>
                <select
                  value={tactics.defensiveStyle}
                  onChange={(e) => setTactics({ ...tactics, defensiveStyle: e.target.value as any })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="BLITZ_RUSH">Blitz / Rush Defence (Aggressive line-speed to stifle playmakers)</option>
                  <option value="DRIFT">Drift Defence (Push attackers towards touchline)</option>
                  <option value="BALANCED_LINE">Balanced Discipline (Hold midfield shape)</option>
                  <option value="HEAVY_BREAKDOWN">Heavy Breakdown Contest (Hunt jackal turnovers)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Penalty Decisions</label>
                <select
                  value={tactics.penaltyChoice}
                  onChange={(e) => setTactics({ ...tactics, penaltyChoice: e.target.value as any })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="POSTS">Take the 3 Points (Kick for goal whenever in range)</option>
                  <option value="CORNER_LINEOUT">Kick to Touch / Corner Lineout (Maul for tries)</option>
                  <option value="SCRUM">Pack Down a Scrum (Set piece dominance)</option>
                  <option value="TAP_AND_GO">Quick Tap & Go (High tempo assault)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Match Tempo</label>
                <select
                  value={tactics.tempo}
                  onChange={(e) => setTactics({ ...tactics, tempo: e.target.value as any })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="HIGH_TEMPO">High Tempo (Quick clearing ball, fast recycling)</option>
                  <option value="CONTROLLED">Controlled & Measured (Set piece management)</option>
                  <option value="SLOW_ATTRITION">Slow Attrition (Physical warfare and territory battle)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OPPONENT SCOUTING */}
        {activeTab === 'opponent' && (
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-3 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="font-heading font-bold text-xs text-white">
                {opponentClub.name} Squad Roster ({opponentPlayers.length} Players)
              </span>
              <span className="text-xs text-blue-400 font-mono-numbers">Reputation: {opponentClub.reputation}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {opponentPlayers.slice(0, 15).map((p, idx) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-neutral-800 font-heading font-black text-[10px] text-neutral-400 flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] text-neutral-400">{getPositionName(p.primaryPosition)}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-numbers font-bold text-blue-400">
                    OVR {p.overall}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="pt-3 border-t border-neutral-800 shrink-0 flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={autoPickLineup}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Automatically select optimal starting XV"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Pick Best XV</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
            >
              Back
            </button>

            <button
              onClick={handleLaunch}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs tracking-wider flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/60"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>KICK OFF MATCH</span>
            </button>
          </div>
        </div>

        {/* SWAP PLAYER DRAWER / MODAL */}
        {swapTargetJersey !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-neutral-100 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 font-heading font-black flex items-center justify-center text-sm border border-amber-500/40">
                    #{swapTargetJersey}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-white">
                      {swapTargetJersey <= 15
                        ? `Select Player for ${getPositionName(JERSEY_TO_POSITION[swapTargetJersey])}`
                        : `Select Player for Bench #${swapTargetJersey}`}
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      World Rugby positional laws apply. Verified specialists recommended.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSwapTargetJersey(null)}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Player Candidates List */}
              <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
                {clubPlayers.map(p => {
                  const targetPos = swapTargetJersey <= 15 ? JERSEY_TO_POSITION[swapTargetJersey] : undefined;
                  const eligibility = targetPos ? checkPositionalEligibility(p, targetPos) : { eligible: true };
                  const isCurrent = (swapTargetJersey <= 15 ? startingXV[swapTargetJersey] : bench[swapTargetJersey]) === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : eligibility.eligible
                          ? 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                          : 'border-red-950/50 bg-red-950/10 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-neutral-800 font-heading font-black text-xs text-white flex flex-col items-center justify-center">
                          <span>{p.overall}</span>
                          <span className="text-[7px] text-neutral-400 uppercase">OVR</span>
                        </div>
                        <div>
                          <div className="font-heading font-bold text-white flex items-center space-x-1.5">
                            <span>{p.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-sans">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {getPositionName(p.primaryPosition)} · Age {p.age}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {targetPos && (
                          <div className="text-right">
                            {eligibility.eligible ? (
                              <span className="text-[10px] text-emerald-400 font-semibold block">
                                Eligible
                              </span>
                            ) : (
                              <span className="text-[10px] text-red-400 font-semibold block">
                                Ineligible
                              </span>
                            )}
                          </div>
                        )}

                        <button
                          disabled={!eligibility.eligible}
                          onClick={() => handleSwapPlayer(p.id)}
                          className={`px-3 py-1.5 rounded-lg font-heading font-bold text-xs cursor-pointer ${
                            eligibility.eligible
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          Pick #{swapTargetJersey}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-neutral-800 mt-2 text-right">
                <button
                  onClick={() => setSwapTargetJersey(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
