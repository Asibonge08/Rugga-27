import React, { useState, useEffect } from 'react';
import { Player, RugbyPosition, PlayerAttributes } from '../types/rugby';
import { calculatePlayerOverall, POSITIONS_ORDER, getPositionName, getPositionShort } from '../data/rugbyDatabase';
import { soundFx } from '../services/soundFx';
import { useCurrency } from '../services/currencyService';
import {
  X,
  User,
  Sliders,
  Sparkles,
  Shield,
  Save,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUp,
  ArrowDown,
  Activity,
  Award,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Users,
  Heart
} from 'lucide-react';

export interface PlayerEditModalProps {
  player: Player;
  playerList?: Player[];
  clubCountry?: string;
  onSave: (updatedPlayer: Player) => void;
  onClose: () => void;
  onSelectPlayer?: (nextPlayer: Player) => void;
}

type AttributeGroupKey = 'all' | 'physical' | 'defence' | 'attack' | 'kicking' | 'setpiece' | 'mental';

interface AttributeMeta {
  key: keyof PlayerAttributes;
  label: string;
  desc: string;
  category: AttributeGroupKey;
}

const ATTRIBUTES_CONFIG: AttributeMeta[] = [
  // Physical & Engine
  { key: 'speed', label: 'Speed & Acceleration', desc: 'Sprint velocity and burst in open field', category: 'physical' },
  { key: 'strength', label: 'Strength & Power', desc: 'Core collision force and leg drive', category: 'physical' },
  { key: 'fitness', label: 'Aerobic Fitness & Engine', desc: 'Stamina throughout 80 minutes of intensity', category: 'physical' },

  // Defence & Breakdown
  { key: 'tackling', label: 'Dominant Tackling', desc: 'Contact technique, choke tackles & stop power', category: 'defence' },
  { key: 'breakdown', label: 'Breakdown & Jackaling', desc: 'Ruck contest, counter-rucking & turnover threat', category: 'defence' },
  { key: 'workRate', label: 'Defensive Work Rate', desc: 'Relentless fold speed and secondary phase involvement', category: 'defence' },

  // Attack & Ball Skills
  { key: 'carrying', label: 'Hard Ball Carrying', desc: 'Gainline collision impact and tackle breaking', category: 'attack' },
  { key: 'offloading', label: 'Offloading in Contact', desc: 'Flick passes out of tackles and continuity', category: 'attack' },
  { key: 'passing', label: 'Bullet Passing & Distribution', desc: 'Crisp spin and spiral delivery across the backline', category: 'attack' },

  // Kicking
  { key: 'kicking', label: 'Tactical Clearance Kicking', desc: 'Spiral distance, 50:22 execution & territory', category: 'kicking' },
  { key: 'goalKicking', label: 'Goal Kicking Precision', desc: 'Penalty and conversion striking from the tee', category: 'kicking' },

  // Set Piece
  { key: 'scrummaging', label: 'Scrummaging Power', desc: 'Anchor lock, bind control and front row leverage', category: 'setpiece' },
  { key: 'hooking', label: 'Lineout Throwing & Hooking', desc: 'Accuracy at lineout and striking in scrum', category: 'setpiece' },
  { key: 'lineout', label: 'Lineout Jumping & Aerial Timing', desc: 'Jumping reach, hang time and kick contestation', category: 'setpiece' },

  // Mental
  { key: 'tacticalAwareness', label: 'Tactical Awareness & Game IQ', desc: 'Vision, reading defensive gaps and game control', category: 'mental' },
  { key: 'consistency', label: 'Mental Composure & Discipline', desc: 'Clutch decisions under pressure and low penalty count', category: 'mental' }
];

const PRESETS = [
  { label: 'Springbok Super Star (95 OVR)', targetOvr: 95, color: 'bg-emerald-600 hover:bg-emerald-500' },
  { label: 'International Tier (90 OVR)', targetOvr: 90, color: 'bg-teal-600 hover:bg-teal-500' },
  { label: 'URC Marquee Star (85 OVR)', targetOvr: 85, color: 'bg-amber-600 hover:bg-amber-500' },
  { label: 'Solid Pro Starter (78 OVR)', targetOvr: 78, color: 'bg-blue-600 hover:bg-blue-500' },
  { label: 'Club Prospect (68 OVR)', targetOvr: 68, color: 'bg-neutral-700 hover:bg-neutral-600' }
];

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
  player,
  playerList,
  clubCountry,
  onSave,
  onClose,
  onSelectPlayer
}) => {
  const { formatMoney } = useCurrency(clubCountry);

  // Form State
  const [name, setName] = useState<string>(player.name);
  const [age, setAge] = useState<number>(player.age);
  const [nationality, setNationality] = useState<string>(player.nationality || 'South Africa');
  const [primaryPosition, setPrimaryPosition] = useState<RugbyPosition>(player.primaryPosition);
  const [secondaryPositions, setSecondaryPositions] = useState<RugbyPosition[]>(player.secondaryPositions || []);
  const [potential, setPotential] = useState<number>(player.potential || player.overall);
  const [fitness, setFitness] = useState<number>(player.fitness ?? 90);
  const [morale, setMorale] = useState<number>(player.morale ?? 85);
  const [attributes, setAttributes] = useState<PlayerAttributes>({ ...player.attributes });
  const [activeTab, setActiveTab] = useState<AttributeGroupKey>('all');
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Current index in player list
  const currentIndex = playerList ? playerList.findIndex(p => p.id === player.id) : -1;
  const hasPrev = playerList && currentIndex > 0;
  const hasNext = playerList && currentIndex >= 0 && currentIndex < playerList.length - 1;

  // Dynamically calculate overall rating
  const currentOverall = calculatePlayerOverall(primaryPosition, attributes);

  // Sync state if player prop changes
  useEffect(() => {
    setName(player.name);
    setAge(player.age);
    setNationality(player.nationality || 'South Africa');
    setPrimaryPosition(player.primaryPosition);
    setSecondaryPositions(player.secondaryPositions || []);
    setPotential(player.potential || player.overall);
    setFitness(player.fitness ?? 90);
    setMorale(player.morale ?? 85);
    setAttributes({ ...player.attributes });
    setSavedFeedback(null);
  }, [player]);

  const handleAttributeChange = (key: keyof PlayerAttributes, val: number) => {
    const clamped = Math.max(1, Math.min(99, Math.round(val)));
    setAttributes(prev => {
      const next = {
        ...prev,
        [key]: clamped
      };
      if (key === 'fitness') {
        setFitness(clamped);
      }
      return next;
    });
  };

  // Adjust all attributes by a fixed delta (+5, -5, +1, -1)
  const handleBulkAdjust = (delta: number) => {
    soundFx.playClick();
    setAttributes(prev => {
      const next = { ...prev };
      (Object.keys(next) as (keyof PlayerAttributes)[]).forEach(k => {
        next[k] = Math.max(1, Math.min(99, next[k] + delta));
      });
      return next;
    });
  };

  // Auto-scale all attributes to reach a target overall rating
  const handleScaleToTargetOvr = (targetOvr: number) => {
    soundFx.playClick();
    const current = calculatePlayerOverall(primaryPosition, attributes);
    const diff = targetOvr - current;
    if (diff === 0) return;

    setAttributes(prev => {
      const next = { ...prev };
      (Object.keys(next) as (keyof PlayerAttributes)[]).forEach(k => {
        const adjusted = Math.round(next[k] + diff);
        next[k] = Math.max(25, Math.min(99, adjusted));
      });
      return next;
    });

    if (targetOvr > potential) {
      setPotential(Math.min(99, targetOvr + 2));
    }
  };

  const handleReset = () => {
    soundFx.playClick();
    setName(player.name);
    setAge(player.age);
    setNationality(player.nationality || 'South Africa');
    setPrimaryPosition(player.primaryPosition);
    setSecondaryPositions(player.secondaryPositions || []);
    setPotential(player.potential || player.overall);
    setFitness(player.fitness ?? 90);
    setMorale(player.morale ?? 85);
    setAttributes({ ...player.attributes });
    setSavedFeedback('Reset to original values');
    setTimeout(() => setSavedFeedback(null), 1500);
  };

  const handleToggleSecondaryPosition = (pos: RugbyPosition) => {
    if (pos === primaryPosition) return;
    setSecondaryPositions(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };

  const buildUpdatedPlayer = (): Player => {
    const finalOverall = calculatePlayerOverall(primaryPosition, attributes);
    const baseFactor = Math.pow(finalOverall / 65, 3.8);
    const ageFactor = age <= 23 ? 1.35 : age <= 29 ? 1.15 : age <= 33 ? 0.85 : 0.6;
    const marketValue = Math.round(baseFactor * ageFactor * 1250000);
    const weeklyWage = Math.max(1200, Math.round((marketValue / 52) * 0.12));

    return {
      ...player,
      name: name.trim() || player.name,
      age,
      nationality: nationality.trim() || 'South Africa',
      primaryPosition,
      secondaryPositions,
      potential: Math.max(finalOverall, potential),
      overall: finalOverall,
      fitness,
      morale,
      attributes: {
        ...attributes,
        fitness // sync fitness into attributes as well
      },
      marketValue,
      weeklyWage
    };
  };

  const handleSave = (autoClose: boolean = true) => {
    if (!name.trim()) return;
    soundFx.playCrowdCheer();

    const updated = buildUpdatedPlayer();
    onSave(updated);

    setSavedFeedback(`Saved ${updated.name} (${updated.overall} OVR)!`);

    if (autoClose) {
      setTimeout(() => {
        onClose();
      }, 450);
    } else {
      setTimeout(() => setSavedFeedback(null), 1500);
    }
  };

  const handleNavigatePlayer = (direction: 'prev' | 'next') => {
    if (!playerList || !onSelectPlayer) return;
    soundFx.playClick();

    // Auto-save current player before moving to next/prev
    const updated = buildUpdatedPlayer();
    onSave(updated);

    const targetIdx = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIdx >= 0 && targetIdx < playerList.length) {
      onSelectPlayer(playerList[targetIdx]);
    }
  };

  const handleSaveAndNext = () => {
    if (hasNext && playerList && onSelectPlayer) {
      soundFx.playWhistle('short');
      const updated = buildUpdatedPlayer();
      onSave(updated);
      setSavedFeedback(`Saved ${updated.name}! Loading next player...`);
      setTimeout(() => {
        onSelectPlayer(playerList[currentIndex + 1]);
      }, 250);
    } else {
      handleSave(true);
    }
  };

  const getAttributeColor = (val: number) => {
    if (val >= 90) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (val >= 82) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (val >= 75) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (val >= 68) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  const filteredAttributes = activeTab === 'all'
    ? ATTRIBUTES_CONFIG
    : ATTRIBUTES_CONFIG.filter(a => a.category === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-6 text-neutral-100 shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* TOP HEADER & TEAM LIST NAVIGATION */}
        <div className="pb-3 border-b border-neutral-800 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 border border-emerald-400 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-950/40 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-heading font-black text-base sm:text-lg text-white tracking-wide">
                    PLAYER EDIT & RATING TUNER
                  </h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Manual Customisation
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Edit player names, primary positions, and tune ratings higher or lower
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Live Overall Rating Badge */}
              <div className="bg-neutral-950/90 border border-emerald-500/60 rounded-2xl px-3.5 py-1.5 flex items-center space-x-2.5 shadow-inner">
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block">
                    Calculated OVR
                  </span>
                  <span className="font-heading font-black text-xl text-emerald-400 font-mono-numbers leading-none">
                    {currentOverall}
                  </span>
                </div>
                <div className="h-7 w-px bg-neutral-800" />
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold block">
                    Potential
                  </span>
                  <span className="font-heading font-black text-lg text-amber-400 font-mono-numbers leading-none">
                    {potential}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Close Editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* TEAM LIST NAVIGATION STRIP (Step through player to player) */}
          {playerList && playerList.length > 0 && (
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-heading font-bold text-neutral-200">
                  Team List:
                </span>
                <span className="text-xs text-neutral-400 font-mono-numbers">
                  Player {currentIndex + 1} of {playerList.length}
                </span>

                {/* Quick Dropdown to jump directly to any player */}
                {onSelectPlayer && (
                  <select
                    value={player.id}
                    onChange={(e) => {
                      const next = playerList.find(p => p.id === e.target.value);
                      if (next) {
                        const updated = buildUpdatedPlayer();
                        onSave(updated);
                        onSelectPlayer(next);
                      }
                    }}
                    className="ml-2 text-xs bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {playerList.map((p, idx) => (
                      <option key={p.id} value={p.id}>
                        #{idx + 1} {p.name} ({getPositionShort(p.primaryPosition)} · {p.overall} OVR)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Prev / Next Player Buttons */}
              <div className="flex items-center space-x-1.5 ml-auto">
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => handleNavigatePlayer('prev')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                    hasPrev
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer'
                      : 'bg-neutral-900 text-neutral-600 cursor-not-allowed opacity-50'
                  }`}
                  title={hasPrev ? `Previous: ${playerList[currentIndex - 1].name}` : 'First player in team list'}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev Player</span>
                </button>

                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => handleNavigatePlayer('next')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                    hasNext
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer'
                      : 'bg-neutral-900 text-neutral-600 cursor-not-allowed opacity-50'
                  }`}
                  title={hasNext ? `Next: ${playerList[currentIndex + 1].name}` : 'Last player in team list'}
                >
                  <span className="hidden sm:inline">Next Player</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">

          {/* BASIC PLAYER IDENTITY & POSITIONS */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-heading font-bold text-emerald-400 tracking-wider uppercase">
              <User className="w-3.5 h-3.5" />
              <span>Player Identity & Positional Roles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Player Full Name */}
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Siya Kolisi"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Primary Position */}
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                  Primary Position
                </label>
                <select
                  value={primaryPosition}
                  onChange={(e) => {
                    const newPos = e.target.value as RugbyPosition;
                    setPrimaryPosition(newPos);
                    setSecondaryPositions(prev => prev.filter(p => p !== newPos));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {POSITIONS_ORDER.map(pos => (
                    <option key={pos} value={pos}>
                      {getPositionName(pos)} ({getPositionShort(pos)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nationality & Age */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="17"
                    max="45"
                    value={age}
                    onChange={(e) => setAge(Math.max(17, Math.min(45, parseInt(e.target.value) || 24)))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-sm font-mono-numbers font-semibold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                    Nation
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Secondary Positions Selector */}
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                Secondary Positions (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1.5 bg-neutral-900/60 rounded-xl border border-neutral-800">
                {POSITIONS_ORDER.filter(pos => pos !== primaryPosition).map(pos => {
                  const isSelected = secondaryPositions.includes(pos);
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => handleToggleSecondaryPosition(pos)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono-numbers font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {getPositionShort(pos)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BASE ABILITY, POTENTIAL & FITNESS ADJUSTERS */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-heading font-bold text-amber-400 tracking-wider uppercase">
                <Flame className="w-3.5 h-3.5" />
                <span>Core Player Ratings: Base Ability, Potential & Fitness</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono-numbers">
                Estimated Value: {formatMoney(Math.round(Math.pow(currentOverall / 65, 3.8) * 1250000), { compact: true })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Base Ability / Target Overall Auto-scaler */}
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-300">Base Ability (OVR)</span>
                  <span className="font-mono-numbers font-black text-emerald-400 text-sm">
                    {currentOverall}
                  </span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="99"
                  value={currentOverall}
                  onChange={(e) => handleScaleToTargetOvr(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>Scale Down (-OVR)</span>
                  <span>Scale Up (+OVR)</span>
                </div>
              </div>

              {/* Potential Slider */}
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-300">Potential Rating</span>
                  <span className="font-mono-numbers font-black text-amber-400 text-sm">
                    {potential}
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.max(45, currentOverall)}
                  max="99"
                  value={potential}
                  onChange={(e) => setPotential(Math.max(currentOverall, parseInt(e.target.value)))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>Min: {currentOverall}</span>
                  <span>Room: +{potential - currentOverall}</span>
                  <span>Max: 99</span>
                </div>
              </div>

              {/* Fitness Slider */}
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-300">Match Fitness</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono-numbers font-black text-cyan-400 text-sm">
                      {fitness}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setFitness(100);
                        handleAttributeChange('fitness', 99);
                      }}
                      className="text-[9px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 px-1.5 py-0.5 rounded hover:bg-cyan-900 cursor-pointer"
                    >
                      Max 100%
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={fitness}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFitness(val);
                    handleAttributeChange('fitness', Math.min(99, val));
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>Fatigued (20%)</span>
                  <span>Peak (100%)</span>
                </div>
              </div>
            </div>

            {/* Quick Bulk Steppers & Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/60">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  Quick Rating Adjust:
                </span>
                <button
                  type="button"
                  onClick={() => handleBulkAdjust(-5)}
                  className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-red-400 text-xs font-mono-numbers font-bold cursor-pointer"
                  title="Decrease all stats by 5"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAdjust(-1)}
                  className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-red-300 text-xs font-mono-numbers font-bold cursor-pointer"
                  title="Decrease all stats by 1"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAdjust(1)}
                  className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-300 text-xs font-mono-numbers font-bold cursor-pointer"
                  title="Increase all stats by 1"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAdjust(5)}
                  className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-xs font-mono-numbers font-bold cursor-pointer"
                  title="Increase all stats by 5"
                >
                  +5
                </button>
              </div>

              {/* Rating Presets */}
              <div className="flex items-center space-x-1 overflow-x-auto py-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1">
                  Preset:
                </span>
                {PRESETS.map(preset => (
                  <button
                    key={preset.targetOvr}
                    type="button"
                    onClick={() => handleScaleToTargetOvr(preset.targetOvr)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-heading font-bold text-white transition-all cursor-pointer whitespace-nowrap ${preset.color}`}
                  >
                    {preset.targetOvr} OVR
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GRANULAR RUGBY ATTRIBUTES EDITOR */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-xs font-heading font-bold text-neutral-300 tracking-wider uppercase">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Granular Rugby Attributes (1 - 99)</span>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px]">
                {(['all', 'physical', 'defence', 'attack', 'kicking', 'setpiece', 'mental'] as AttributeGroupKey[]).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2 py-1 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredAttributes.map(attr => {
                const val = attributes[attr.key] ?? 70;
                const colorClass = getAttributeColor(val);

                return (
                  <div
                    key={attr.key}
                    className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between space-y-2 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-neutral-200 block">
                          {attr.label}
                        </span>
                        <span className="text-[10px] text-neutral-400 block line-clamp-1">
                          {attr.desc}
                        </span>
                      </div>

                      {/* Attribute value badge & direct number input */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={val}
                          onChange={(e) => handleAttributeChange(attr.key, parseInt(e.target.value) || 50)}
                          className={`w-12 text-center py-0.5 rounded-lg text-xs font-heading font-black border font-mono-numbers focus:outline-none focus:ring-1 focus:ring-emerald-500 ${colorClass}`}
                        />
                      </div>
                    </div>

                    {/* Range slider */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="25"
                        max="99"
                        value={val}
                        onChange={(e) => handleAttributeChange(attr.key, parseInt(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="pt-3 border-t border-neutral-800 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Reset player to original values"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {savedFeedback && (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{savedFeedback}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            {/* Save and Next Player (Go down the team list) */}
            {hasNext && onSelectPlayer && (
              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-heading font-bold text-xs tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-amber-950/40"
                title="Save current player and edit next player down the team list"
              >
                <span>Save & Next Player</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Save & Finish */}
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
