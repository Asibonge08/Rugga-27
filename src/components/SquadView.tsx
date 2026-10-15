import React, { useState } from 'react';
import { Player, RugbyPosition, isFrontRow, getRugbyUnit, FORWARD_POSITIONS, BACK_POSITIONS } from '../types/rugby';
import { POSITIONS_ORDER, getPositionName, getPositionShort } from '../data/rugbyDatabase';
import { soundFx } from '../services/soundFx';
import { useCurrency } from '../services/currencyService';
import { checkPositionalEligibility, PositionalEligibilityResult } from '../services/playerRatingService';
import { PlayerEditorModal } from './PlayerEditorModal';
import { careerManager } from '../services/careerManager';
import {
  Users,
  ArrowUpDown,
  Shield,
  Heart,
  Zap,
  Award,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Lock,
  Flame,
  Info,
  Sliders,
  Edit3
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

interface SquadViewProps {
  players: Player[];
  userClubId: string;
  startingXV: Record<number, string>;
  bench: Record<number, string>;
  onUpdateLineup: (startingXV: Record<number, string>, bench: Record<number, string>) => void;
}

export const SquadView: React.FC<SquadViewProps> = ({
  players,
  userClubId,
  startingXV,
  bench,
  onUpdateLineup
}) => {
  const { formatMoney } = useCurrency();
  const [viewMode, setViewMode] = useState<'pitch' | 'table'>('pitch');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [swapTargetJersey, setSwapTargetJersey] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ineligibleNotice, setIneligibleNotice] = useState<string | null>(null);
  const [showRugbyRulesGuide, setShowRugbyRulesGuide] = useState<boolean>(false);
  const [eligibleOnlyFilter, setEligibleOnlyFilter] = useState<boolean>(false);
  const [sortField, setSortField] = useState<keyof Player | 'overall'>('overall');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const clubPlayers = players.filter(p => p.clubId === userClubId);

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

  const handleSelectJerseyToSwap = (jersey: number) => {
    soundFx.playClick();
    setSwapTargetJersey(jersey);
    setIneligibleNotice(null);
  };

  const handleExecuteSwap = (newPlayerId: string) => {
    if (swapTargetJersey === null) return;

    const newPlayer = clubPlayers.find(p => p.id === newPlayerId);
    if (!newPlayer) return;

    // Strict Positional Eligibility Check for Starting XV (Jerseys 1 to 15)
    if (swapTargetJersey <= 15) {
      const targetPos = JERSEY_TO_POSITION[swapTargetJersey];
      const eligibility = checkPositionalEligibility(newPlayer, targetPos);

      if (!eligibility.eligible) {
        soundFx.playWhistle('short');
        setIneligibleNotice(
          eligibility.reason ||
          `World Rugby Law Violation: ${newPlayer.name} cannot legally play as ${getPositionName(targetPos)}.`
        );
        return;
      }
    }

    soundFx.playWhistle('short');

    const newStarting = { ...startingXV };
    const newBench = { ...bench };

    if (swapTargetJersey <= 15) {
      const oldPlayerId = newStarting[swapTargetJersey];
      newStarting[swapTargetJersey] = newPlayerId;

      // If new player was on bench, put old player on bench
      Object.keys(newBench).forEach(k => {
        if (newBench[Number(k)] === newPlayerId && oldPlayerId) {
          newBench[Number(k)] = oldPlayerId;
        }
      });

      // If new player was already in another starting jersey, swap them
      Object.keys(newStarting).forEach(k => {
        const jNum = Number(k);
        if (jNum !== swapTargetJersey && newStarting[jNum] === newPlayerId && oldPlayerId) {
          newStarting[jNum] = oldPlayerId;
        }
      });
    } else {
      // Swapping bench jersey
      newBench[swapTargetJersey] = newPlayerId;
    }

    onUpdateLineup(newStarting, newBench);
    setSwapTargetJersey(null);
    setIneligibleNotice(null);
  };

  // Sort club players
  const filteredPlayers = clubPlayers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.primaryPosition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar: Selector & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-white">Squad Selection</h2>
            <p className="text-xs text-neutral-400">Starting XV (1–15) & Bench Replacements (16–23)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              soundFx.playClick();
              setShowRugbyRulesGuide(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 flex items-center space-x-1.5 cursor-pointer transition-all"
            title="World Rugby Positional Eligibility Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Rugby Rules Guide</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setEditingPlayer(selectedPlayer || clubPlayers[0] || null);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/90 hover:bg-emerald-800 text-emerald-300 hover:text-white border border-emerald-600/50 flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
            title="Edit player name, positions and attributes"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Player</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setViewMode('pitch');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewMode === 'pitch' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Tactical Pitch
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setViewMode('table');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewMode === 'table' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Squad Table
          </button>
        </div>
      </div>

      {/* PITCH VISUALIZER VIEW */}
      {viewMode === 'pitch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Visual Formation Board */}
          <div className="lg:col-span-2 relative aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden border border-emerald-950/80 bg-gradient-to-b from-emerald-950/70 via-neutral-950 to-neutral-950 p-4 shadow-2xl">
            {/* Pitch Markings Overlay */}
            <div className="absolute inset-0 border-2 border-white/20 m-3 rounded-xl pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
              <div className="absolute top-[25%] left-0 right-0 h-px border-b border-dashed border-white/15" />
              <div className="absolute top-[75%] left-0 right-0 h-px border-b border-dashed border-white/15" />
            </div>

            {/* 15 Starting XV Position Nodes */}
            {pitchPositions.map(pos => {
              const pid = startingXV[pos.jersey];
              const player = clubPlayers.find(p => p.id === pid);
              const isSelectedForSwap = swapTargetJersey === pos.jersey;

              return (
                <div
                  key={pos.jersey}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onClick={() => handleSelectJerseyToSwap(pos.jersey)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group transition-transform hover:scale-105 z-10`}
                >
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center font-heading font-black text-xs sm:text-sm text-white shadow-lg transition-all ${
                      isSelectedForSwap
                        ? 'border-yellow-400 bg-yellow-500/30 ring-4 ring-yellow-400/50 scale-110'
                        : player
                        ? 'border-white/40 bg-emerald-700/90 hover:border-emerald-400'
                        : 'border-dashed border-neutral-600 bg-neutral-900/80 text-neutral-500'
                    }`}
                  >
                    {pos.jersey}
                  </div>
                  <div className="mt-1 px-1.5 py-0.5 rounded bg-neutral-950/90 border border-neutral-800 text-[9px] sm:text-[10px] font-semibold text-neutral-200 truncate max-w-[85px] sm:max-w-[105px] text-center shadow-md">
                    {player ? player.name.split(' ').pop() : 'Empty'}
                  </div>
                  {player && (
                    <div className="text-[8px] sm:text-[9px] font-mono-numbers text-emerald-400 font-bold">
                      OVR {player.overall}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bench Replacements (16-23) & Quick Swap Drawer */}
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-400">
                  Matchday Bench (Jerseys 16–23)
                </span>
                <span className="text-[10px] text-neutral-400">8 Legal Subs</span>
              </div>

              <div className="space-y-2 mb-4">
                {[16, 17, 18, 19, 20, 21, 22, 23].map(bJersey => {
                  const pid = bench[bJersey];
                  const player = clubPlayers.find(p => p.id === pid);
                  const isSelected = swapTargetJersey === bJersey;

                  return (
                    <div
                      key={bJersey}
                      onClick={() => handleSelectJerseyToSwap(bJersey)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-500/20'
                          : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-neutral-800 text-emerald-400 font-bold flex items-center justify-center font-mono-numbers text-[10px]">
                          {bJersey}
                        </span>
                        <div>
                          <div className="font-medium text-neutral-200 truncate max-w-[130px]">
                            {player ? player.name : 'Unassigned'}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono-numbers">
                            {player ? `${getPositionShort(player.primaryPosition)} · OVR ${player.overall}` : '-'}
                          </div>
                        </div>
                      </div>
                      {player && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlayer(player);
                          }}
                          className="text-[10px] text-emerald-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800"
                        >
                          Profile
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {swapTargetJersey && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs flex items-center justify-between">
                <div>
                  <div className="text-amber-300 font-semibold flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Selecting Jersey #{swapTargetJersey}</span>
                  </div>
                  <div className="text-[10px] text-neutral-300">
                    {swapTargetJersey <= 15 ? getPositionName(JERSEY_TO_POSITION[swapTargetJersey]) : 'Bench Replacement'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setSwapTargetJersey(null);
                    setIneligibleNotice(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SQUAD TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl overflow-hidden">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search squad..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-neutral-400 font-mono-numbers">
              {filteredPlayers.length} Players Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] text-neutral-400 uppercase font-semibold border-b border-neutral-800 bg-neutral-950/60">
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-2">Position</th>
                  <th className="py-2.5 px-2 text-center font-mono-numbers">Age</th>
                  <th className="py-2.5 px-2 text-center font-mono-numbers">OVR</th>
                  <th className="py-2.5 px-2 text-center font-mono-numbers">POT</th>
                  <th className="py-2.5 px-2 text-center font-mono-numbers">Fit</th>
                  <th className="py-2.5 px-2 text-center font-mono-numbers">Morale</th>
                  <th className="py-2.5 px-3 text-right">Wage</th>
                  <th className="py-2.5 px-3 text-right">Value</th>
                  <th className="py-2.5 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {filteredPlayers.map(p => {
                  const isStarting = Object.values(startingXV).includes(p.id);
                  const isBench = Object.values(bench).includes(p.id);

                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-2.5 px-3 flex items-center space-x-2">
                        {isStarting && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Starting XV" />}
                        {isBench && <span className="w-2 h-2 rounded-full bg-blue-500" title="Bench" />}
                        <span className="font-semibold text-neutral-100">{p.name}</span>
                      </td>
                      <td className="py-2.5 px-2 text-neutral-400 font-mono-numbers">
                        {getPositionShort(p.primaryPosition)}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-neutral-300">{p.age}</td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-emerald-400 font-bold">
                        {p.overall}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-amber-400 font-bold">
                        {p.potential}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-neutral-300">
                        {p.fitness}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-neutral-300">
                        {p.morale}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers text-neutral-300">
                        {formatMoney(p.weeklyWage, { perWeek: true })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers text-neutral-200">
                        {formatMoney(p.marketValue, { compact: true })}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedPlayer(p)}
                            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setEditingPlayer(p)}
                            className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-600/40 text-emerald-300 text-[11px] font-semibold cursor-pointer"
                            title="Edit Player Name & Stats"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLAYER ATTRIBUTE PROFILE MODAL */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 text-neutral-100 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-heading font-black text-xl text-emerald-400">
                  {selectedPlayer.overall}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-white">{selectedPlayer.name}</h3>
                  <p className="text-xs text-neutral-400">
                    {getPositionName(selectedPlayer.primaryPosition)} · {selectedPlayer.nationality} · {selectedPlayer.age} y/o
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setEditingPlayer(selectedPlayer);
                    setSelectedPlayer(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-300 hover:text-white text-xs font-heading font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                  title="Edit Player Name, Positions & Stats"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit Stats</span>
                </button>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Detailed Rugby Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-xs font-mono-numbers">
              {Object.entries(selectedPlayer.attributes).map(([attr, val]) => (
                <div key={attr} className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
                  <div className="text-neutral-400 text-[10px] uppercase font-sans capitalize mb-1 truncate">
                    {attr.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-100">{val}</span>
                    <div className="w-12 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, (val / 99) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contract & Career Summary */}
            <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <div>
                <span className="text-neutral-400 text-[10px] uppercase block">Contract Expiry</span>
                <span className="font-semibold text-neutral-200">{selectedPlayer.contractYearsLeft} Years Left</span>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px] uppercase block">Weekly Wage</span>
                <span className="font-semibold text-emerald-400">{formatMoney(selectedPlayer.weeklyWage, { perWeek: true })}</span>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px] uppercase block">Market Value</span>
                <span className="font-semibold text-neutral-200">{formatMoney(selectedPlayer.marketValue, { compact: true })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER EDITOR MODAL */}
      {editingPlayer && (
        <PlayerEditorModal
          player={editingPlayer}
          onSave={(updated) => {
            careerManager.updatePlayer(updated);
            setEditingPlayer(null);
          }}
          onClose={() => setEditingPlayer(null)}
        />
      )}

      {/* POSITIONAL ELIGIBILITY & SELECTION MODAL */}
      {swapTargetJersey !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 text-neutral-100 shadow-2xl animate-in fade-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-heading font-black text-amber-300 text-lg">
                  #{swapTargetJersey}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-white">
                    {swapTargetJersey <= 15
                      ? `Select Player for ${getPositionName(JERSEY_TO_POSITION[swapTargetJersey])}`
                      : `Select Player for Bench Jersey #${swapTargetJersey}`}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {swapTargetJersey <= 15
                      ? `Unit: ${getRugbyUnit(JERSEY_TO_POSITION[swapTargetJersey])} · Strict World Rugby Positional Laws apply`
                      : 'Bench replacement for matchday tactical rotation'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSwapTargetJersey(null);
                  setIneligibleNotice(null);
                }}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rugby Law / Position Advisory Banner */}
            {swapTargetJersey <= 15 && (
              <div className="mb-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                {isFrontRow(JERSEY_TO_POSITION[swapTargetJersey]) ? (
                  <div className="flex items-start space-x-2 text-amber-300">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      <strong className="text-white">World Rugby Law 3 (Front Row Safety):</strong> Props and Hookers require certified scrummaging specialists. Non-front-row forwards or backs cannot safely pack down here.
                    </span>
                  </div>
                ) : getRugbyUnit(JERSEY_TO_POSITION[swapTargetJersey]) === 'BACKS' ? (
                  <div className="flex items-start space-x-2 text-blue-300">
                    <Zap className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                    <span>
                      <strong className="text-white">Backline Position:</strong> Ordinary forwards are strictly ineligible unless verified as an approved <span className="text-amber-300 font-semibold">Hybrid Player</span> (e.g. Ben Earl).
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 text-emerald-300">
                    <Users className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>
                      <strong className="text-white">Forward Pack Position:</strong> Ordinary backs cannot pack down in the scrum or forward pack unless verified as an approved <span className="text-amber-300 font-semibold">Hybrid Player</span> (e.g. André Esterhuizen).
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Ineligible Rule Warning Toast */}
            {ineligibleNotice && (
              <div className="mb-3 p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-xs text-red-200 flex items-start justify-between space-x-2 animate-in fade-in">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{ineligibleNotice}</span>
                </div>
                <button
                  onClick={() => setIneligibleNotice(null)}
                  className="text-red-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Filters Row */}
            <div className="flex items-center justify-between gap-2 mb-3 text-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter candidate by name or position..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              {swapTargetJersey <= 15 && (
                <button
                  onClick={() => setEligibleOnlyFilter(!eligibleOnlyFilter)}
                  className={`px-3 py-1.5 rounded-lg font-medium border text-xs cursor-pointer transition-all ${
                    eligibleOnlyFilter
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                >
                  {eligibleOnlyFilter ? 'Showing Eligible Only' : 'Show All Candidates'}
                </button>
              )}
            </div>

            {/* Candidates List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {(() => {
                const targetPos = swapTargetJersey <= 15 ? JERSEY_TO_POSITION[swapTargetJersey] : undefined;
                let candidates = clubPlayers.filter(p =>
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.primaryPosition.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (targetPos && eligibleOnlyFilter) {
                  candidates = candidates.filter(p => checkPositionalEligibility(p, targetPos).eligible);
                }

                // Sort: Primary specialists first, then secondary, then hybrid, then emergency, then ineligible
                if (targetPos) {
                  candidates.sort((a, b) => {
                    const elA = checkPositionalEligibility(a, targetPos);
                    const elB = checkPositionalEligibility(b, targetPos);
                    if (elA.eligible !== elB.eligible) return elA.eligible ? -1 : 1;
                    if (elA.isPrimary !== elB.isPrimary) return elA.isPrimary ? -1 : 1;
                    return elB.effectiveRating - elA.effectiveRating;
                  });
                }

                return candidates.map(player => {
                  const isCurrentInThisJersey = swapTargetJersey <= 15
                    ? startingXV[swapTargetJersey] === player.id
                    : bench[swapTargetJersey] === player.id;

                  const eligibility: PositionalEligibilityResult = targetPos
                    ? checkPositionalEligibility(player, targetPos)
                    : {
                        eligible: true,
                        isPrimary: true,
                        isSecondary: false,
                        isHybrid: false,
                        suitabilityScore: 100,
                        effectiveRating: player.overall,
                        penaltyPercent: 0
                      };

                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        isCurrentInThisJersey
                          ? 'border-emerald-500/80 bg-emerald-950/30'
                          : eligibility.eligible
                          ? 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                          : 'border-red-950/40 bg-neutral-950/40 opacity-75'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center font-heading font-black text-sm shrink-0 ${
                            eligibility.eligible
                              ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-400'
                              : 'border-red-500/30 bg-red-950/30 text-red-400'
                          }`}
                        >
                          {eligibility.eligible ? eligibility.effectiveRating : player.overall}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-heading font-bold text-sm text-neutral-100">{player.name}</span>
                            {isCurrentInThisJersey && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                            <span>Primary: {getPositionShort(player.primaryPosition)}</span>
                            {player.secondaryPositions && player.secondaryPositions.length > 0 && (
                              <span>· Also: {player.secondaryPositions.map(getPositionShort).join(', ')}</span>
                            )}
                            {player.hybridLevel && player.hybridLevel !== 'NONE' && (
                              <span className="text-amber-400 font-semibold flex items-center space-x-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Hybrid Star</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Suitability Badge & Action Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        {targetPos && (
                          <div className="text-right">
                            {eligibility.eligible ? (
                              eligibility.isPrimary ? (
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                                  ✓ Primary Specialist
                                </span>
                              ) : eligibility.isHybrid ? (
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                  ⭐ Approved Hybrid ({eligibility.penaltyPercent > 0 ? `-${eligibility.penaltyPercent}%` : 'Natural'})
                                </span>
                              ) : eligibility.isSecondary ? (
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                                  Approved Secondary (-4%)
                                </span>
                              ) : (
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-medium">
                                  ⚠️ Emergency Cover (-12%)
                                </span>
                              )
                            ) : (
                              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-800/40 font-medium">
                                ⛔ Law Prohibited
                              </span>
                            )}
                            {eligibility.reason && !eligibility.eligible && (
                              <div className="text-[9px] text-red-400 mt-0.5 max-w-[200px] truncate sm:text-right">
                                {eligibility.reason}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            if (eligibility.eligible) {
                              handleExecuteSwap(player.id);
                            } else {
                              soundFx.playWhistle('short');
                              setIneligibleNotice(eligibility.reason || 'World Rugby rules prohibit this position selection.');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs tracking-wide transition-all cursor-pointer ${
                            eligibility.eligible
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                              : 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 border border-neutral-700/60'
                          }`}
                        >
                          {eligibility.eligible ? `Pick #${swapTargetJersey}` : 'Ineligible'}
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-neutral-800 flex justify-between items-center text-xs">
              <span className="text-neutral-400 font-mono-numbers">
                Jerseys 1–15 enforce verified World Rugby positional legality.
              </span>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSwapTargetJersey(null);
                  setIneligibleNotice(null);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RUGBY POSITIONS & HYBRID RULES GUIDE MODAL */}
      {showRugbyRulesGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 text-neutral-100 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-white">Rugba 27 Rugby School</h3>
                  <p className="text-xs text-neutral-400">Positional rules, front-row safety laws, and hybrid versatility</p>
                </div>
              </div>
              <button
                onClick={() => setShowRugbyRulesGuide(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-neutral-300">
              {/* Section 1: The Forward Pack */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-heading font-bold text-sm">
                  <Users className="w-4 h-4" />
                  <span>The Forward Pack (Jerseys 1 to 8)</span>
                </div>
                <p>
                  Forwards do the heavy lifting in set-pieces (scrums and lineouts) and breakdowns.
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-300 pl-1">
                  <li>
                    <strong className="text-white">Front Row (1 Loosehead Prop, 2 Hooker, 3 Tighthead Prop):</strong> Controlled by World Rugby Law 3. Under no circumstances can ordinary flankers or backs play here. Scrummaging requires certified front-row specialists.
                  </li>
                  <li>
                    <strong className="text-white">Second Row (4 & 5 Locks):</strong> The powerhouse jumpers who secure lineout ball and anchor the engine room of the scrum.
                  </li>
                  <li>
                    <strong className="text-white">Back Row (6 Blindside Flanker, 7 Openside Flanker, 8 Number 8):</strong> Breakdown scavengers, defensive jackals, and dynamic ball carriers.
                  </li>
                </ul>
              </div>

              {/* Section 2: The Backline */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center space-x-2 text-blue-400 font-heading font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>The Backline Unit (Jerseys 9 to 15)</span>
                </div>
                <p>
                  Backs control game distribution, tactical territory kicking, aerial contests, and open-field tries.
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-300 pl-1">
                  <li>
                    <strong className="text-white">Halfbacks (9 Scrum-Half & 10 Fly-Half):</strong> The tactical generals. Scrum-halves clear the ball rapidly from rucks; fly-halves direct play and execute kicking from the hand.
                  </li>
                  <li>
                    <strong className="text-white">Centres (12 Inside Centre & 13 Outside Centre):</strong> Defensive organizers who punch holes through the defensive line or distribute wide.
                  </li>
                  <li>
                    <strong className="text-white">Outside Backs (11 Left Wing, 14 Right Wing, 15 Fullback):</strong> Speed finishers and high-ball sweepers who exploit space on the counter-attack.
                  </li>
                </ul>
              </div>

              {/* Section 3: The Hybrid Mechanic */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <div className="flex items-center space-x-2 text-amber-300 font-heading font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>The Researched "Hybrid Player" Mechanic</span>
                </div>
                <p>
                  Ordinary forwards cannot play in the backline, and ordinary backs cannot play in the forward pack. However, modern rugby features rare, documented cross-unit athletes:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono-numbers">
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="font-bold text-amber-300 text-xs">Ben Earl (Saracens / England)</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">Primary: Flanker / Number 8</div>
                    <div className="text-[11px] text-emerald-400">Approved Cross-Unit: Inside Centre (12)</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="font-bold text-amber-300 text-xs">André Esterhuizen (Sharks / SA)</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">Primary: Inside Centre (12)</div>
                    <div className="text-[11px] text-emerald-400">Approved Cross-Unit: Blindside Flanker (6)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-800 text-right">
              <button
                onClick={() => setShowRugbyRulesGuide(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
              >
                Understood, Return to Squad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
