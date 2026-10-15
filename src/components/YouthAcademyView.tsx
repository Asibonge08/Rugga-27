import React, { useState } from 'react';
import { Player, RugbyPosition, FORWARD_POSITIONS, BACK_POSITIONS } from '../types/rugby';
import { getPositionName, getPositionShort, POSITIONS_ORDER } from '../data/rugbyDatabase';
import { soundFx } from '../services/soundFx';
import { careerManager } from '../services/careerManager';
import {
  Sparkles,
  Award,
  ArrowUpRight,
  UserPlus,
  ArrowDownLeft,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  TrendingUp,
  X,
  Compass,
  Star,
  Shield,
  HelpCircle
} from 'lucide-react';

interface YouthAcademyViewProps {
  prospects: Player[];
  onPromotePlayer: (playerId: string) => void;
}

export const YouthAcademyView: React.FC<YouthAcademyViewProps> = ({
  prospects,
  onPromotePlayer
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showDemoteModal, setShowDemoteModal] = useState<boolean>(false);
  const [growthReport, setGrowthReport] = useState<{
    developedCount: number;
    reports: { player: Player; ovrGain: number; oldOvr: number; newOvr: number; keyBoosts: string }[];
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Academy Player Form State
  const [newName, setNewName] = useState<string>('');
  const [newAge, setNewAge] = useState<number>(18);
  const [newPos, setNewPos] = useState<RugbyPosition>('FLY_HALF');
  const [newBaseOvr, setNewBaseOvr] = useState<number>(66);
  const [newPotential, setNewPotential] = useState<number>(85);

  const careerState = careerManager.getState();
  const seniorPlayers = careerState.players.filter(p => p.clubId === careerState.userClubId);
  const demoteCandidates = seniorPlayers.filter(p => p.age <= 23);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    soundFx.playWhistle('short');
    careerManager.addAcademyPlayer({
      name: newName.trim(),
      age: Number(newAge),
      primaryPosition: newPos,
      potential: Number(newPotential),
      baseOverall: Number(newBaseOvr)
    });

    setShowAddModal(false);
    setNewName('');
    showToast(`✓ Inducted ${newName.trim()} into the Youth Academy!`);
  };

  const handleDemotePlayer = (playerId: string) => {
    soundFx.playClick();
    const res = careerManager.demoteToAcademy(playerId);
    if (res.success) {
      showToast(`✓ ${res.message}`);
      setShowDemoteModal(false);
    } else {
      showToast(`⚠️ ${res.message}`);
    }
  };

  const handleScoutIntake = () => {
    soundFx.playWhistle('short');
    const intake = careerManager.generateYouthIntake(4);
    showToast(`🎓 Scouted & enrolled ${intake.length} youth prospects into the Academy!`);
  };

  const handleRunDevelopment = () => {
    soundFx.playWhistle('short');
    const result = careerManager.simulateYouthGrowth();
    setGrowthReport(result);
  };

  const handleRelease = (playerId: string, name: string) => {
    if (window.confirm(`Release ${name} from the Academy?`)) {
      soundFx.playClick();
      careerManager.releaseAcademyPlayer(playerId);
      showToast(`Released ${name} from the Academy.`);
    }
  };

  // Helper for potential range
  const getPotentialRange = (p: Player) => {
    const minRange = Math.max(p.overall, p.potential - 2);
    const maxRange = Math.min(99, p.potential + 2);
    return `${minRange}–${maxRange}`;
  };

  return (
    <div className="space-y-4 pb-12 max-w-4xl mx-auto select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-400 font-semibold text-xs sm:text-sm flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-heading font-black text-lg text-white">Youth & Training Academy</h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                U23 TALENT PIPELINE
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Nurture homegrown talent, run simulated growth, and promote high-ceiling stars (Strictly Age ≤ 23)
            </p>
          </div>
        </div>

        {/* Global Academy Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              soundFx.playClick();
              setShowAddModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border border-neutral-700"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Player</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setShowDemoteModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border border-neutral-700"
            title="Move senior squad players (aged <= 23) to Academy for focused development"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Assign Senior (≤23)</span>
          </button>

          <button
            onClick={handleScoutIntake}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border border-neutral-700"
            title="Generate 3-5 realistic youth prospects into academy"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Scout Intake</span>
          </button>

          <button
            onClick={handleRunDevelopment}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
            title="Simulate Academy background match growth cycle"
          >
            <TrendingUp className="w-3.5 h-3.5 text-white" />
            <span>Simulate Growth</span>
          </button>
        </div>
      </div>

      {/* Academy Roster Rules Card */}
      <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Academy Eligibility:</strong> Age strictly capped at 23. Players turning 24 must be promoted or released.
          </span>
        </div>
        <span className="font-mono-numbers text-neutral-300 font-semibold shrink-0">
          {prospects.length} Enrolled
        </span>
      </div>

      {/* Academy Prospects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {prospects.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center text-neutral-400 text-sm">
            <Sparkles className="w-8 h-8 text-amber-400/50 mx-auto mb-2" />
            <p className="font-semibold text-neutral-300">No Academy Prospects Enrolled</p>
            <p className="text-xs text-neutral-500 mt-1">
              Tap "Scout Intake" to recruit fresh prodigies or "Add Player" to create your own academy wonderkid.
            </p>
          </div>
        ) : (
          prospects.map(p => {
            const isOverAge = p.age >= 24;
            const isProdigy = p.potential - p.overall >= 10;
            const potRange = getPotentialRange(p);

            return (
              <div
                key={p.id}
                className={`rounded-2xl bg-neutral-900 border p-4 flex flex-col justify-between shadow-lg transition-all ${
                  isOverAge
                    ? 'border-red-500/50 bg-red-950/10'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  {/* Top Bar: Name, Position, Potential Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-heading font-bold text-sm text-white">{p.name}</span>
                        {isProdigy && (
                          <span title="High Potential Wonderkid (Gap >= 10)">
                            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 block">
                        {getPositionName(p.primaryPosition)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="inline-block text-xs font-mono-numbers text-amber-400 font-black bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-lg">
                        {potRange} POT
                      </span>
                    </div>
                  </div>

                  {/* Over-Age Limit Warning */}
                  {isOverAge && (
                    <div className="mb-3 p-2 rounded-xl bg-red-950/50 border border-red-500/40 text-[11px] text-red-300 flex items-center space-x-1.5 font-medium">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Age Limit Reached (24+). Must promote or release.</span>
                    </div>
                  )}

                  {/* Rating & Attributes Snapshot */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono-numbers bg-neutral-950 p-2.5 rounded-xl mb-4 border border-neutral-800">
                    <div>
                      <span className="text-neutral-500 text-[9px] uppercase font-sans block">Current</span>
                      <span className="text-emerald-400 font-bold text-sm">{p.overall} OVR</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[9px] uppercase font-sans block">Age</span>
                      <span className="text-neutral-200 font-semibold text-sm">{p.age} yrs</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[9px] uppercase font-sans block">Ceiling</span>
                      <span className="text-amber-400 font-bold text-sm">{p.potential}</span>
                    </div>
                  </div>

                  {/* Development Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                      <span>Progression Towards Potential</span>
                      <span className="font-mono-numbers text-neutral-300 font-semibold">
                        {Math.round((p.overall / p.potential) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (p.overall / p.potential) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                  <button
                    onClick={() => {
                      soundFx.playWhistle('short');
                      onPromotePlayer(p.id);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Promote to Senior Squad</span>
                  </button>

                  <button
                    onClick={() => handleRelease(p.id, p.name)}
                    className="w-full py-1.5 px-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    Release Player
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: ADD ACADEMY PLAYER FORM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-neutral-100 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-heading font-bold text-base text-white">Add Academy Prospect</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlayer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Player Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sacha Feinberg-Mngomezulu"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Age (16–21)</label>
                  <input
                    type="number"
                    min="16"
                    max="21"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Primary Position</label>
                  <select
                    value={newPos}
                    onChange={(e) => setNewPos(e.target.value as RugbyPosition)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {POSITIONS_ORDER.map(pos => (
                      <option key={pos} value={pos}>
                        {getPositionShort(pos)} - {getPositionName(pos)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-neutral-300 mb-1">
                  <span>Base Ability (Current Rating)</span>
                  <span className="font-mono-numbers text-emerald-400">{newBaseOvr} OVR</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="78"
                  value={newBaseOvr}
                  onChange={(e) => setNewBaseOvr(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-neutral-300 mb-1">
                  <span>Potential Ceiling</span>
                  <span className="font-mono-numbers text-amber-400">{newPotential} POT</span>
                </div>
                <input
                  type="range"
                  min={newBaseOvr}
                  max="98"
                  value={newPotential}
                  onChange={(e) => setNewPotential(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs cursor-pointer shadow-md"
                >
                  Add to Academy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN SENIOR SQUAD PLAYER (<=23) TO ACADEMY */}
      {showDemoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-neutral-100 shadow-2xl animate-in fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <ArrowDownLeft className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-bold text-base text-white">Assign Senior Player to Academy</h3>
              </div>
              <button
                onClick={() => setShowDemoteModal(false)}
                className="p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-3 shrink-0">
              Only senior players aged ≤ 23 are eligible to be assigned to the Academy for specialized technical focus.
            </p>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {demoteCandidates.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  No senior squad players meet the age requirement (≤ 23 years old).
                </div>
              ) : (
                demoteCandidates.map(p => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-heading font-bold text-xs text-white">{p.name}</div>
                      <div className="text-[10px] text-neutral-400">
                        {getPositionShort(p.primaryPosition)} · Age {p.age} · OVR {p.overall} · POT {p.potential}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDemotePlayer(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all cursor-pointer"
                    >
                      Assign to Academy
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-neutral-800 shrink-0 text-right mt-3">
              <button
                onClick={() => setShowDemoteModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SIMULATED GROWTH RESULTS REVIEW */}
      {growthReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-neutral-100 shadow-2xl animate-in fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-heading font-bold text-base text-white">Academy Development Growth Review</h3>
              </div>
              <button
                onClick={() => setGrowthReport(null)}
                className="p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-3 shrink-0">
              Off-screen youth fixtures, position-specific training drills, and physical conditioning results:
            </p>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {growthReport.reports.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400">
                  Prospects are maintaining current training baselines or have reached their potential ceilings.
                </div>
              ) : (
                growthReport.reports.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-heading font-bold text-xs text-white">{r.player.name}</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">{r.keyBoosts}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono-numbers font-bold">
                        +{r.ovrGain} OVR ({r.oldOvr} ➔ {r.newOvr})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-neutral-800 shrink-0 text-right mt-3">
              <button
                onClick={() => setGrowthReport(null)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs cursor-pointer shadow-md"
              >
                Acknowledge Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
