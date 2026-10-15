import React, { useState, useEffect } from 'react';
import { Player, RugbyPosition, PlayerAttributes } from '../types/rugby';
import { calculatePlayerOverall, POSITIONS_ORDER, getPositionName } from '../data/rugbyDatabase';
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
  Award
} from 'lucide-react';

interface PlayerEditorModalProps {
  player: Player;
  clubCountry?: string;
  onSave: (updatedPlayer: Player) => void;
  onClose: () => void;
}

type AttributeGroupKey = 'physical' | 'defence' | 'attack' | 'kicking' | 'setpiece' | 'mental';

interface AttributeMeta {
  key: keyof PlayerAttributes;
  label: string;
  desc: string;
  category: AttributeGroupKey;
}

const ATTRIBUTES_CONFIG: AttributeMeta[] = [
  // Physical & Pace
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
  { key: 'hooking', label: 'Lineout Throwing & Hooking', desc: 'Arrow accuracy at the front/back of lineout and striking in scrum', category: 'setpiece' },
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

export const PlayerEditorModal: React.FC<PlayerEditorModalProps> = ({
  player,
  clubCountry,
  onSave,
  onClose
}) => {
  const { formatMoney } = useCurrency(clubCountry);

  // Form State
  const [name, setName] = useState<string>(player.name);
  const [age, setAge] = useState<number>(player.age);
  const [nationality, setNationality] = useState<string>(player.nationality || 'South Africa');
  const [primaryPosition, setPrimaryPosition] = useState<RugbyPosition>(player.primaryPosition);
  const [secondaryPositions, setSecondaryPositions] = useState<RugbyPosition[]>(player.secondaryPositions || []);
  const [potential, setPotential] = useState<number>(player.potential || player.overall);
  const [attributes, setAttributes] = useState<PlayerAttributes>({ ...player.attributes });
  const [activeTab, setActiveTab] = useState<AttributeGroupKey | 'all'>('all');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Dynamically calculated overall based on current attributes and primary position
  const currentOverall = calculatePlayerOverall(primaryPosition, attributes);

  // Sync state if player prop changes
  useEffect(() => {
    setName(player.name);
    setAge(player.age);
    setNationality(player.nationality || 'South Africa');
    setPrimaryPosition(player.primaryPosition);
    setSecondaryPositions(player.secondaryPositions || []);
    setPotential(player.potential || player.overall);
    setAttributes({ ...player.attributes });
  }, [player]);

  const handleAttributeChange = (key: keyof PlayerAttributes, val: number) => {
    const clamped = Math.max(1, Math.min(99, Math.round(val)));
    setAttributes(prev => ({
      ...prev,
      [key]: clamped
    }));
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
    setAttributes({ ...player.attributes });
  };

  const handleToggleSecondaryPosition = (pos: RugbyPosition) => {
    if (pos === primaryPosition) return;
    setSecondaryPositions(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    soundFx.playCrowdCheer();

    // Recalculate market value and weekly wage based on new stats and age
    const finalOverall = calculatePlayerOverall(primaryPosition, attributes);
    const baseFactor = Math.pow(finalOverall / 65, 3.8);
    const ageFactor = age <= 23 ? 1.35 : age <= 29 ? 1.15 : age <= 33 ? 0.85 : 0.6;
    const marketValue = Math.round(baseFactor * ageFactor * 1250000);
    const weeklyWage = Math.max(1200, Math.round((marketValue / 52) * 0.12));

    const updated: Player = {
      ...player,
      name: name.trim(),
      age,
      nationality: nationality.trim(),
      primaryPosition,
      secondaryPositions,
      potential: Math.max(finalOverall, potential),
      overall: finalOverall,
      attributes,
      marketValue,
      weeklyWage
    };

    onSave(updated);
    setSavedFeedback(true);
    setTimeout(() => {
      onClose();
    }, 450);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 text-neutral-100 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 border border-emerald-400 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-950/40 shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-heading font-black text-lg sm:text-xl text-white tracking-wide">
                  PLAYER EDITOR & RATING TUNER
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  Customise Stats
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Manually edit player name, positions, and individual attributes to make ratings higher or lower
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Overall Rating Badge */}
            <div className="bg-neutral-950/90 border border-emerald-500/60 rounded-2xl px-4 py-2 flex items-center space-x-3 shadow-inner">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-none">
                  Live Rating
                </span>
                <span className="text-xs text-emerald-400 font-semibold">
                  {currentOverall >= 90 ? 'World Class' : currentOverall >= 82 ? 'Elite' : currentOverall >= 74 ? 'Starting' : 'Squad'}
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-600/30 border border-emerald-400/50 flex flex-col items-center justify-center font-heading font-black text-emerald-300">
                <span className="text-xl leading-none font-mono-numbers">{currentOverall}</span>
                <span className="text-[8px] uppercase tracking-wider text-emerald-400/80 font-bold">OVR</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Tuning Toolbar */}
        <div className="bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800 mb-4 shrink-0 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-heading font-bold text-neutral-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Rating Presets:</span>
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => handleScaleToTargetOvr(p.targetOvr)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-heading font-bold text-white transition-all cursor-pointer shadow-sm ${p.color}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleBulkAdjust(5)}
                className="px-2 py-1 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 text-xs font-bold border border-emerald-600/40 cursor-pointer"
                title="Add 5 to all attributes"
              >
                +5 All
              </button>
              <button
                onClick={() => handleBulkAdjust(-5)}
                className="px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-800 text-red-200 text-xs font-bold border border-red-700/40 cursor-pointer"
                title="Subtract 5 from all attributes"
              >
                -5 All
              </button>
              <button
                onClick={handleReset}
                className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer ml-1"
                title="Reset to Original Stats"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Editor Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* SECTION 1: PLAYER BIOGRAPHY & POSITIONS */}
          <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800/80 space-y-4">
            <span className="text-xs font-heading font-bold text-emerald-400 uppercase tracking-wider block">
              Player Identity & Positional Roles
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Name */}
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
                  placeholder="Player Full Name"
                />
              </div>

              {/* Age */}
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                  Age ({age} Years Old)
                </label>
                <input
                  type="range"
                  min="18"
                  max="40"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Potential */}
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                  Potential Rating ({potential} POT)
                </label>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={potential}
                  onChange={e => setPotential(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Primary Position Selection */}
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1.5">
                Primary Position (Dictates tactical weightings)
              </label>
              <select
                value={primaryPosition}
                onChange={e => {
                  const newPos = e.target.value as RugbyPosition;
                  setPrimaryPosition(newPos);
                  setSecondaryPositions(prev => prev.filter(p => p !== newPos));
                }}
                className="w-full sm:w-auto bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {POSITIONS_ORDER.map(pos => (
                  <option key={pos} value={pos}>
                    {getPositionName(pos)} ({pos})
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Positions Pills */}
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1.5">
                Approved Secondary Positions (Click to toggle)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POSITIONS_ORDER.filter(pos => pos !== primaryPosition).map(pos => {
                  const isSelected = secondaryPositions.includes(pos);
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => handleToggleSecondaryPosition(pos)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {getPositionName(pos)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: ATTRIBUTE CATEGORY FILTER */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-heading font-bold text-neutral-300 uppercase tracking-wider">
                Individual Rugby Attributes (1–99)
              </span>
              <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
                {(['all', 'physical', 'defence', 'attack', 'kicking', 'setpiece', 'mental'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-xl font-heading font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAttributes.map(attr => {
                const val = attributes[attr.key];
                return (
                  <div
                    key={attr.key}
                    className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 hover:border-neutral-700 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-heading font-bold text-xs text-white block">
                          {attr.label}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {attr.desc}
                        </span>
                      </div>
                      <div className={`px-2.5 py-1 rounded-xl border font-mono-numbers font-black text-sm ${getAttributeColor(val)}`}>
                        {val}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="1"
                        max="99"
                        value={val}
                        onChange={e => handleAttributeChange(attr.key, Number(e.target.value))}
                        className="flex-1 accent-emerald-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={val}
                        onChange={e => handleAttributeChange(attr.key, Number(e.target.value))}
                        className="w-14 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-center font-mono-numbers text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-neutral-800 mt-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400">
            Projected Market Value: <span className="font-mono-numbers text-emerald-400 font-bold">
              {formatMoney(Math.round(Math.pow(currentOverall / 65, 3.8) * 1250000), { compact: true })}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-heading font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-heading font-black text-xs tracking-wider flex items-center space-x-2 shadow-lg shadow-emerald-950/60 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{savedFeedback ? 'SAVED!' : 'SAVE PLAYER CHANGES'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
