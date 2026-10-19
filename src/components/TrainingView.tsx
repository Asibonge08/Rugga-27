import React, { useState } from 'react';
import { CareerState, careerManager } from '../services/careerManager';
import { soundFx } from '../services/soundFx';
import { getPositionShort, getPositionName } from '../data/rugbyDatabase';
import {
  Activity,
  Flame,
  Shield,
  Zap,
  HeartPulse,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BatteryCharging,
  Sliders,
  BedDouble,
  Award
} from 'lucide-react';

interface TrainingViewProps {
  state: CareerState;
  onUpdateTraining: (focus: CareerState['trainingSchedule']['focus'], intensity: CareerState['trainingSchedule']['intensity']) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({ state, onUpdateTraining }) => {
  const { focus, intensity } = state.trainingSchedule;
  const userClub = state.clubs.find(c => c.id === state.userClubId);
  const clubPlayers = state.players.filter(p => p.clubId === state.userClubId);

  const [filterView, setFilterView] = useState<'ALL' | 'FATIGUED' | 'INJURED' | 'RESTED'>('ALL');
  const [restToast, setRestToast] = useState<string | null>(null);
  const [targetedFocus, setTargetedFocus] = useState<'ATTACK' | 'DEFENCE' | 'SET_PIECE' | 'KICKING'>('ATTACK');
  const [targetedDuration, setTargetedDuration] = useState<number>(2);
  const [targetedToast, setTargetedToast] = useState<string | null>(null);

  const handleStartTargeted = () => {
    soundFx.playClick();
    const res = careerManager.startTargetedTraining(targetedFocus, targetedDuration);
    setTargetedToast(res.message);
    if (res.success) soundFx.playCrowdCheer();
    setTimeout(() => setTargetedToast(null), 4000);
  };

  const handleSkipTargeted = () => {
    soundFx.playClick();
    const res = careerManager.skipTargetedTrainingWithCoins();
    setTargetedToast(res.message);
    if (res.success) soundFx.playCrowdCheer();
    setTimeout(() => setTargetedToast(null), 4000);
  };

  const handleSetFocus = (f: CareerState['trainingSchedule']['focus']) => {
    soundFx.playClick();
    onUpdateTraining(f, intensity);
  };

  const handleSetIntensity = (i: CareerState['trainingSchedule']['intensity']) => {
    soundFx.playClick();
    onUpdateTraining(focus, i);
  };

  const handleToggleRest = (playerId: string) => {
    soundFx.playClick();
    const res = careerManager.togglePlayerRest(playerId);
    setRestToast(res.message);
    setTimeout(() => setRestToast(null), 3500);
  };

  const injuredPlayers = clubPlayers.filter(p => p.injury !== null);
  const highFatiguePlayers = clubPlayers.filter(p => p.fatigue > 60);
  const restedPlayers = clubPlayers.filter(p => p.isRestedThisWeek);
  const fitPlayers = clubPlayers.filter(p => !p.injury);

  // Compute average training efficiency across the squad
  const totalEff = clubPlayers.reduce((sum, p) => sum + (careerManager.calculateTrainingEfficiency(p) || 0), 0);
  const avgEfficiency = Math.round(totalEff / Math.max(1, clubPlayers.length));

  const medicalLevel = userClub?.facilities?.medical || 2;
  const trainingLevel = userClub?.facilities?.training || 2;

  // Filtered player list for workload table
  const displayedPlayers = clubPlayers.filter(p => {
    if (filterView === 'FATIGUED') return p.fatigue > 50;
    if (filterView === 'INJURED') return p.injury !== null;
    if (filterView === 'RESTED') return !!p.isRestedThisWeek;
    return true;
  }).sort((a, b) => {
    if (a.injury && !b.injury) return -1;
    if (!a.injury && b.injury) return 1;
    return b.fatigue - a.fatigue;
  });

  return (
    <div className="space-y-5 pb-12 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {restToast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-950 border border-emerald-500/80 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl animate-in fade-in flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{restToast}</span>
        </div>
      )}

      {targetedToast && (
        <div className="fixed top-28 right-4 z-50 bg-amber-950 border border-amber-500/80 text-amber-200 text-xs px-4 py-3 rounded-xl shadow-2xl animate-in fade-in flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>{targetedToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
              High Performance & Sports Science Hub
            </h2>
            <p className="text-xs text-neutral-400">
              Manage physical conditioning, fatigue accumulation, medical rehab, and individual load
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono-numbers">
            Medical Tier: <strong className="text-emerald-400">{medicalLevel}/5</strong>
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono-numbers">
            Gym Tier: <strong className="text-amber-400">{trainingLevel}/5</strong>
          </span>
        </div>
      </div>

      {/* 4 Health & Conditioning Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Fit & Cleared</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono-numbers text-emerald-400">
            {fitPlayers.length}
            <span className="text-xs text-neutral-400 font-normal ml-1">/ {clubPlayers.length}</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Available for selection</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Sidelined</span>
            <HeartPulse className="w-4 h-4 text-red-400" />
          </div>
          <div className={`text-2xl font-black font-mono-numbers ${injuredPlayers.length > 0 ? 'text-red-400' : 'text-neutral-300'}`}>
            {injuredPlayers.length}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Undergoing physiotherapy</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">High Fatigue</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-black font-mono-numbers ${highFatiguePlayers.length > 0 ? 'text-amber-400' : 'text-neutral-300'}`}>
            {highFatiguePlayers.length}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">&gt;60% load (risk of strain)</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Training Efficiency</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono-numbers text-emerald-400">
            {avgEfficiency}%
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Squad skill development rate</div>
        </div>
      </div>

      {/* Main Grid: Workload Setup + Medical Department */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Training Focus & Intensity */}
        <div className="space-y-4">
          {/* Workload Intensity Setting */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-4 h-4" />
                <span>Training Workload & Contact Intensity</span>
              </span>
              <span className="text-[10px] text-neutral-400">Weekly Schedule</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: 'LOW',
                  label: 'Low Workload',
                  rec: '-28% Fatigue',
                  risk: '<0.5% Injury Risk',
                  growth: '+8% Development',
                  desc: 'Fast recovery & aerobic regeneration'
                },
                {
                  id: 'NORMAL',
                  label: 'Normal Load',
                  rec: '-18% Fatigue',
                  risk: '1.5% Injury Risk',
                  growth: '+20% Development',
                  desc: 'Balanced skills & conditioning'
                },
                {
                  id: 'HIGH',
                  label: 'High Contact',
                  rec: '-8% Fatigue',
                  risk: '4–16% Injury Risk',
                  growth: '+35% Development',
                  desc: 'Maximum adaptation, high attrition'
                }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSetIntensity(item.id as any)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                    intensity === item.id
                      ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500 text-white'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="font-heading font-bold text-xs">{item.label}</div>
                    <div className="text-[10px] text-emerald-400 font-mono-numbers mt-1">{item.rec}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 space-y-0.5">
                    <div className="text-[9px] text-neutral-400">{item.risk}</div>
                    <div className="text-[9px] text-amber-300 font-semibold">{item.growth}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-[11px] text-neutral-300 leading-relaxed">
              💡 <strong>Sports Science Note:</strong> High fatigue (&gt;70%) drastically penalizes training efficiency (down to 15%) while multiplying muscle strain risks 4x during High Intensity contact drills. Rotate players or grant individual rest to avoid burnout!
            </div>
          </div>

          {/* Weekly Training Focus Drill */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
            <span className="text-xs font-heading font-bold text-emerald-400 uppercase tracking-wider block pb-2 border-b border-neutral-800">
              Technical Drill Focus
            </span>

            {[
              { id: 'BALANCED', name: 'Balanced All-Round Training', desc: 'Standard conditioning, skills handling, and team shape.' },
              { id: 'SET_PIECE', name: 'Set Piece Mastery (Scrum & Lineout)', desc: 'Props, hookers, and locks focus heavily on scrum stability and lineout calling.' },
              { id: 'BREAKDOWN', name: 'Breakdown & Jackal Intensity', desc: 'Flankers and forwards drill aggressive ground contest and turnover speed.' },
              { id: 'ATTACK_PATTERNS', name: 'Backline Pattern Execution', desc: 'Accelerates offloading, tactical kicking precision, and backline strike speed.' },
              { id: 'DEFENCE_FITNESS', name: 'Defensive Line & Aerobic Engine', desc: 'High-repetition tackle wraps, drift spacing, and cardiovascular stamina.' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSetFocus(opt.id as any)}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  focus === opt.id
                    ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-neutral-100">{opt.name}</span>
                  {focus === opt.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>

          {/* TARGETED TRAINING FOCUS MODULE (1-3 Weeks with Direct Boosts & XP Fast-Track) */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Targeted Training Focus (1–3 Weeks)</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono-numbers">
                Coins: <strong className="text-amber-400">{state.coins}</strong>
              </span>
            </div>

            {state.activeTargetedTraining && state.activeTargetedTraining.weeksRemaining > 0 ? (
              /* Active Module Running Banner */
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 via-neutral-950 to-amber-950/40 border border-amber-500/50 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                      Active: {state.activeTargetedTraining.focus} INTENSIVE
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono-numbers text-xs font-bold">
                    +{state.activeTargetedTraining.ratingBoost} Boost
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Schedule progress:</span>
                  <span className="font-mono-numbers font-bold text-amber-300">
                    {state.activeTargetedTraining.weeksRemaining} week{state.activeTargetedTraining.weeksRemaining > 1 ? 's' : ''} remaining
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                    style={{
                      width: `${Math.round(((state.activeTargetedTraining.durationWeeks - state.activeTargetedTraining.weeksRemaining + 1) / state.activeTargetedTraining.durationWeeks) * 100)}%`
                    }}
                  />
                </div>

                <button
                  onClick={handleSkipTargeted}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-heading font-black text-xs tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-950/40 cursor-pointer transition-all"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Fast-Track & Complete Now ({state.activeTargetedTraining.weeksRemaining * 35} Coins)</span>
                </button>
              </div>
            ) : (
              /* Configure New Module */
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1.5">
                    Select Specialist Skill Module
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'ATTACK', name: 'Attack & Offloads', boost: '+Carrying & Passing' },
                      { id: 'DEFENCE', name: 'Defence & Breakdown', boost: '+Tackling & Jackal' },
                      { id: 'SET_PIECE', name: 'Set Piece Stability', boost: '+Scrum & Lineout' },
                      { id: 'KICKING', name: 'Kicking Precision', boost: '+Kicking & Distance' }
                    ].map(mod => (
                      <button
                        key={mod.id}
                        onClick={() => setTargetedFocus(mod.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          targetedFocus === mod.id
                            ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500 text-white'
                            : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                        }`}
                      >
                        <div className="font-heading font-bold text-xs">{mod.name}</div>
                        <div className="text-[10px] text-amber-300/80 mt-0.5">{mod.boost}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1.5">
                    Program Duration & Impact
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { weeks: 1, boost: '+0.8 Rating', cost: 40 },
                      { weeks: 2, boost: '+1.4 Rating', cost: 80 },
                      { weeks: 3, boost: '+2.0 Rating', cost: 120 }
                    ].map(d => (
                      <button
                        key={d.weeks}
                        onClick={() => setTargetedDuration(d.weeks)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          targetedDuration === d.weeks
                            ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500 text-white'
                            : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                        }`}
                      >
                        <div className="font-heading font-black text-xs">{d.weeks} Week{d.weeks > 1 ? 's' : ''}</div>
                        <div className="text-[10px] text-emerald-400 font-bold mt-0.5">{d.boost}</div>
                        <div className="text-[9px] text-neutral-400 font-mono-numbers mt-0.5">{d.cost} Coins</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartTargeted}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all mt-2"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>
                    Commence {targetedDuration}-Week {targetedFocus} Block ({targetedDuration * 40} Coins)
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Medical Rehabilitation Ward & Physio Centre */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-heading font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                <HeartPulse className="w-4 h-4 text-red-400" />
                <span>Medical Department & Rehabilitation Ward</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono-numbers">
                {injuredPlayers.length} Active Rehab Cases
              </span>
            </div>

            {injuredPlayers.length === 0 ? (
              <div className="p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="font-heading font-bold text-sm text-neutral-100">Clean Bill of Health</div>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  All squad players are currently medically cleared for full contact training and matchday selection.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {injuredPlayers.map(p => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-red-950/80 hover:border-red-800/80 text-xs space-y-2 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-heading font-bold text-white text-xs">{p.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono-numbers">
                          ({getPositionShort(p.primaryPosition)} · OVR {p.overall})
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        p.injury?.severity === 'SEVERE'
                          ? 'bg-red-950 text-red-300 border border-red-700'
                          : p.injury?.severity === 'MODERATE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        {p.injury?.severity || 'MODERATE'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-300">
                      <div>
                        <span className="text-red-400 font-semibold">{p.injury?.name}</span>
                        <span className="text-neutral-500 mx-1.5">·</span>
                        <span className="text-neutral-400">{p.injury?.type || 'Trauma'}</span>
                      </div>
                      <span className="font-mono-numbers text-amber-300 font-bold">
                        {p.injury?.weeksRemaining} wk{p.injury?.weeksRemaining === 1 ? '' : 's'} remaining
                      </span>
                    </div>

                    {/* Rehab Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{
                          width: `${Math.max(15, Math.min(100, 100 - ((p.injury?.weeksRemaining || 1) * 20)))}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {medicalLevel >= 4 && (
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  <strong>Tier {medicalLevel} Medical Centre Bonus:</strong> Club physiotherapy staff provide accelerated rehabilitation protocol (+30% recovery speed).
                </span>
              </div>
            )}
          </div>

          {/* Training Efficiency System Explainer */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 shadow-xl space-y-2">
            <span className="text-xs font-heading font-bold text-neutral-300 uppercase tracking-wider block">
              Neuromuscular Training Efficiency Model
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="font-bold text-emerald-400">100% Eff.</div>
                <div className="text-neutral-400">&lt;35% Fatigue</div>
                <div className="text-[9px] text-neutral-500">Peak adaptation</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="font-bold text-amber-300">70–88% Eff.</div>
                <div className="text-neutral-400">35–69% Fatigue</div>
                <div className="text-[9px] text-neutral-500">Standard load</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="font-bold text-orange-400">15–40% Eff.</div>
                <div className="text-neutral-400">&gt;70% Fatigue</div>
                <div className="text-[9px] text-neutral-500">Severe burnout</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="font-bold text-red-400">0% Eff.</div>
                <div className="text-neutral-400">Injured</div>
                <div className="text-[9px] text-neutral-500">Rehabilitation</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SQUAD WORKLOAD & FATIGUE MANAGEMENT TABLE */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-bold text-sm text-white flex items-center space-x-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              <span>Squad Conditioning & Individual Load Management</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Designate individual rest to tired players to recover +40% fatigue next week
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center space-x-1.5 text-xs">
            {[
              { id: 'ALL', label: `All (${clubPlayers.length})` },
              { id: 'FATIGUED', label: `Fatigued (${highFatiguePlayers.length})` },
              { id: 'INJURED', label: `Injured (${injuredPlayers.length})` },
              { id: 'RESTED', label: `Rested (${restedPlayers.length})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterView(f.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterView === f.id
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-[10px] text-neutral-400 uppercase font-semibold border-b border-neutral-800 bg-neutral-950/60">
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-2">Position</th>
                <th className="py-2.5 px-2 text-center">Fitness</th>
                <th className="py-2.5 px-2 text-center">Fatigue</th>
                <th className="py-2.5 px-2 text-center">Training Eff.</th>
                <th className="py-2.5 px-3 text-center">Medical Status</th>
                <th className="py-2.5 px-3 text-right">Load Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              {displayedPlayers.map(p => {
                const eff = careerManager.calculateTrainingEfficiency(p);
                const isFatigued = p.fatigue > 60;
                const isExhausted = p.fatigue > 75;

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-neutral-800/30 ${
                      p.injury ? 'bg-red-950/15' : p.isRestedThisWeek ? 'bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-neutral-100">{p.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono-numbers">
                        {p.squadRole} · {p.age} y/o · OVR {p.overall}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 font-mono-numbers text-neutral-300">
                      {getPositionShort(p.primaryPosition)}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono-numbers">
                      <span className={`font-semibold ${p.fitness < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {p.fitness}%
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono-numbers">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isExhausted
                          ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                          : isFatigued
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60'
                      }`}>
                        {p.fatigue}%
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono-numbers font-bold">
                      <span className={p.injury ? 'text-red-400' : eff < 50 ? 'text-amber-400' : 'text-emerald-400'}>
                        {eff}%
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {p.injury ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 text-[10px] font-semibold whitespace-nowrap">
                          🚑 {p.injury.name} ({p.injury.weeksRemaining}w)
                        </span>
                      ) : p.isRestedThisWeek ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-semibold">
                          🛌 Designated Rest
                        </span>
                      ) : isExhausted ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/80 text-[10px]">
                          ⚠️ Exhausted
                        </span>
                      ) : isFatigued ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/80 text-[10px]">
                          Tired (Rotate)
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[10px]">
                          ✓ Optimal
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {p.injury ? (
                        <span className="text-[10px] text-neutral-500 italic">In Rehab</span>
                      ) : (
                        <button
                          onClick={() => handleToggleRest(p.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            p.isRestedThisWeek
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                              : isFatigued
                              ? 'bg-amber-600/30 hover:bg-amber-600 border border-amber-500/50 text-amber-300 hover:text-white'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                          }`}
                          title={p.isRestedThisWeek ? 'Cancel individual rest' : 'Grant individual rest this week'}
                        >
                          {p.isRestedThisWeek ? 'Rested ✓' : isFatigued ? 'Rest Player 🛌' : 'Rest'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
